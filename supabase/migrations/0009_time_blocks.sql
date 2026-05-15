-- ============================================================================
-- 0009_time_blocks.sql — Horarios A/B por extracto (Bertha, 2026-05-15)
-- ============================================================================
-- Cada día de difusión (1 o 15) tiene 2 bloques horarios internos:
--   Bloque A: 8:00, 10:00, 12:00 (extractos cada 2:30 min → 24 cupos por bloque)
--   Bloque B: 9:00, 11:00, 13:00 (otros 24 cupos)
--
-- Los primeros 24 extractos pagados de cada fecha van a A; del 25 al 48 a B.
-- El cliente solo necesita saber "A o B" (lo dice el certificado); la posición
-- exacta dentro del bloque es uso interno de la operadora.
--
-- Pegar en SQL Editor del proyecto Supabase y ejecutar. Idempotente.
-- ============================================================================

-- ─── 1) Columnas nuevas en order_extracts ──────────────────────────────────
alter table public.order_extracts
  add column if not exists time_block text
    check (time_block in ('A', 'B'));

alter table public.order_extracts
  add column if not exists time_block_position smallint
    check (time_block_position between 1 and 24);

-- Un mismo (fecha, bloque, posición) no puede repetirse. Permite múltiples
-- filas con time_block NULL (extractos aún sin asignar) gracias a UNIQUE
-- semantics de NULL en Postgres.
create unique index if not exists idx_order_extracts_block_slot
  on public.order_extracts (resolved_publication_date, time_block, time_block_position)
  where time_block is not null and time_block_position is not null;

create index if not exists idx_order_extracts_block_date
  on public.order_extracts (resolved_publication_date, time_block);

-- ─── 2) Backfill: extractos de órdenes pagadas → asignar A/B según orden ──
-- Solo asigna a extracts sin time_block, cuya orden está en estado paid o
-- posteriores. La asignación respeta el orden de pago (paid_at, luego created_at).
with ranked as (
  select
    e.id,
    e.resolved_publication_date,
    row_number() over (
      partition by e.resolved_publication_date
      order by coalesce(o.paid_at, o.created_at), o.created_at, e.extract_index
    ) as rn
  from public.order_extracts e
  join public.orders o on o.id = e.order_id
  where e.time_block is null
    and o.status in ('paid', 'scheduled', 'broadcast_complete', 'certificate_generated', 'certificate_sent', 'completed')
)
update public.order_extracts e
   set time_block          = case when r.rn <= 24 then 'A' else 'B' end,
       time_block_position = case when r.rn <= 24 then r.rn else r.rn - 24 end
  from ranked r
 where e.id = r.id;

-- ─── 3) Helper RPC: asignar bloques para una orden cuando se marca pagada ─
-- Devuelve la cantidad asignada. Se invoca desde el código admin tras patch
-- de status=paid. Si no quedan cupos (>48 ese día), deja extractos sin
-- asignar y la operadora puede reordenar manualmente.
create or replace function public.assign_time_blocks_for_order(p_order_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_count int := 0;
  ex record;
  next_pos int;
  block_letter text;
begin
  for ex in
    select id, resolved_publication_date
      from public.order_extracts
     where order_id = p_order_id
       and time_block is null
     order by extract_index
  loop
    -- Cuántos extractos ya están en A para esa fecha?
    select count(*) into next_pos
      from public.order_extracts
     where resolved_publication_date = ex.resolved_publication_date
       and time_block = 'A';

    if next_pos < 24 then
      block_letter := 'A';
      next_pos := next_pos + 1;
    else
      -- A está lleno; intentar B.
      select count(*) into next_pos
        from public.order_extracts
       where resolved_publication_date = ex.resolved_publication_date
         and time_block = 'B';
      if next_pos < 24 then
        block_letter := 'B';
        next_pos := next_pos + 1;
      else
        -- Día lleno (48 extractos ya); dejar sin asignar y seguir.
        continue;
      end if;
    end if;

    update public.order_extracts
       set time_block = block_letter,
           time_block_position = next_pos
     where id = ex.id;

    assigned_count := assigned_count + 1;
  end loop;
  return assigned_count;
end;
$$;

grant execute on function public.assign_time_blocks_for_order(uuid) to authenticated, service_role;

-- ============================================================================
-- LISTO. Verifica con:
--   select resolved_publication_date, time_block, count(*)
--     from public.order_extracts
--    group by 1, 2 order by 1, 2;
-- ============================================================================
