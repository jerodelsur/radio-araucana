-- Migración 0011 — Renumerar slots A/B al cancelar para mantener positions 1..N.
--
-- Bug detectado 2026-05-15 (post-0010): tras liberar el slot de una orden
-- cancelada, los sobrevivientes mantenían sus positions originales. Si la
-- cancelada estaba en posición 1, el calendario mostraba "2, 3, 4, 5, 6" en
-- vez de "1, 2, 3, 4, 5". Además, assign_time_blocks_for_order asume positions
-- contiguas (usa count(*) + 1 para asignar la siguiente), así que con huecos
-- una nueva asignación chocaría con idx_order_extracts_block_slot.
--
-- Fix: nueva RPC release_and_renumber_slots(order_id) que libera los slots
-- del orden cancelado y renumera 1..N a todos los sobrevivientes de cada
-- (date, block) afectado.

create or replace function public.release_and_renumber_slots(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  affected record;
begin
  for affected in
    select distinct resolved_publication_date, time_block
      from public.order_extracts
     where order_id = p_order_id
       and time_block is not null
  loop
    -- 1) Borramos TODAS las positions del (date, block) afectado (cancelados
    --    + sobrevivientes). Nulls son distintos en el unique index, así que
    --    no hay conflicto durante el paso intermedio.
    update public.order_extracts
       set time_block_position = null
     where resolved_publication_date = affected.resolved_publication_date
       and time_block = affected.time_block;

    -- 2) Soltamos también el time_block del orden cancelado para que la fila
    --    salga de la cuadrícula del día.
    update public.order_extracts
       set time_block = null
     where order_id = p_order_id
       and resolved_publication_date = affected.resolved_publication_date
       and time_block = affected.time_block;

    -- 3) Renumeramos 1..N a los sobrevivientes ordenando por paid_at (orden
    --    de llegada del cliente) y extract_index (orden dentro del bundle).
    with ranked as (
      select oe.id,
             row_number() over (
               order by o.paid_at nulls last, oe.extract_index
             )::int as new_pos
        from public.order_extracts oe
        join public.orders o on o.id = oe.order_id
       where oe.resolved_publication_date = affected.resolved_publication_date
         and oe.time_block = affected.time_block
    )
    update public.order_extracts oe
       set time_block_position = ranked.new_pos
      from ranked
     where oe.id = ranked.id;
  end loop;
end;
$$;

grant execute on function public.release_and_renumber_slots(uuid) to authenticated, service_role;

-- ─── One-shot: renumerar (date, block) que ya quedaron con huecos ─────────
-- Por ejemplo: RLF-2026-0003 cancelada con la migración 0010 dejó positions
-- 2..6 en lugar de 1..5. Este bloque corrige esos casos para que el
-- calendario muestre 1..N coherentes desde el primer load post-deploy.
do $$
declare
  pair record;
begin
  for pair in
    select distinct resolved_publication_date, time_block
      from public.order_extracts
     where time_block is not null
  loop
    update public.order_extracts
       set time_block_position = null
     where resolved_publication_date = pair.resolved_publication_date
       and time_block = pair.time_block;

    with ranked as (
      select oe.id,
             row_number() over (
               order by o.paid_at nulls last, oe.extract_index
             )::int as new_pos
        from public.order_extracts oe
        join public.orders o on o.id = oe.order_id
       where oe.resolved_publication_date = pair.resolved_publication_date
         and oe.time_block = pair.time_block
    )
    update public.order_extracts oe
       set time_block_position = ranked.new_pos
      from ranked
     where oe.id = ranked.id;
  end loop;
end $$;
