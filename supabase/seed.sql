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
  -- Horarios habituales de difusión (3 emisiones separadas por 5 minutos).
  ('default_broadcast_times', '["10:00", "10:05", "10:10"]'::jsonb),
  -- Lista de destinatarios para alertas internas (nuevas órdenes, recordatorios).
  ('notification_emails', '["administracion@araucanayfrontera.cl", "secretaria.araucana@gmail.com"]'::jsonb),
  -- Tarifario confirmado por la operadora (Bertha Cabral) el 2026-05-15:
  -- mínimo 5 líneas $36.000, +$2.000 por línea adicional, tope 20 líneas.
  -- Sobre 20 líneas → escribir a administracion@araucanayfrontera.cl (cápsula).
  ('tariff_table', '{"minLinesFlat": 5, "minPrice": 36000, "baseAboveMin": 26000, "perLineAboveMin": 2000, "maxLines": 20}'::jsonb)
on conflict (key) do update set value = excluded.value, updated_at = now();

-- Firmante por defecto: Bertha Raquel Cabral Corrales, RUT 25.829.757-1.
-- Las imágenes de firma y timbre se cargan después desde /admin/configuracion
-- (signature_image_path y stamp_image_path apuntan a Storage cuando estén).
insert into public.signers (full_name, rut, title, is_default, is_active)
select 'Bertha Raquel Cabral Corrales', '25.829.757-1', 'Operadora Radio La Frontera', true, true
where not exists (
  select 1 from public.signers where rut = '25.829.757-1'
);
