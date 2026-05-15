-- ============================================================================
-- 0008_unify_support_email.sql — Email de soporte/cliente unificado (2026-05-15)
-- ============================================================================
-- El email visible al cliente (en mensajes "Si pasa más de 24h escríbenos a…")
-- migra de secretaria.araucana@gmail.com a administracion@araucanayfrontera.cl.
-- Es el mismo destino administrativo; queda un solo punto de contacto en el
-- nuevo dominio.
--
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
-- ============================================================================

-- 1) radio_email_secretary pasa a administracion@araucanayfrontera.cl
update public.settings
   set value = '"administracion@araucanayfrontera.cl"'::jsonb,
       updated_at = now()
 where key = 'radio_email_secretary';

-- 2) notification_emails: deduplicar. Antes tenía ambos; ahora solo administracion@.
update public.settings
   set value = '["administracion@araucanayfrontera.cl"]'::jsonb,
       updated_at = now()
 where key = 'notification_emails';

-- ============================================================================
-- LISTO. Verifica con:
--   select key, value from public.settings
--   where key in ('radio_email_secretary','radio_email_administration','notification_emails');
-- ============================================================================
