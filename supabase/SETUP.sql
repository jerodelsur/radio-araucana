-- ============================================================================
-- SETUP COMPLETO — Sistema de extractos radiales (F1)
-- ============================================================================
-- Pegar TODO este archivo en el SQL Editor del proyecto Supabase y ejecutar.
-- Es idempotente: puedes correrlo múltiples veces sin romper nada.
--
-- Lo que hace:
--   1. Crea las tablas: orders, signers, admin_users, settings.
--   2. Activa Row Level Security con políticas razonables.
--   3. Agrega trigger de numeración automática RLF-YYYY-NNNN.
--   4. Crea las columnas de facturación a empresa.
--   5. Inserta seed con datos institucionales reales y tarifario.
--
-- Equivalente a correr 0001_initial.sql + 0002_billing.sql + seed.sql.
-- ============================================================================

create extension if not exists "pgcrypto";

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

  client_name text not null,
  client_rut text not null,
  client_email text not null,
  client_phone text not null,
  client_organization text,
  client_gender text not null default 'ambos' check (client_gender in ('sr', 'sra', 'ambos')),

  extract_text text not null,
  line_count integer not null check (line_count >= 1),
  amount_clp integer not null check (amount_clp >= 0),

  procedure_type text not null check (procedure_type in ('dga_subterraneas', 'dga_superficiales', 'dia_seia', 'otro')),
  comuna text not null,
  provincia text not null,
  region text not null,
  publication_day smallint not null check (publication_day in (1, 15)),
  publication_month text not null,
  resolved_publication_date date not null,

  status text not null default 'draft' check (status in (
    'draft', 'pending_payment', 'paid', 'scheduled',
    'broadcast_complete', 'certificate_generated', 'certificate_sent',
    'completed', 'payment_failed', 'cancelled'
  )),
  payment_provider text,
  payment_id text,
  payment_method text,
  paid_at timestamptz,

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

  admin_notes text,
  cancelled_reason text,
  cancelled_at timestamptz,
  cancelled_by uuid references public.admin_users(id),

  -- Facturación a empresa distinta del cliente persona.
  requires_invoice boolean not null default false,
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

-- ─── Trigger updated_at ─────────────────────────────────────────────────────
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

-- ─── Trigger asignar order_number RLF-YYYY-NNNN ─────────────────────────────
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

-- ─── RLS ────────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;
alter table public.settings enable row level security;
alter table public.signers enable row level security;
alter table public.admin_users enable row level security;

drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read" on public.settings for select using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write" on public.settings for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "signers_admin_read" on public.signers;
create policy "signers_admin_read" on public.signers for select to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "signers_admin_write" on public.signers;
create policy "signers_admin_write" on public.signers for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read" on public.admin_users for select to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.admin_users a where a.id = auth.uid() and a.role = 'admin')
  );

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- ─── Seed: datos institucionales reales + tarifario ─────────────────────────
insert into public.settings (key, value) values
  ('radio_legal_name', '"Sociedad Comercial de Radiodifusión y Publicidad del Sur Limitada"'::jsonb),
  ('radio_legal_rut', '"79.966.670-7"'::jsonb),
  ('radio_giro', '"Radiodifusión y Publicidad"'::jsonb),
  ('radio_brand_names', '["Radio La Frontera AM 1110", "Radio Araucana FM 95.9"]'::jsonb),
  ('radio_address', '"Caupolicán 110 Oficina 2003 Piso 20, Temuco, Región de La Araucanía"'::jsonb),
  ('radio_phone_landline', '"+56 45 2213166"'::jsonb),
  ('radio_phone_mobile', '"+56 9 4239 0216"'::jsonb),
  ('radio_email_administration', '"administracion@araucanayfrontera.cl"'::jsonb),
  ('radio_email_secretary', '"secretaria.araucana@gmail.com"'::jsonb),
  ('radio_bank_name', '"Banco Santander"'::jsonb),
  ('radio_bank_account_type', '"Cuenta Corriente"'::jsonb),
  ('radio_bank_account_number', '"0-000-9874438-0"'::jsonb),
  ('radio_coverage_default', '"Provincia de Cautín, IX Región de La Araucanía"'::jsonb),
  ('default_broadcast_times', '["10:00", "10:05", "10:10"]'::jsonb),
  ('notification_emails', '["administracion@araucanayfrontera.cl", "secretaria.araucana@gmail.com"]'::jsonb),
  ('tariff_table', '{"minLinesFlat": 5, "minPrice": 35000, "baseAboveMin": 25000, "perLineAboveMin": 2000}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ============================================================================
-- LISTO. Verifica con:
--   select count(*) from public.orders;        -- debe devolver 0
--   select key from public.settings;           -- debe listar 16 settings
-- ============================================================================
