// Helpers para componer el texto final del extracto que se difunde al aire
// y queda en el certificado/factura.
//
// Regla operativa (Bertha, 2026-05-15): TODO extracto se difunde con la línea
// de título "EXTRACTOS" arriba, en mayúsculas, sola en su línea. Esa línea
// cuenta para el cobro como una línea más (la primera).

export const MANDATORY_TITLE = "EXTRACTOS";

/**
 * Devuelve el texto del aviso con la línea de título "EXTRACTOS" antepuesta.
 * Idempotente: si el cliente ya pegó "EXTRACTOS" como primera línea (en
 * cualquier capitalización), no la duplica.
 *
 * @param {string} text
 * @returns {string}
 */
export function withMandatoryTitle(text) {
  const body = typeof text === "string" ? text : "";
  const trimmedStart = body.replace(/^[\s ]+/, "");
  const firstLine = trimmedStart.split(/\r?\n/, 1)[0] ?? "";
  if (firstLine.trim().toUpperCase() === MANDATORY_TITLE) {
    return trimmedStart.replace(/^[^\r\n]*/, MANDATORY_TITLE);
  }
  return body ? `${MANDATORY_TITLE}\n${body}` : `${MANDATORY_TITLE}\n`;
}
