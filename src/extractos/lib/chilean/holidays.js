// Feriados chilenos relevantes para resolver fechas de difusión radial.
// PRD §6.3 + Anexo D.
//
// Estrategia: dataset estático con todos los feriados nacionales (irrenunciables
// + civiles) año-por-año. Es más confiable que computar móviles por algoritmo,
// porque varios feriados chilenos se mueven al lunes según ley 19.668 y
// dependen de tablas anuales publicadas.
//
// Cobertura inicial: 2026–2030. Después de 2030 hay que actualizar antes
// del primer agendamiento de ese año (la operadora va a notar warnings en QA
// porque se va a comportar como año sin feriados móviles).
//
// Día Nacional de los Pueblos Indígenas (ley 21.357, 2021): solsticio austral
// de invierno. Tabla oficial publicada año-año.
//
// Fuente referencial: feriados oficiales de Chile (ley 2.977 + modificaciones).

const HOLIDAYS_BY_YEAR = {
  2026: [
    "2026-01-01", // Año Nuevo
    "2026-04-03", // Viernes Santo
    "2026-04-04", // Sábado Santo
    "2026-05-01", // Día del Trabajo
    "2026-05-21", // Glorias Navales
    "2026-06-21", // Día Nacional de los Pueblos Indígenas (solsticio)
    "2026-06-29", // San Pedro y San Pablo
    "2026-07-16", // Virgen del Carmen
    "2026-08-15", // Asunción de la Virgen
    "2026-09-18", // Independencia Nacional
    "2026-09-19", // Glorias del Ejército
    "2026-10-12", // Encuentro de Dos Mundos
    "2026-10-31", // Día de las Iglesias Evangélicas
    "2026-11-01", // Día de Todos los Santos
    "2026-12-08", // Inmaculada Concepción
    "2026-12-25", // Navidad
  ],
  2027: [
    "2027-01-01",
    "2027-03-26", // Viernes Santo
    "2027-03-27", // Sábado Santo
    "2027-05-01",
    "2027-05-21",
    "2027-06-21", // Pueblos Indígenas (solsticio)
    "2027-06-28", // San Pedro y San Pablo (movido a lunes)
    "2027-07-16",
    "2027-08-15",
    "2027-09-17", // feriado adicional habitual previo al 18 (depende de ley anual; conservador: NO incluir hasta confirmar). TODO confirmar.
    "2027-09-18",
    "2027-09-19", // Glorias del Ejército (cae domingo, no se mueve por ser fiesta patria)
    "2027-10-11", // Encuentro de Dos Mundos (movido a lunes)
    "2027-10-31",
    "2027-11-01", // domingo
    "2027-12-08",
    "2027-12-25",
  ],
  2028: [
    "2028-01-01",
    "2028-04-14",
    "2028-04-15",
    "2028-05-01",
    "2028-05-21",
    "2028-06-20", // Pueblos Indígenas (año bisiesto: solsticio cae 20)
    "2028-06-26", // San Pedro y San Pablo movido a lunes
    "2028-07-16",
    "2028-08-15",
    "2028-09-18",
    "2028-09-19",
    "2028-10-09", // Encuentro Dos Mundos movido
    "2028-10-31",
    "2028-11-01",
    "2028-12-08",
    "2028-12-25",
  ],
  2029: [
    "2029-01-01",
    "2029-03-30",
    "2029-03-31",
    "2029-05-01",
    "2029-05-21",
    "2029-06-21",
    "2029-06-29",
    "2029-07-16",
    "2029-08-15",
    "2029-09-18",
    "2029-09-19",
    "2029-10-15", // Encuentro Dos Mundos movido
    "2029-10-31",
    "2029-11-01",
    "2029-12-08",
    "2029-12-25",
  ],
  2030: [
    "2030-01-01",
    "2030-04-19",
    "2030-04-20",
    "2030-05-01",
    "2030-05-21",
    "2030-06-21",
    "2030-07-01", // San Pedro y San Pablo movido (29 jun = sábado)
    "2030-07-16",
    "2030-08-15",
    "2030-09-18",
    "2030-09-19",
    "2030-10-14", // Encuentro Dos Mundos movido
    "2030-10-31",
    "2030-11-01",
    "2030-12-08",
    "2030-12-25",
  ],
};

// Feriados fijos absolutos: caen siempre en el mismo día calendario.
// Se aplican como fallback para años fuera de la tabla anual.
const FIXED_HOLIDAYS_MONTHDAY = new Set([
  "01-01", // Año Nuevo
  "05-01", // Día del Trabajo
  "05-21", // Glorias Navales
  "07-16", // Virgen del Carmen
  "08-15", // Asunción
  "09-18", // Independencia
  "09-19", // Glorias del Ejército
  "10-31", // Iglesias Evangélicas
  "11-01", // Todos los Santos
  "12-08", // Inmaculada Concepción
  "12-25", // Navidad
]);

/** Convierte una Date a 'YYYY-MM-DD' en hora local Chile (-03 / -04). */
function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const HOLIDAY_SETS = new Map(
  Object.entries(HOLIDAYS_BY_YEAR).map(([year, list]) => [Number(year), new Set(list)]),
);

/**
 * @param {Date} date
 * @returns {boolean}
 */
export function isChileanHoliday(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return false;
  const iso = toIsoDate(date);
  const year = date.getFullYear();

  const yearSet = HOLIDAY_SETS.get(year);
  if (yearSet) return yearSet.has(iso);

  // Fallback fuera de la tabla: solo fijos.
  const monthDay = iso.slice(5);
  return FIXED_HOLIDAYS_MONTHDAY.has(monthDay);
}

/** @param {Date} date */
export function isSunday(date) {
  return date instanceof Date && date.getDay() === 0;
}

/**
 * Indica si la tabla anual cubre el año dado. Útil para mostrar warning
 * a la operadora si está agendando muy lejos en el futuro.
 * @param {number} year
 */
export function hasHolidayDataForYear(year) {
  return HOLIDAY_SETS.has(year);
}

export const SUPPORTED_HOLIDAY_YEARS = Array.from(HOLIDAY_SETS.keys()).sort();
