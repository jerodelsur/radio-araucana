// Destinatarios y remitente de los emails del cotizador.
//
// Por default:
//   TO   = avisos@araucanayfrontera.cl         (casilla del equipo comercial)
//   CC   = administracion@araucanayfrontera.cl (gerencia / respaldo)
//   FROM = avisos@araucanayfrontera.cl         (mismo que TO; los clientes ven
//          las respuestas llegar a avisos@ — coherente con el flujo comercial)
//
// Override sin redeploy con las envs:
//   COTIZA_NOTIFICATION_TO (CSV de emails)
//   COTIZA_NOTIFICATION_CC (CSV de emails)
//   COTIZA_EMAIL_FROM      (email remitente, único)

function parse(raw) {
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

export function cotizaTo() {
  return parse(process.env.COTIZA_NOTIFICATION_TO || "avisos@araucanayfrontera.cl");
}

export function cotizaCc() {
  return parse(process.env.COTIZA_NOTIFICATION_CC || "administracion@araucanayfrontera.cl");
}

export function cotizaFromEmail() {
  return (process.env.COTIZA_EMAIL_FROM || "avisos@araucanayfrontera.cl").trim();
}
