-- Schema inicial del sistema de extractos radiales (PRD §5).
-- Migration F1: tablas core + secuencia de numeración + RLS básica.

create extension if not exists "pgcrypto";

-- ─── Tabla settings (key-value editable por admin) ────────────────────────────
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ─── Tabla signers (firmantes del certificado) ───────────────────────────────
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

-- ─── Tabla admin_users (metadata adicional, FK a auth.users) ─────────────────
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'operator' check (role in ('admin', 'operator')),
  created_at timestamptz not null default now()
);

-- ─── Secuencia para numeración RLF-YYYY-NNNN ────────────────────────────────
-- Reset implícito por año vía función + trigger en orders.
create sequence if not exists public.order_number_seq start with 1;

-- ─── Tabla orders ────────────────────────────────────────────────────────────
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

  -- Extracto
  extract_text text not null,
  line_count integer not null check (line_count >= 1),
  amount_clp integer not null check (amount_clp >= 0),

  -- Difusión
  procedure_type text not null check (procedure_type in ('dga_subterraneas', 'dga_superficiales', 'dia_seia', 'otro')),
  comuna text not null,
  provincia text not null,
  region text not null,
  publication_day smallint not null check (publication_day in (1, 15)),
  publication_month text not null,
  resolved_publication_date date not null,

  -- Estado y pago
  status text not null default 'draft' check (status in (
    'draft', 'pending_payment', 'paid', 'scheduled',
    'broadcast_complete', 'certificate_generated', 'certificate_sent',
    'completed', 'payment_failed', 'cancelled'
  )),
  payment_provider text,
  payment_id text,
  payment_method text,
  paid_at timestamptz,

  -- Difusión efectiva
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
  cancelled_by uuid references public.admin_users(id)
);

create index if not exists idx_orders_status on public.orders(status);
create index if not exists idx_orders_resolved_date on public.orders(resolved_publication_date);
create index if not exists idx_orders_email on public.orders(lower(client_email));
create index if not exists idx_orders_created_at on public.orders(created_at desc);

-- ─── Trigger updated_at ──────────────────────────────────────────────────────
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

-- ─── Trigger asignar order_number al insertar ────────────────────────────────
-- Formato RLF-YYYY-NNNN. Reinicia correlativo en cada año via lookup
-- (usamos count(*) por año para mantenerlo simple; si el volumen crece a
--  cientos por mes habría que cambiar a una tabla de contadores por año).
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

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table public.orders enable row level security;
alter table public.settings enable row level security;
alter table public.signers enable row level security;
alter table public.admin_users enable row level security;

-- Settings: lectura pública (la página pública necesita el tarifario y
-- datos institucionales). Escritura solo por admins autenticados.
drop policy if exists "settings_public_read" on public.settings;
create policy "settings_public_read"
  on public.settings for select
  using (true);

drop policy if exists "settings_admin_write" on public.settings;
create policy "settings_admin_write"
  on public.settings for all
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- Signers: lectura por admins; sin acceso público.
drop policy if exists "signers_admin_read" on public.signers;
create policy "signers_admin_read"
  on public.signers for select
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()));

drop policy if exists "signers_admin_write" on public.signers;
create policy "signers_admin_write"
  on public.signers for all
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- Admin users: cada admin ve su propio registro; admins con rol 'admin' ven todos.
drop policy if exists "admin_users_self_read" on public.admin_users;
create policy "admin_users_self_read"
  on public.admin_users for select
  to authenticated
  using (
    id = auth.uid()
    or exists (select 1 from public.admin_users a where a.id = auth.uid() and a.role = 'admin')
  );

-- Orders: SOLO admins autenticados; el endpoint público de creación usa
-- service-role key (bypass RLS) y valida con zod a nivel app.
drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all"
  on public.orders for all
  to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));
