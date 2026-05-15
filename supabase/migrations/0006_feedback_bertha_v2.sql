-- ============================================================================
-- 0006_feedback_bertha_v2.sql — Segunda ronda de feedback (2026-05-15)
-- ============================================================================
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
--
-- Cambios (Bertha, Ola 1):
--   1. Tarifario nuevo: mínimo 5 líneas $36.000 (era $35.000), +$2.000 por línea
--      adicional, tope 20 líneas. Sobre 20 → cápsula (escribir a administración@).
--   2. La línea de título "EXTRACTOS" pasa a agregarse automáticamente al texto
--      del cliente (cuenta como una línea más para el cobro). No requiere
--      cambios en BD — el server-side la antepone en /api/extractos/orders.
--   3. El email automático "tu aviso fue difundido al aire" se eliminó. No
--      requiere cambios en BD — solo en el código (notify-client.js).
-- ============================================================================

-- ─── 1) Tarifario nuevo con maxLines = 20 ──────────────────────────────────
-- Fórmula: si líneas <= 5 → $36.000; si no → $26.000 + N * $2.000
-- (equivalente a $36.000 + $2.000 por cada línea sobre 5).
-- Tope: 20 líneas. Sobre eso, el cotizador rechaza con mensaje a administración@.
update public.settings
   set value = jsonb_build_object(
         'minLinesFlat', 5,
         'minPrice', 36000,
         'baseAboveMin', 26000,
         'perLineAboveMin', 2000,
         'maxLines', 20
       ),
       updated_at = now()
 where key = 'tariff_table';

-- ============================================================================
-- LISTO. Verifica con:
--   select key, value from public.settings where key = 'tariff_table';
-- Esperado:
--   {"maxLines": 20, "minPrice": 36000, "baseAboveMin": 26000,
--    "minLinesFlat": 5, "perLineAboveMin": 2000}
-- ============================================================================
