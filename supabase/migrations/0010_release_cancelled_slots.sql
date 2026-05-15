-- Migración 0010 — Liberar slots A/B de extractos cuya orden ya está cancelada.
--
-- Bug detectado 2026-05-15: al cancelar una orden, el código solo actualizaba
-- orders.status pero dejaba time_block / time_block_position seteados en
-- order_extracts. Resultado: la fila seguía apareciendo en el calendario y
-- bloqueando el slot bajo idx_order_extracts_block_slot, impidiendo asignar
-- otro extracto a la misma posición.
--
-- El fix de código suelta los slots al cancelar. Esta migración limpia las
-- órdenes ya canceladas en la BD para que el calendario quede coherente sin
-- esperar a una próxima cancelación.

update public.order_extracts oe
   set time_block = null,
       time_block_position = null
  from public.orders o
 where o.id = oe.order_id
   and o.status = 'cancelled'
   and (oe.time_block is not null or oe.time_block_position is not null);
