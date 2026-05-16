// Tarifa de extractos radiales — Radio La Frontera AM 1110.
// Confirmada con la operadora (Bertha Cabral) el 2026-05-15.
// Todos los montos en CLP, IVA incluido.
//
// Tabla:
//   1–5 líneas → $36.000 (mínimo, incluye la línea de título "EXTRACTOS")
//   N (>5)    → $26.000 + N * $2.000
//   Equivale a $36.000 + ($2.000 por cada línea sobre 5).
//   Tope: 20 líneas. Sobre 20 → escribir a extractos@araucanayfrontera.cl
//   (se cotiza como cápsula, no como extracto).

export const DEFAULT_TARIFF = Object.freeze({
  minLinesFlat: 5,
  minPrice: 36000,
  baseAboveMin: 26000,
  perLineAboveMin: 2000,
  maxLines: 20,
});

/**
 * @param {number} lineCount  Cantidad de líneas según conteo en BOS 12.
 * @param {{minLinesFlat:number, minPrice:number, baseAboveMin:number, perLineAboveMin:number}} [tariff]
 * @returns {number} Monto en CLP, IVA incluido.
 */
export function calculatePriceCLP(lineCount, tariff = DEFAULT_TARIFF) {
  if (typeof lineCount !== "number" || !Number.isFinite(lineCount)) {
    throw new TypeError("lineCount debe ser un número finito");
  }
  if (lineCount < 1) {
    throw new RangeError("lineCount debe ser ≥ 1");
  }
  const lines = Math.ceil(lineCount);
  if (lines <= tariff.minLinesFlat) return tariff.minPrice;
  return tariff.baseAboveMin + lines * tariff.perLineAboveMin;
}

/**
 * Indica si una cotización excede el tope de líneas y debe derivarse a
 * administración para cotizar como cápsula.
 * @param {number} lineCount
 * @param {{maxLines?: number}} [tariff]
 */
export function exceedsMaxLines(lineCount, tariff = DEFAULT_TARIFF) {
  const max = Number(tariff?.maxLines) || DEFAULT_TARIFF.maxLines;
  return typeof lineCount === "number" && Number.isFinite(lineCount) && lineCount > max;
}

const CLP_FORMATTER = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

/**
 * Formatea un monto CLP para mostrar al usuario.
 * @param {number} amount
 * @returns {string} Ej. "$17.850"
 */
export function formatCLP(amount) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "—";
  return CLP_FORMATTER.format(amount);
}
