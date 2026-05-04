-- ============================================================================
-- 0005_feedback_bertha.sql — Ajustes tras feedback de la operadora (2026-05-04)
-- ============================================================================
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
--
-- Cambios:
--   1. Tarifario nuevo: mínimo 5 líneas $35.000, +$2.000 por línea adicional.
--   2. Horarios: 3 emisiones separadas por 5 minutos (10:00, 10:05, 10:10).
--   3. Insertar firmante por defecto: Bertha Raquel Cabral Corrales.
-- ============================================================================

-- ─── 1) Tarifario nuevo ─────────────────────────────────────────────────────
-- Fórmula: si líneas <= 5 → $35.000; si no → $25.000 + N * $2.000
-- (equivalente a $35.000 + $2.000 por cada línea sobre 5).
update public.settings
   set value = jsonb_build_object(
         'minLinesFlat', 5,
         'minPrice', 35000,
         'baseAboveMin', 25000,
         'perLineAboveMin', 2000
       ),
       updated_at = now()
 where key = 'tariff_table';

-- ─── 2) Horarios cada 5 minutos ─────────────────────────────────────────────
update public.settings
   set value = '["10:00", "10:05", "10:10"]'::jsonb,
       updated_at = now()
 where key = 'default_broadcast_times';

-- ─── 3) Insertar firmante Bertha Cabral ─────────────────────────────────────
-- Es la única firmante por defecto. Jerónimo (admin user) no firma certificados.
-- La firma escaneada y el timbre se subirán a Storage cuando estén listos
-- y luego actualizamos signature_image_path / stamp_image_path con UPDATE.
insert into public.signers (full_name, rut, title, is_default, is_active)
select 'Bertha Raquel Cabral Corrales', '25.829.757-1', 'Operadora Radio La Frontera', true, true
where not exists (
  select 1 from public.signers where rut = '25.829.757-1'
);

-- Si ya existe (por si re-ejecutamos), aseguramos que esté activa y default.
update public.signers
   set is_default = true,
       is_active  = true,
       full_name  = 'Bertha Raquel Cabral Corrales',
       title      = 'Operadora Radio La Frontera'
 where rut = '25.829.757-1';

-- Garantizar un único is_default = true.
update public.signers
   set is_default = false
 where rut <> '25.829.757-1' and is_default = true;

-- ============================================================================
-- LISTO. Verifica con:
--   select key, value from public.settings where key in ('tariff_table','default_broadcast_times');
--   select id, full_name, rut, is_default, is_active from public.signers;
-- ============================================================================
