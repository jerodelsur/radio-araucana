-- ============================================================================
-- 0014_cotiza_solicitudes_tipo_promocion.sql
-- ============================================================================
-- Agrega qué quiere promocionar el cliente como filtro/contexto para la llamada
-- de venta. Es un campo del formulario de identificación pública.
--
-- tipo_promocion: id del rubro elegido (negocio, servicio, evento, oferta,
--                 campana, otro).
-- tipo_promocion_otro: texto libre cuando elige 'otro'.
--
-- Pegar en SQL Editor de Supabase y ejecutar. Idempotente.
-- ============================================================================

alter table public.cotiza_solicitudes
  add column if not exists tipo_promocion text,
  add column if not exists tipo_promocion_otro text;

create index if not exists idx_cotiza_solicitudes_tipo_promocion
  on public.cotiza_solicitudes(tipo_promocion);

-- ============================================================================
-- LISTO. Verifica con:
--   select tipo_promocion, count(*) from public.cotiza_solicitudes
--   group by tipo_promocion;
-- ============================================================================
