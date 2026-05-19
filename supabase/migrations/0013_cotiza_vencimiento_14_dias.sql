-- Reduce el auto-vencimiento de cotizaciones de 30 → 14 días para que coincida
-- con la nueva vigencia que se le comunica al cliente en el email.

create or replace function public.mark_cotizaciones_vencidas()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_count integer;
begin
  update public.cotiza_cotizaciones
     set estado = 'vencida',
         cambio_estado_en = now(),
         cambio_estado_por = 'sistema (auto-vencimiento 14d)'
   where estado = 'enviada'
     and enviada_en < now() - interval '14 days';
  get diagnostics affected_count = row_count;
  return affected_count;
end;
$$;
