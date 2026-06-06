-- Documentos descargables para socios
create table if not exists public.socios_documentos (
  id          uuid primary key default gen_random_uuid(),
  titulo      text not null,
  descripcion text default '',
  url         text not null,           -- Google Drive share link o URL directa
  categoria   text not null default 'General',
  orden       integer not null default 0,
  publicado   boolean not null default true,
  created_at  timestamptz default now()
);

alter table public.socios_documentos enable row level security;

-- Socios ven documentos publicados
create policy "socios_documentos_select"
  on public.socios_documentos for select
  using (
    exists (
      select 1 from public.socios_usuarios u
      where u.id = auth.uid()
      and (u.rol = 'admin' or publicado = true)
    )
  );

-- Solo admin puede escribir
create policy "socios_documentos_admin_write"
  on public.socios_documentos for all
  using (
    exists (
      select 1 from public.socios_usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- Ejemplos para arrancar (ajusta las URLs reales de Drive):
-- insert into public.socios_documentos (titulo, descripcion, categoria, url, orden) values
--   ('Balance 2025', 'Balance general auditado del ejercicio 2025', 'Financiero', 'https://drive.google.com/...', 1),
--   ('Informe Financiero 2025', 'Informe de gestión financiera anual', 'Financiero', 'https://drive.google.com/...', 2),
--   ('Encuesta Ipsos Q1 2025', 'Estudio de sintonía y audiencia primer trimestre', 'Audiencia', 'https://drive.google.com/...', 3);
