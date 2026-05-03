// Tarifa de extractos radiales — Radio La Frontera AM / Radio Araucana FM.
// PRD §6.1. Todos los montos en CLP, IVA incluido.
//
// Tabla:
//   1–4 líneas → $17.850 (mínimo)
//   N (≥5)    → $20.000 + N * $1.000
//
// La función debe poder leer el tarifario desde la tabla `settings` de Supabase
// para que la operadora lo edite sin redeploy. Acá exponemos:
//   - DEFAULT_TARIFF: fallback hardcoded usado si BD no tiene settings.
//   - calculatePriceCLP(lines, tariff?): cálculo puro.
//   - formatCLP(amount): formato chileno "$17.850".

export const DEFAULT_TARIFF = Object.freeze({
  minLinesFlat: 4,
  minPrice: 17850,
  baseAboveMin: 20000,
  perLineAboveMin: 1000,
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
