// Destinatarios y remitente de los emails del cotizador publicitario.
//
// Por default:
//   TO   = cotizaciones@araucanayfrontera.cl  (alias de comercial@)
//   CC   = (vacío)
//   FROM = cotizaciones@araucanayfrontera.cl  (lo que ve el cliente)
//
// Notas:
//   - cotizaciones@, avisos@, verificaciones@, entrevistas@ y extractos@ son
//     alias de comercial@ en Workspace. Todos caen en la misma bandeja, pero
//     el FROM visible al cliente identifica el producto cotizado.
//   - Por consolidación: cotizaciones@ es el único email que ve el cliente.
//     No hay CC interno a administracion@ para no mostrar dos direcciones.
//     Si en el futuro hace falta, se setea con COTIZA_NOTIFICATION_CC env.
//
// Override sin redeploy con las envs:
//   COTIZA_NOTIFICATION_TO (CSV de emails)
//   COTIZA_NOTIFICATION_CC (CSV de emails)
//   COTIZA_EMAIL_FROM      (email remitente, único)

function parse(raw) {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function cotizaTo() {
  return parse(process.env.COTIZA_NOTIFICATION_TO || "cotizaciones@araucanayfrontera.cl");
}

export function cotizaCc() {
  return parse(process.env.COTIZA_NOTIFICATION_CC || "");
}

export function cotizaFromEmail() {
  return (process.env.COTIZA_EMAIL_FROM || "cotizaciones@araucanayfrontera.cl").trim();
}
