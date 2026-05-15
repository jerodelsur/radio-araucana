// Horarios de difusión (Bertha, 2026-05-15).
//
// Cada día de difusión (1 o 15 del mes) tiene 2 bloques horarios. Cada
// extracto se difunde 3 veces consecutivas (una emisión por hora del bloque).
// Internamente, dentro de cada hora hay 24 slots de 2:30 min — el cliente y
// el certificado solo necesitan saber "A o B", no el slot exacto.

export const TIME_BLOCKS = Object.freeze({
  A: Object.freeze({ id: "A", hours: ["08:00", "10:00", "12:00"], capacity: 24 }),
  B: Object.freeze({ id: "B", hours: ["09:00", "11:00", "13:00"], capacity: 24 }),
});

export const BLOCK_CAPACITY = 24;
export const DAILY_CAPACITY = 48;

/**
 * Devuelve un texto humano para mostrar al cliente / poner en el certificado.
 * Ej: "Horario A — 08:00, 10:00, 12:00"
 * @param {"A"|"B"|null|undefined} blockId
 */
export function blockLabel(blockId) {
  if (!blockId) return "Sin asignar";
  const b = TIME_BLOCKS[blockId];
  if (!b) return blockId;
  return `Horario ${b.id} — ${b.hours.join(", ")}`;
}

/**
 * Texto corto para tablas/badges.
 * @param {"A"|"B"|null|undefined} blockId
 */
export function blockShort(blockId) {
  if (!blockId) return "—";
  const b = TIME_BLOCKS[blockId];
  if (!b) return blockId;
  return `${b.id} (${b.hours.map((h) => h.slice(0, 2)).join("/")})`;
}
