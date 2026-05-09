-- ============================================================================
-- 0006_grants_authenticated_anon.sql — GRANTs faltantes para authenticated/anon
-- ============================================================================
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
--
-- Por qué: el BETA_SETUP.sql original solo otorgaba GRANTs a service_role.
-- Los roles authenticated (login con JWT) y anon (sin auth) no tenían GRANTs
-- explícitos en las tablas, por lo que TODA query desde el navegador fallaba
-- con "permission denied for table X" — incluso aunque las RLS lo permitieran.
--
-- En PostgreSQL/PostgREST, una query pasa cuando:
--   1. El rol tiene GRANT en la tabla (este script)
--   2. La RLS policy lo permite (ya estaba en BETA_SETUP.sql)
--
-- Sin (1), (2) no se llega a evaluar.
-- ============================================================================

-- Authenticated: usuarios logueados (admin panel) — GRANT total, RLS controla
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Anon: tráfico público sin auth — solo lectura, RLS limita a settings_public_read
grant select on all tables in schema public to anon;
grant usage, select on all sequences in schema public to anon;

-- Default privileges para tablas FUTURAS
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
alter default privileges in schema public
  grant select on tables to anon;

-- ============================================================================
-- LISTO. Verifica con:
--   select grantee, privilege_type
--   from information_schema.role_table_grants
--   where table_schema='public' and table_name='admin_users'
--   and grantee in ('authenticated','anon')
--   order by grantee, privilege_type;
-- Esperado:
--   authenticated: DELETE, INSERT, SELECT, UPDATE
--   anon: SELECT
-- ============================================================================
