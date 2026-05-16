-- ============================================================================
-- 0012_cotiza_propuesta_b.sql — Soporte para "Opción A + Opción B" en una
-- misma cotización del cotizador interno.
-- ============================================================================
-- Cuando el equipo arma una cotización en /cotiza/admin → Armar cotización,
-- puede activar el toggle "Agregar segunda propuesta". El cliente recibe un
-- email con ambas opciones lado a lado y elige cuál prefiere.
--
-- propuesta_b es nullable: si la cotización tiene una sola propuesta, queda
-- null y todo funciona como antes.
--
-- Shape de propuesta_b:
--   {
--     "lineas": [{"detalle": "...", "subtotal": 12345}, ...],
--     "subtotal": int,
--     "descuento_pyme": int,
--     "descuento_agencia": int,
--     "descuento_cupon": int,
--     "iva": int,
--     "total": int,
--     "pyme_aplicado": bool,
--     "agencia_tramo": text | null,
--     "cupon_codigo": text | null,
--     "comentarios": text | null  -- nota específica de la propuesta B
--   }
--
-- Pegar en SQL Editor de Supabase. Idempotente.
-- ============================================================================

alter table public.cotiza_cotizaciones
  add column if not exists propuesta_b jsonb;

-- ============================================================================
-- LISTO. Verifica con:
--   select numero, total, propuesta_b is not null as tiene_b
--     from public.cotiza_cotizaciones order by created_at desc limit 5;
-- ============================================================================
