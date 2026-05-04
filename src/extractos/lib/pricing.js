// Tarifa de extractos radiales — Radio La Frontera AM 1110.
// Confirmada con la operadora (Bertha Cabral) el 2026-05-04.
// Todos los montos en CLP, IVA incluido.
//
// Tabla:
//   1–5 líneas → $35.000 (mínimo)
//   N (>5)    → $25.000 + N * $2.000
//   Equivale a $35.000 + ($2.000 por cada línea sobre 5).

export const DEFAULT_TARIFF = Object.freeze({
  minLinesFlat: 5,
  minPrice: 35000,
  baseAboveMin: 25000,
  perLineAboveMin: 2000,
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
