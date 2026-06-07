-- socios_mix_ingresos.sql
-- Agrega columna mix_ingresos a socios_reportes para breakdown manual de ingresos por rubro.
-- Estructura: { arriendo: number, agencias: number, no_agencias: number, extractos_am: number, otros: number }

alter table public.socios_reportes
  add column if not exists mix_ingresos jsonb default null;
