-- ============================================================================
-- 0003_storage.sql — Buckets privados + policies para firmas y timbres
-- ============================================================================
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
--
-- Crea dos buckets PRIVADOS:
--   - signatures: imágenes de firma de los firmantes (PNG/JPG/WEBP, max 2 MB)
--   - stamps:     imágenes de timbre de los firmantes (PNG/JPG/WEBP, max 2 MB)
--
-- Policies: solo usuarios listados en public.admin_users pueden leer/escribir.
-- ============================================================================

-- ─── Buckets ────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('signatures', 'signatures', false, 2097152, array['image/png','image/jpeg','image/webp']),
  ('stamps',     'stamps',     false, 2097152, array['image/png','image/jpeg','image/webp'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─── Policies sobre storage.objects ─────────────────────────────────────────
-- Helper: ¿el usuario actual es admin/operator?
-- Reutilizamos public.admin_users (rol 'admin' u 'operator').

-- SELECT (leer/descargar)
drop policy if exists "signatures_admin_read" on storage.objects;
create policy "signatures_admin_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'signatures'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

drop policy if exists "stamps_admin_read" on storage.objects;
create policy "stamps_admin_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'stamps'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

-- INSERT (subir)
drop policy if exists "signatures_admin_insert" on storage.objects;
create policy "signatures_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'signatures'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

drop policy if exists "stamps_admin_insert" on storage.objects;
create policy "stamps_admin_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'stamps'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

-- UPDATE (reemplazar archivo o metadata)
drop policy if exists "signatures_admin_update" on storage.objects;
create policy "signatures_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'signatures'
    and exists (select 1 from public.admin_users where id = auth.uid())
  )
  with check (
    bucket_id = 'signatures'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

drop policy if exists "stamps_admin_update" on storage.objects;
create policy "stamps_admin_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'stamps'
    and exists (select 1 from public.admin_users where id = auth.uid())
  )
  with check (
    bucket_id = 'stamps'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

-- DELETE (eliminar)
drop policy if exists "signatures_admin_delete" on storage.objects;
create policy "signatures_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'signatures'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

drop policy if exists "stamps_admin_delete" on storage.objects;
create policy "stamps_admin_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'stamps'
    and exists (select 1 from public.admin_users where id = auth.uid())
  );

-- ============================================================================
-- LISTO. Verifica con:
--   select id, public, file_size_limit from storage.buckets
--     where id in ('signatures','stamps');
--   select policyname from pg_policies where tablename = 'objects'
--     and policyname like '%signatures%' or policyname like '%stamps%';
-- ============================================================================
