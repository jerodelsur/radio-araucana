-- Datos iniciales del sistema. Idempotente: usa upsert en settings.
-- Ejecutar después de 0001_initial.sql.

insert into public.settings (key, value) values
  -- Razón social legal (la que firma certificados y emite facturas).
  ('radio_legal_name', '"Sociedad Comercial de Radiodifusión y Publicidad del Sur Limitada"'::jsonb),
  ('radio_legal_rut', '"79.966.670-7"'::jsonb),
  ('radio_giro', '"Radiodifusión y Publicidad"'::jsonb),
  -- Nombres comerciales que usamos en UI/marketing.
  ('radio_brand_names', '["Radio La Frontera AM 1110", "Radio Araucana FM 95.9"]'::jsonb),
  -- Domicilio comercial.
  ('radio_address', '"Caupolicán 110 Oficina 2003 Piso 20, Temuco, Región de La Araucanía"'::jsonb),
  -- Contacto.
  ('radio_phone_landline', '"+56 45 2213166"'::jsonb),
  ('radio_phone_mobile', '"+56 9 4239 0216"'::jsonb),
  ('radio_email_administration', '"administracion@araucanayfrontera.cl"'::jsonb),
  ('radio_email_secretary', '"secretaria.araucana@gmail.com"'::jsonb),
  -- Cuenta para transferencias del cliente (cuando paga fuera de Flow).
  ('radio_bank_name', '"Banco Santander"'::jsonb),
  ('radio_bank_account_type', '"Cuenta Corriente"'::jsonb),
  ('radio_bank_account_number', '"0-000-9874438-0"'::jsonb),
  -- Cobertura por defecto (PRD §11.2).
  ('radio_coverage_default', '"Provincia de Cautín, IX Región de La Araucanía"'::jsonb),
  -- Horarios habituales de difusión (3 emisiones diarias).
  ('default_broadcast_times', '["10:05", "11:05", "11:35"]'::jsonb),
  -- Lista de destinatarios para alertas internas (nuevas órdenes, recordatorios).
  ('notification_emails', '["administracion@araucanayfrontera.cl", "secretaria.araucana@gmail.com"]'::jsonb),
  -- Tarifario: PENDIENTE confirmar con la radio. El PRD §6.1 trae una fórmula
  -- (mínimo $17.850 hasta 4 líneas, +$1.000/línea desde la 5ª) pero las
  -- cotizaciones reales observadas no calzan ($34.000 y $52.000 para
  -- extractos de ~10 y ~8 líneas respectivamente). Mantener este valor por
  -- ahora; la operadora puede editarlo desde /admin/configuracion una vez
  -- confirmada la tarifa real.
  ('tariff_table', '{"minLinesFlat": 4, "minPrice": 17850, "baseAboveMin": 20000, "perLineAboveMin": 1000, "_pending_confirmation": true}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Firmante por defecto: NO se inserta automáticamente. La operadora lo carga
-- desde /admin/configuracion en F2 (PRD §11.2 — el placeholder dice
-- explícitamente "no usar Jerónimo Díaz Tomic" sin reemplazo aún).
