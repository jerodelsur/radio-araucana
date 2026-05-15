-- ============================================================================
-- 0007_multi_extract.sql — Multi-extracto por cotización (Bertha, 2026-05-15)
-- ============================================================================
-- Una cotización pasa a poder agrupar 1..20 extractos en una sola factura.
-- Cada extracto sigue su propio camino de difusión y genera su propio
-- certificado, pero comparten cliente, facturación y pago.
--
-- Cambios:
--   1. Nueva tabla `order_extracts` (relación 1-N con `orders`).
--   2. Backfill: cada orden existente → 1 fila en `order_extracts`.
--   3. Relajar NOT NULL en columnas legacy de `orders` (extract_text,
--      line_count, comuna, etc) — quedan como snapshot histórico, las
--      órdenes nuevas las completan con datos del primer extracto para
--      back-compat con código no migrado.
--   4. RLS heredado de `orders` (admins ven todo).
--
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
-- ============================================================================

-- ─── 1) Tabla order_extracts ───────────────────────────────────────────────
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

  -- Estado a nivel de extracto. El bundle (orders) lleva estado de pago/cancelación.
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

  unique (order_id, extract_index)
);

create index if not exists idx_order_extracts_order_id on public.order_extracts(order_id);
create index if not exists idx_order_extracts_status on public.order_extracts(status);
create index if not exists idx_order_extracts_resolved_date on public.order_extracts(resolved_publication_date);

drop trigger if exists trg_order_extracts_updated_at on public.order_extracts;
create trigger trg_order_extracts_updated_at
  before update on public.order_extracts
  for each row execute function public.set_updated_at();

-- ─── 2) RLS ────────────────────────────────────────────────────────────────
alter table public.order_extracts enable row level security;

drop policy if exists "order_extracts_admin_all" on public.order_extracts;
create policy "order_extracts_admin_all" on public.order_extracts for all to authenticated
  using (exists (select 1 from public.admin_users where id = auth.uid()))
  with check (exists (select 1 from public.admin_users where id = auth.uid()));

-- ─── 3) Backfill: cada orden existente → 1 fila en order_extracts ─────────
-- Idempotente: solo inserta si la orden no tiene aún un extracto asociado.
insert into public.order_extracts (
  order_id, extract_index,
  extract_text, line_count, amount_clp,
  procedure_type, comuna, provincia, region,
  publication_day, publication_month, resolved_publication_date,
  status,
  broadcast_time_1, broadcast_time_2, broadcast_time_3,
  broadcast_marked_at, broadcast_marked_by,
  certificate_pdf_path, certificate_generated_at, certificate_sent_at,
  certificate_sent_to, certificate_signer_id,
  created_at, updated_at
)
select
  o.id, 1,
  o.extract_text, o.line_count, o.amount_clp,
  o.procedure_type, o.comuna, o.provincia, o.region,
  o.publication_day, o.publication_month, o.resolved_publication_date,
  case o.status
    when 'broadcast_complete'    then 'broadcast_complete'
    when 'certificate_generated' then 'certificate_generated'
    when 'certificate_sent'      then 'certificate_sent'
    when 'cancelled'             then 'cancelled'
    else 'scheduled'
  end,
  o.broadcast_time_1, o.broadcast_time_2, o.broadcast_time_3,
  o.broadcast_marked_at, o.broadcast_marked_by,
  o.certificate_pdf_path, o.certificate_generated_at, o.certificate_sent_at,
  o.certificate_sent_to, o.certificate_signer_id,
  o.created_at, o.updated_at
from public.orders o
where o.extract_text is not null
  and not exists (select 1 from public.order_extracts oe where oe.order_id = o.id);

-- ─── 4) Relajar NOT NULL en columnas legacy de orders ─────────────────────
-- Permiten órdenes bundle (multi-extracto). El código nuevo igual rellena
-- estas columnas con datos del primer extracto, para que admin/queries que
-- todavía no migraron sigan viendo "algo".
alter table public.orders alter column extract_text drop not null;
alter table public.orders alter column line_count drop not null;
alter table public.orders alter column procedure_type drop not null;
alter table public.orders alter column comuna drop not null;
alter table public.orders alter column provincia drop not null;
alter table public.orders alter column region drop not null;
alter table public.orders alter column publication_day drop not null;
alter table public.orders alter column publication_month drop not null;
alter table public.orders alter column resolved_publication_date drop not null;

-- ============================================================================
-- LISTO. Verifica con:
--   select count(*) as orders_total from public.orders;
--   select count(*) as extracts_total from public.order_extracts;
--   -- Deben ser iguales (cada orden tiene exactamente 1 extracto tras backfill).
--   select order_id, count(*) from public.order_extracts group by 1 having count(*) > 1;
--   -- Debe devolver 0 filas (ninguna orden tiene aún más de 1 extracto).
-- ============================================================================
