-- Datos de facturación: en muchos casos el cliente es una persona natural
-- (abogado/representante legal) actuando en nombre de una empresa que paga
-- y necesita la factura a su nombre.
--
-- Caso real: Pablo Fuentes Risopatrón firma el extracto en representación de
-- "Inmobiliaria e Inversiones La Medalla Spa", que es quien paga y recibe
-- la factura.
--
-- Si requires_invoice = false, la factura/boleta va al client_name + client_rut.
-- Si requires_invoice = true, los billing_* son obligatorios a nivel app
-- (validados en zod), y se usan para emitir factura.

alter table public.orders
  add column if not exists requires_invoice boolean not null default false,
  add column if not exists billing_legal_name text,
  add column if not exists billing_rut text,
  add column if not exists billing_address text,
  add column if not exists billing_giro text,
  add column if not exists billing_email text;

create index if not exists idx_orders_billing_rut on public.orders(billing_rut)
  where billing_rut is not null;
