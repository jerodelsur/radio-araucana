-- Panel de Socios: tablas y RLS
-- Ejecutar en Supabase SQL Editor (o via supabase db push)

-- ── Tabla de usuarios con acceso al panel ─────────────────────────────────
create table if not exists public.socios_usuarios (
  id    uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  rol   text not null check (rol in ('admin', 'socio')),
  created_at timestamptz default now()
);

alter table public.socios_usuarios enable row level security;

-- Cada usuario solo puede leer su propia fila
create policy "socios_usuarios_select_own"
  on public.socios_usuarios for select
  using (auth.uid() = id);

-- ── Tabla de reportes mensuales ───────────────────────────────────────────
create table if not exists public.socios_reportes (
  id                  uuid primary key default gen_random_uuid(),
  mes                 text not null unique,           -- YYYY-MM
  ingresos            bigint not null default 0,
  gastos_sueldos      bigint not null default 0,
  gastos_honorarios   bigint not null default 0,
  gastos_proveedores  bigint not null default 0,
  gastos_otros        bigint not null default 0,
  sintonia            text default '',
  logros              jsonb not null default '[]',
  nota_gerente        text default '',
  publicado           boolean not null default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.socios_reportes enable row level security;

-- Socios ven reportes publicados; admin ve todos
create policy "socios_reportes_select"
  on public.socios_reportes for select
  using (
    exists (
      select 1 from public.socios_usuarios u
      where u.id = auth.uid()
      and (u.rol = 'admin' or publicado = true)
    )
  );

-- Solo admin puede insertar/actualizar/borrar
create policy "socios_reportes_admin_write"
  on public.socios_reportes for all
  using (
    exists (
      select 1 from public.socios_usuarios u
      where u.id = auth.uid() and u.rol = 'admin'
    )
  );

-- ── Cómo agregar usuarios ─────────────────────────────────────────────────
-- 1. Invitar al usuario desde Supabase Authentication → Users → Invite user
-- 2. Luego insertar en socios_usuarios:
--
-- insert into public.socios_usuarios (id, nombre, rol) values
--   ('<uuid del auth.users>', 'Nombre Completo', 'socio');   -- para socios
--   ('<uuid del auth.users>', 'Jerónimo Díaz', 'admin');     -- para el gerente
