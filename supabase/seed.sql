-- Datos iniciales del sistema. Idempotente: usa upsert en settings.
-- Ejecutar después de 0001_initial.sql.

insert into public.settings (key, value) values
  ('radio_legal_name', '"Radios La Frontera AM y Araucana FM"'::jsonb),
  ('radio_address', '"Caupolicán 110 Oficina 2003 Piso 20, Temuco"'::jsonb),
  ('radio_phone', '"45-2213166"'::jsonb),
  ('radio_email', '"secretaria.araucana@gmail.com"'::jsonb),
  ('radio_coverage_default', '"Provincia de Cautín, IX Región de La Araucanía"'::jsonb),
  ('default_broadcast_times', '["10:05", "11:05", "11:35"]'::jsonb),
  ('notification_emails', '["secretaria.araucana@gmail.com"]'::jsonb),
  ('tariff_table', '{"minLinesFlat": 4, "minPrice": 17850, "baseAboveMin": 20000, "perLineAboveMin": 1000}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Firmante por defecto: NO se inserta automáticamente. La operadora lo carga
-- desde /admin/configuracion en F2 (PRD §11.2 — el placeholder dice
-- explícitamente "no usar Jerónimo Díaz Tomic" sin reemplazo aún).
