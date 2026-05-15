-- ============================================================================
-- BETA_SETUP.sql — Setup COMPLETO del sistema de extractos para beta
-- ============================================================================
-- Pegar TODO este archivo en el SQL Editor del proyecto Supabase y ejecutar.
-- Es idempotente: puedes correrlo múltiples veces sin romper nada.
--
-- Equivale a:
--   0001_initial.sql + 0002_billing.sql + 0003_storage.sql
-- + 0004_grants.sql + 0005_feedback_bertha.sql + seed institucional.
--
-- Lo que hace:
--   1. Tablas: orders, signers, admin_users, settings (con facturación a empresa).
--   2. Trigger numeración RLF-YYYY-NNNN y triggers updated_at.
--   3. Row Level Security en todas las tablas.
--   4. GRANTs explícitos a service_role para que el backend pueda insertar.
--   5. Buckets privados de Storage (signatures, stamps) con policies admin-only.
--   6. Seed institucional (datos reales de la radio).
--   7. Tarifario beta: $35.000 mín 5 líneas, +$2.000 por línea adicional.
--   8. Horarios: 3 emisiones cada 5 minutos (10:00, 10:05, 10:10).
--   9. Firmante Bertha Cabral cargado y marcado como default.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ============================================================================
-- 1) TABLAS
-- ============================================================================

-- ─── settings ───────────────────────────────────────────────────────────────
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─── signers ────────────────────────────────────────────────────────────────
create table if not exists public.signers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  rut text not null,
  title text not null,
  signature_image_path text,
  stamp_image_path text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ─── admin_users ────────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

-- ─── orders ─────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Cliente
  client_name text not null,
  client_rut text not null,
  client_email text not null,
  client_phone text not null,
  client_organization text,
  client_gender text not null default 'ambos' check (client_gender in ('sr', 'sra', 'ambos')),

  -- Texto y monto. amount_clp es el TOTAL del bundle (suma de extractos).
  -- extract_text/line_count y demás columnas de "trámite" son snapshot
  -- legacy del primer extracto (back-compat). La fuente de verdad está en
  -- la tabla `order_extracts`.
  extract_text text,
  line_count integer check (line_count >= 1),
  amount_clp integer not null check (amount_clp >= 0),

  -- Trámite (snapshot legacy del primer extracto — ver order_extracts)
  procedure_type text check (procedure_type in ('dga_subterraneas', 'dga_superficiales', 'dia_seia', 'otro')),
  comuna text,
  provincia text,
  region text,
  publication_day smallint check (publication_day in (1, 15)),
  publication_month text,
  resolved_publication_date date,

  -- Estado
  status text not null default 'draft' check (status in (
    'draft', 'pending_payment', 'paid', 'scheduled',
    'broadcast_complete', 'certificate_generated', 'certificate_sent',
    'completed', 'payment_failed', 'cancelled'
  )),
  payment_provider text,
  payment_id text,
  payment_method text,
  paid_at timestamptz,

  -- Difusión
  broadcast_time_1 time,
  broadcast_time_2 time,
  broadcast_time_3 time,
  broadcast_marked_at timestamptz,
  broadcast_marked_by uuid references public.admin_users(id),

  -- Certificado
  certificate_pdf_path text,
  certificate_generated_at timestamptz,
  certificate_sent_at timestamptz,
  certificate_sent_to text,
  certificate_signer_id uuid references public.signers(id),

  -- Admin
  admin_notes text,
  cancelled_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.admin_users(id),

  -- Facturación a empresa (siempre obligatoria)
  requires_invoice boolean not null default true,
  billing_legal_name text,
  billing_rut text,
  billing_address text,
  billing_giro text,
  billing_email text
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_resolved_date on public.orders(resolved_publication_date);
create index if not exists idx_orders_email on public.orders(lower(client_email));
create index if not exists idx_orders_created_at on public.orders(created_at desc);
create index if not exists idx_orders_billing_rut on public.orders(billing_rut) where billing_rut is not null;

-- ─── order_extracts ────────────────────────────────────────────────────────
-- Una orden (bundle) agrupa 1..20 extractos. Cada extracto sigue su propio
-- camino de difusión y certificado. Comparten cliente, facturación y pago.
create table if not exists public.order_extracts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  extract_index smallint not null check (extract_index between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  extract_text text not null,
  line_count integer not null check (line_count >= 1),
  amount_clp integer not null check (amount_clp >= 0),

  procedure_type text not null check (procedure_type in (
    'dga_subterraneas', 'dga_superficiales', 'dia_seia', 'otro'
  )),
  comuna text not null,
  provincia text not null,
  region text not null,
  publication_day smallint not null check (publication_day in (1, 15)),
  publication_month text not null,
  resolved_publication_date date not null,

  status text not null default 'scheduled' check (status in (
    'scheduled', 'broadcast_complete',
    'certificate_generated', 'certificate_sent', 'cancelled'
  )),

  broadcast_time_1 time,
  broadcast_time_2 time,
  broadcast_time_3 time,
  broadcast_marked_at timestamptz,
  broadcast_marked_by uuid references public.admin_users(id),

  certificate_pdf_path text,
  certificate_generated_at timestamptz,
  certificate_sent_at timestamptz,
  certificate_sent_to text,
  certificate_signer_id uuid references public.signers(id),

  -- Horario asignado (Bertha 2026-05-15): A = 8/10/12, B = 9/11/13.
  -- Cada bloque tiene 24 cupos por fecha. Se asigna al marcar la orden pagada.
  time_block text check (time_block in ('A', 'B')),
  time_block_position smallint check (time_block_position between 1 and 24),

  unique (order_id, extract_index)
);

create index if not exists idx_order_extracts_order_id on public.order_extracts(order_id);
create index if not exists idx_order_extracts_status on public.order_extracts(status);
create index if not exists idx_order_extracts_resolved_date on public.order_extracts(resolved_publication_date);
create index if not exists idx_order_extracts_block_date on public.order_extracts(resolved_publication_date, time_block);
create unique index if not exists idx_order_extracts_block_slot
  on public.order_extracts(resolved_publication_date, time_block, time_block_position)
  where time_block is not null and time_block_position is not null;

-- ============================================================================
-- 2) TRIGGERS
-- ============================================================================

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_settings_updated_at on public.settings;
create trigger trg_settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

drop trigger if exists trg_order_extracts_updated_at on public.order_extracts;
create trigger trg_order_extracts_updated_at
  before update on public.order_extracts
  for each row execute function public.set_updated_at();

-- order_number auto: RLF-YYYY-NNNN, año Santiago
create or replace function public.assign_order_number()
returns trigger
language plpgsql
as $$
declare
  current_year text := to_char(now() at time zone 'America/Santiago', 'YYYY');
  next_n integer;
begin
  if new.order_number is null or new.order_number = '' then
    select coalesce(max(
      (regexp_match(order_number, '^RLF-' || current_year || '-(\d+)$'))[1]::integer
    ), 0) + 1
    into next_n
    from public.orders
    where order_number like 'RLF-' || current_year || '-%';
    new.order_number := 'RLF-' || current_year || '-' || lpad(next_n::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_orders_assign_number on public.orders;
create trigger trg_orders_assign_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

-- ============================================================================
-- 3) ROW LEVEL SECURITY
-- ============================================================================

alter table public.orders enable row level security;
alter table public.order_extracts enable row level security;
alter table public.settings enable row level security;
alter table public.signers enable row level security;
alter table public.admin_users enable row level security;

-- settings: cualquiera puede leer (frontend público necesita tarifario, etc.)
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- signers: solo admin
drop policy if exists "signers_admin_read" on public.signers;
create policy "signers_admin_read" on public.signers for select to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "signers_admin_write" on public.signers;
create policy "signers_admin_write" on public.signers for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- admin_users: cada user ve su perfil. La condición "admin ve todos" la resolvemos
-- con una función SECURITY DEFINER para evitar recursión en la propia policy
-- (PostgreSQL rechaza con "infinite recursion detected in policy" si la policy
-- de tabla X consulta la tabla X directamente).
create or replace function public.current_user_is_admin()
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and role = 'admin'
  );
$$;

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users for select to authenticated
  using (id = auth.uid());

drop policy if exists "admin_users_admin_read_all" on public.admin_users;
create policy "admin_users_admin_read_all" on public.admin_users for select to authenticated
  using (public.current_user_is_admin());

-- orders: solo admin (clientes ven su orden vía /orden/:n con lookup por number, no requiere RLS)
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "order_extracts_admin_all" on public.order_extracts;
create policy "order_extracts_admin_all" on public.order_extracts for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- ============================================================================
-- 4) GRANTs explícitos a service_role (CRÍTICO — sin esto el backend falla)
-- ============================================================================
-- Las tablas creadas vía SQL Editor pertenecen al rol postgres y NO heredan
-- permisos automáticos para service_role. Sin esto, el endpoint del backend
-- (que usa la sb_secret_ key) falla con `permission denied for table orders`.

grant usage on schema public to service_role, anon, authenticated;

-- service_role (backend): acceso total, bypasea RLS
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- authenticated (admin panel logueado): GRANT amplio, RLS controla qué ven
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- anon (público sin auth): solo lectura, RLS limita a settings_public_read
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

-- Default privileges para tablas/secuencias FUTURAS
alter default privileges in schema public
  grant all on tables    to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;

-- ============================================================================
-- 5) STORAGE — buckets privados para firma y timbre del firmante
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('signatures', 'signatures', false, 2097152, array['image/png','image/jpeg','image/webp']),
  ('stamps',     'stamps',     false, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Policies: solo admin/operator puede leer y escribir.
-- Drop defensivo para naming nuevo (_select) y antiguo (_read).

drop policy if exists "signatures_admin_read"   on storage.objects;
drop policy if exists "signatures_admin_select" on storage.objects;
drop policy if exists "signatures_admin_insert" on storage.objects;
drop policy if exists "signatures_admin_update" on storage.objects;
drop policy if exists "signatures_admin_delete" on storage.objects;
drop policy if exists "stamps_admin_read"   on storage.objects;
drop policy if exists "stamps_admin_select" on storage.objects;
drop policy if exists "stamps_admin_insert" on storage.objects;
drop policy if exists "stamps_admin_update" on storage.objects;
drop policy if exists "stamps_admin_delete" on storage.objects;

create policy "signatures_admin_select" on storage.objects for select to authenticated
  using (bucket_id = 'signatures' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "signatures_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'signatures' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "signatures_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'signatures' and exists (select 1 from public.admin_users where id = auth.uid()))
  with check (bucket_id = 'signatures' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "signatures_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'signatures' and exists (select 1 from public.admin_users where id = auth.uid()));

create policy "stamps_admin_select" on storage.objects for select to authenticated
  using (bucket_id = 'stamps' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "stamps_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'stamps' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "stamps_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'stamps' and exists (select 1 from public.admin_users where id = auth.uid()))
  with check (bucket_id = 'stamps' and exists (select 1 from public.admin_users where id = auth.uid()));
create policy "stamps_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'stamps' and exists (select 1 from public.admin_users where id = auth.uid()));

-- ============================================================================
-- 6) SEED — datos institucionales reales y tarifario beta
-- ============================================================================

insert into public.settings (key, value) values
  ('radio_legal_name', '"Sociedad Comercial de Radiodifusión y Publicidad del Sur Limitada"'::jsonb),
  ('radio_legal_rut', '"79.966.670-7"'::jsonb),
  ('radio_giro', '"Radiodifusión y Publicidad"'::jsonb),
  ('radio_brand_names', '["Radio La Frontera AM 1110", "Radio Araucana FM 95.9"]'::jsonb),
  ('radio_address', '"Caupolicán 110 Oficina 2003 Piso 20, Temuco, Región de La Araucanía"'::jsonb),
  ('radio_phone_landline', '"+56 45 2213166"'::jsonb),
  ('radio_phone_mobile', '"+56 9 4239 0216"'::jsonb),
  ('radio_email_administration', '"administracion@araucanayfrontera.cl"'::jsonb),
  ('radio_email_secretary', '"administracion@araucanayfrontera.cl"'::jsonb),
  ('radio_bank_name', '"Banco Santander"'::jsonb),
  ('radio_bank_account_type', '"Cuenta Corriente"'::jsonb),
  ('radio_bank_account_number', '"0-000-9874438-0"'::jsonb),
  ('radio_coverage_default', '"Provincia de Cautín, IX Región de La Araucanía"'::jsonb),
  ('default_broadcast_times', '["10:00", "10:05", "10:10"]'::jsonb),
  ('notification_emails', '["administracion@araucanayfrontera.cl"]'::jsonb),
  ('tariff_table', '{"minLinesFlat": 5, "minPrice": 36000, "baseAboveMin": 26000, "perLineAboveMin": 2000, "maxLines": 20}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- 7) FIRMANTE — Bertha Cabral (operadora, firma todos los certificados)
-- ============================================================================

insert into public.signers (full_name, rut, title, is_default, is_active)
select 'Bertha Raquel Cabral Corrales', '25.829.757-1', 'Operadora Radio La Frontera', true, true
where not exists (
  select 1 from public.signers where rut = '25.829.757-1'
);

update public.signers
   set is_default = true,
       is_active  = true,
       full_name  = 'Bertha Raquel Cabral Corrales',
       title      = 'Operadora Radio La Frontera'
 where rut = '25.829.757-1';

update public.signers
   set is_default = false
 where rut <> '25.829.757-1' and is_default = true;

-- ============================================================================
-- LISTO. Verificación rápida:
--
--   select count(*) as orders_count from public.orders;
--   -- esperado: 0 (todavía no hay órdenes)
--
--   select count(*) as settings_count from public.settings;
--   -- esperado: 16
--
--   select full_name, rut, is_default from public.signers;
--   -- esperado: Bertha Cabral, default = true
--
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='orders' and grantee='service_role';
--   -- esperado: 7 filas (SELECT, INSERT, UPDATE, DELETE, etc.)
--
--   select id, public, file_size_limit
--   from storage.buckets where id in ('signatures','stamps');
--   -- esperado: 2 filas, public=false, file_size_limit=2097152
-- ============================================================================
