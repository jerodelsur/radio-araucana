// Validación y formato de RUT chileno (módulo 11).
// Se admiten entradas con/sin puntos y guion. La salida canónica es
// '12.345.678-9' o '12.345.678-K'.

/**
 * Limpia un RUT a solo dígitos + DV (último char puede ser 'K').
 * @param {string} value
 * @returns {string}
 */
function strip(value) {
  return String(value ?? "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

/**
 * Calcula el dígito verificador (módulo 11) para un cuerpo numérico.
 * @param {string} body  Sólo dígitos.
 * @returns {string} '0'..'9' o 'K'.
 */
function computeDV(body) {
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const mod = 11 - (sum % 11);
  if (mod === 11) return "0";
  if (mod === 10) return "K";
  return String(mod);
}

/**
 * @param {string} value
 * @returns {boolean}
 */
export function isValidRUT(value) {
  const clean = strip(value);
  if (clean.length < 2 || clean.length > 9) return false;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  if (!/^\d+$/.test(body)) return false;
  // Mínimo plausible: 1 dígito en el cuerpo no es razonable, exigimos ≥ 7 (RUT chileno típico).
  if (body.length < 7) return false;
  return computeDV(body) === dv;
}

/**
 * Formato canónico '12.345.678-9'. Si el input no es válido, devuelve el
 * input limpio sin formato (no lanza, para no romper formularios).
 * @param {string} value
 */
export function formatRUT(value) {
  const clean = strip(value);
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let formattedBody = "";
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) formattedBody = "." + formattedBody;
    formattedBody = body[i] + formattedBody;
  }
  return `${formattedBody}-${dv}`;
}
