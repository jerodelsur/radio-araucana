// Resolución de fecha de difusión radial. PRD §6.3.
//
// Regla: la radio difunde los días 1 o 15 de cada mes. Si esa fecha cae
// domingo o festivo chileno, se difunde el día hábil siguiente.
// Sábados son válidos (NO se mueven).

import { isChileanHoliday, isSunday, hasHolidayDataForYear } from "./chilean/holidays.js";

const SPANISH_MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const SPANISH_WEEKDAYS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
];

/**
 * @param {Date} date
 * @param {number} days
 */
function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Resuelve la fecha real de difusión según día base (1 o 15) y mes/año.
 * @param {1|15} day
 * @param {string} monthYear  Formato 'YYYY-MM'.
 * @returns {{
 *   resolvedDate: Date,
 *   shifted: boolean,
 *   shiftDays: number,
 *   warning: string | null
 * }}
 */
export function resolveBroadcastDate(day, monthYear) {
  if (day !== 1 && day !== 15) {
    throw new RangeError("day debe ser 1 o 15");
  }
  const match = /^(\d{4})-(\d{2})$/.exec(String(monthYear ?? ""));
  if (!match) {
    throw new TypeError("monthYear debe tener formato 'YYYY-MM'");
  }
  const year = Number(match[1]);
  const month = Number(match[2]); // 1-12
  if (month < 1 || month > 12) {
    throw new RangeError("monthYear: mes inválido");
  }

  // Construyo en hora local del navegador (Chile cuando se usa en cliente).
  // Los métodos getDay/getDate operan en local time, lo que evita que el desfase
  // UTC/CL nos cambie de día.
  let date = new Date(year, month - 1, day, 0, 0, 0, 0);

  let shiftDays = 0;
  // Cap defensivo: si por algún motivo no se resuelve en 14 días, abortamos.
  while ((isSunday(date) || isChileanHoliday(date)) && shiftDays < 14) {
    date = addDays(date, 1);
    shiftDays++;
  }

  const warning = hasHolidayDataForYear(year)
    ? null
    : `No tenemos calendario de feriados cargado para ${year}. La fecha mostrada solo considera domingos y feriados fijos. Confirma con la radio antes de pagar.`;

  return {
    resolvedDate: date,
    shifted: shiftDays > 0,
    shiftDays,
    warning,
  };
}

/**
 * Formatea una fecha en español-CL: "lunes 15 de septiembre de 2026".
 * @param {Date} date
 */
export function formatLongDateCL(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  const weekday = SPANISH_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = SPANISH_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday} ${day} de ${month} de ${year}`;
}

/**
 * Formato del cuerpo del certificado: "01 de Febrero de 2025".
 * @param {Date} date
 */
export function formatCertificateDateCL(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = capitalize(SPANISH_MONTHS[date.getMonth()]);
  const year = date.getFullYear();
  return `${day} de ${month} de ${year}`;
}

/**
 * Formato de pie de certificado (notarial chileno): "Febrero 03 de 2025".
 * @param {Date} date
 */
export function formatCertificateFooterDateCL(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "—";
  const day = String(date.getDate()).padStart(2, "0");
  const month = capitalize(SPANISH_MONTHS[date.getMonth()]);
  const year = date.getFullYear();
  return `${month} ${day} de ${year}`;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Lista de los próximos N agendamientos válidos (días 1 o 15) hacia adelante,
 * útil para popular un selector en el cotizador sin que el usuario tenga
 * que tipear mes/año. Devuelve fechas resueltas (ya saltando dom/fest).
 *
 * @param {Date} fromDate  Punto de partida.
 * @param {number} count   Cuántos agendamientos generar.
 * @returns {Array<{ day: 1|15, monthYear: string, resolved: ReturnType<typeof resolveBroadcastDate> }>}
 */
export function listUpcomingSlots(fromDate, count = 8) {
  if (!(fromDate instanceof Date) || Number.isNaN(fromDate.getTime())) {
    throw new TypeError("fromDate inválido");
  }
  const slots = [];
  let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
  // Cota dura para no loopear infinito si los feriados desplazan demasiado.
  let monthsAhead = 0;
  while (slots.length < count && monthsAhead < count + 24) {
    for (const day of /** @type {const} */ ([1, 15])) {
      const monthYear = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const resolved = resolveBroadcastDate(day, monthYear);
      // Excluyo agendamientos cuya fecha resuelta ya pasó.
      if (resolved.resolvedDate.getTime() > fromDate.getTime()) {
        slots.push({ day, monthYear, resolved });
        if (slots.length >= count) break;
      }
    }
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
    monthsAhead++;
  }
  return slots;
}
