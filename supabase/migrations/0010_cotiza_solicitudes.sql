-- ============================================================================
-- 0010_cotiza_solicitudes.sql — Solicitudes públicas del cotizador Araucana
-- ============================================================================
-- Persiste cada solicitud que llega desde radioaraucana.cl/cotiza para que el
-- equipo comercial pueda verlas listadas en /cotiza/interno, precargar la
-- cotización y marcarlas como atendidas. Sustituye a la idea inicial de
-- guardarlas en Vercel Blob (que no es transaccional).
--
-- Pegar en SQL Editor de Supabase y ejecutar. Idempotente.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.cotiza_solicitudes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),

  -- Cliente
  cliente_nombre text not null,
  cliente_empresa text,
  cliente_telefono text,
  cliente_email text,

  -- Pedido del cliente: arreglo de { formatoId, titulo, duracion, necesidad }
  pedido jsonb not null,
  comentarios text,

  -- Estado del seguimiento
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'atendida', 'descartada')),
  atendida_en timestamptz,
  atendida_por text,       -- nombre o email del vendedor que la cerró
  notas_internas text,
  cotizacion_total integer  -- total con IVA si se cotizó (CLP)
);

create index if not exists idx_cotiza_solicitudes_estado
  on public.cotiza_solicitudes(estado);

create index if not exists idx_cotiza_solicitudes_created
  on public.cotiza_solicitudes(created_at desc);

-- RLS: solo backend con service_role puede leer/escribir. El endpoint público
-- /api/cotiza/submit usa service_role para insertar. Los endpoints internos
-- (listar/atender) validan ADMIN_PASSWORD antes de usar service_role.
alter table public.cotiza_solicitudes enable row level security;

-- Sin políticas para authenticated/anon → solo service_role accede.

-- ============================================================================
-- LISTO. Verifica con:
--   select id, created_at, cliente_nombre, estado from public.cotiza_solicitudes;
-- ============================================================================
