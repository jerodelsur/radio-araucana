-- ============================================================================
-- 0011_cotiza_cotizaciones.sql — Cotizaciones formales del cotizador Araucana
-- ============================================================================
-- Cada cotización armada en /cotiza/interno se persiste acá con un número
-- secuencial COT-YYYY-NNNN. Estados: enviada → aceptada / rechazada / vencida.
--
-- El registro se inserta:
--   - Automáticamente al enviar la cotización al cliente por email (enviada)
--   - Manualmente con botón "Marcar enviada por WhatsApp" (enviada)
--
-- Pegar en SQL Editor de Supabase y ejecutar. Idempotente.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.cotiza_cotizaciones (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Vínculo opcional con la solicitud pública que la originó
  solicitud_id uuid references public.cotiza_solicitudes(id) on delete set null,

  -- Cliente (snapshot al momento de la cotización)
  cliente_nombre text not null,
  cliente_empresa text,
  cliente_telefono text,
  cliente_email text,

  -- Detalle de la cotización: arreglo de líneas {detalle, subtotal}
  lineas jsonb not null,
  comentarios text,

  -- Totales en CLP
  subtotal integer not null default 0,
  descuento_pyme integer not null default 0,
  descuento_agencia integer not null default 0,
  descuento_cupon integer not null default 0,
  iva integer not null default 0,
  total integer not null default 0,

  -- Metadatos de descuentos aplicados
  pyme_aplicado boolean not null default false,
  agencia_tramo text,
  cupon_codigo text,

  -- Estado y seguimiento
  estado text not null default 'enviada'
    check (estado in ('enviada', 'aceptada', 'rechazada', 'vencida')),
  enviada_en timestamptz not null default now(),
  enviada_via text not null default 'email'
    check (enviada_via in ('email', 'whatsapp', 'manual')),
  enviada_a text,                       -- email o teléfono del cliente
  cambio_estado_en timestamptz,
  cambio_estado_por text,               -- vendedor que cambió el estado
  notas_internas text
);

create index if not exists idx_cotiza_cotizaciones_estado
  on public.cotiza_cotizaciones(estado);

create index if not exists idx_cotiza_cotizaciones_created
  on public.cotiza_cotizaciones(created_at desc);

create index if not exists idx_cotiza_cotizaciones_cliente_email
  on public.cotiza_cotizaciones(lower(cliente_email));

create index if not exists idx_cotiza_cotizaciones_solicitud
  on public.cotiza_cotizaciones(solicitud_id);

-- ─── Trigger updated_at ──────────────────────────────────────────────────────
-- Reusa la función public.set_updated_at() ya existente del esquema de extractos
-- (0001_initial.sql la creó).

drop trigger if exists trg_cotiza_cotizaciones_updated_at on public.cotiza_cotizaciones;
create trigger trg_cotiza_cotizaciones_updated_at
  before update on public.cotiza_cotizaciones
  for each row execute function public.set_updated_at();

-- ─── Trigger asignar numero COT-YYYY-NNNN ────────────────────────────────────
create or replace function public.assign_cotizacion_number()
returns trigger
language plpgsql
as $$
declare
  current_year text := to_char(now() at time zone 'America/Santiago', 'YYYY');
  next_n integer;
begin
  if new.numero is null or new.numero = '' then
    select coalesce(max(
      (regexp_match(numero, '^COT-' || current_year || '-(\d+)$'))[1]::integer
    ), 0) + 1
    into next_n
    from public.cotiza_cotizaciones
    where numero like 'COT-' || current_year || '-%';
    new.numero := 'COT-' || current_year || '-' || lpad(next_n::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cotiza_cotizaciones_assign_number on public.cotiza_cotizaciones;
create trigger trg_cotiza_cotizaciones_assign_number
  before insert on public.cotiza_cotizaciones
  for each row execute function public.assign_cotizacion_number();

-- ─── Function: marcar vencidas (>30 días desde enviada, sin respuesta) ───────
-- Se invoca lazy desde el endpoint de listado, así no necesitamos pg_cron.
create or replace function public.mark_cotizaciones_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  update public.cotiza_cotizaciones
     set estado = 'vencida',
         cambio_estado_en = now(),
         cambio_estado_por = 'sistema (auto-vencimiento 30d)'
   where estado = 'enviada'
     and enviada_en < now() - interval '30 days';
  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;

grant execute on function public.mark_cotizaciones_vencidas() to service_role;

-- ─── RLS: solo service_role accede ───────────────────────────────────────────
alter table public.cotiza_cotizaciones enable row level security;

-- ============================================================================
-- LISTO. Verifica con:
--   select numero, cliente_nombre, total, estado from public.cotiza_cotizaciones
--    order by created_at desc;
-- ============================================================================
