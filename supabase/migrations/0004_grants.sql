-- ============================================================================
-- 0004_grants.sql — GRANTs para que service_role pueda operar las tablas
-- ============================================================================
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
--
-- Por qué: Las tablas creadas vía SQL Editor pertenecen al rol postgres y
-- NO heredan permisos automáticos para service_role. El secret key del backend
-- (sb_secret_*) se conecta como service_role; sin GRANTs explícitos los inserts
-- fallan con `permission denied for table orders` (código 42501).
--
-- También configuramos default privileges para que las TABLAS FUTURAS hereden
-- estos GRANTs sin necesidad de re-correr este script.
-- ============================================================================

-- Schema usage para los 3 roles estándar de Supabase
grant usage on schema public to service_role, anon, authenticated;

-- service_role: acceso completo (bypasea RLS, es el rol del backend)
grant all privileges on all tables    in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant all privileges on all functions in schema public to service_role;

-- Default privileges para tablas/secuencias/funciones FUTURAS
alter default privileges in schema public
  grant all on tables    to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on functions to service_role;

-- ============================================================================
-- LISTO. Verifica con:
--   select grantee, privilege_type from information_schema.role_table_grants
--     where table_schema='public' and table_name='orders' and grantee='service_role';
-- Esperado: 7 filas (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER)
-- ============================================================================
