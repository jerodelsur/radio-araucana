// Destinatarios y remitente de los emails del cotizador.
//
// Por default:
//   TO   = comercial@araucanayfrontera.cl       (cuenta principal del equipo)
//   CC   = administracion@araucanayfrontera.cl  (gerencia / respaldo)
//   FROM = comercial@araucanayfrontera.cl       (mismo que TO)
//
// Notas:
//   - avisos@, publicidad@, cotizaciones@, verificaciones@ y extractos@ son
//     alias de comercial@ en Workspace (todos caen en la misma bandeja).
//   - Cuando se cambió el nombre principal de avisos@ a comercial@, los
//     emails antiguos siguen llegando porque avisos@ queda como alias.
//
// Override sin redeploy con las envs:
//   COTIZA_NOTIFICATION_TO (CSV de emails)
//   COTIZA_NOTIFICATION_CC (CSV de emails)
//   COTIZA_EMAIL_FROM      (email remitente, único)

function parse(raw) {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function cotizaTo() {
  return parse(process.env.COTIZA_NOTIFICATION_TO || "comercial@araucanayfrontera.cl");
}

export function cotizaCc() {
  return parse(process.env.COTIZA_NOTIFICATION_CC || "administracion@araucanayfrontera.cl");
}

export function cotizaFromEmail() {
  return (process.env.COTIZA_EMAIL_FROM || "comercial@araucanayfrontera.cl").trim();
}
