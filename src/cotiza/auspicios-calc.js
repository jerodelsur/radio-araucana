/**
 * Cálculo del cotizador de auspicios (/cotiza/auspicios).
 *
 * Módulo puro, sin React: lo usa la página para mostrar el total en vivo y lo
 * usa /api/cotiza/submit para recalcular en el servidor lo que la persona
 * envió (así el correo al equipo nunca trae un precio manipulado desde el
 * navegador).
 *
 * Precios: todo sale del tarifario (src/content/cotiza-tarifas.json o el blob
 * editable). Si el blob de producción todavía no trae el bloque `auspicio`,
 * se usa el del bundle.
 *
 * Forma de la selección:
 *   {
 *     auspicio:    { activo, programas: [nombre], meses },
 *     frases:      { activo, horario: "base"|"prime", pack: "suelta"|"30"|…, cantidad, meses },
 *     entrevistas: { activo, cantidades: { "5min": n, … }, despacho },
 *     podcast:     { activo, cantidades: { "30min": n, … } },
 *   }
 */

import defaultsBundled from "../content/cotiza-tarifas.json" with { type: "json" };

const MAX_PROGRAMAS = 10;
const MAX_MESES = 12;
const MAX_UNIDADES = 50;
const MAX_SUELTAS = 500;

function entero(v, min, max) {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function fmtCLP(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
}

export function auspicioDe(tarifas) {
  return tarifas?.auspicio?.componentes?.length ? tarifas.auspicio : defaultsBundled.auspicio;
}

export function formatoDe(tarifas, id) {
  return (tarifas?.formatos || []).find((f) => f.id === id)
    || defaultsBundled.formatos.find((f) => f.id === id);
}

/** Precio mensual del auspicio de UN programa, sin descuento. */
export function auspicioMensualBase(tarifas) {
  return auspicioDe(tarifas).componentes
    .reduce((s, c) => s + c.cantidadMensual * c.precioUnitario, 0);
}

export function plazosAuspicio(tarifas) {
  return auspicioDe(tarifas).plazos;
}

export const SELECCION_INICIAL = {
  auspicio: { activo: true, programas: [], meses: 1 },
  frases: { activo: false, horario: "base", pack: "60", cantidad: 10, meses: 1 },
  entrevistas: { activo: false, cantidades: { "5min": 0, "10min": 1, "15min": 0 }, despacho: false },
  podcast: { activo: false, cantidades: { "30min": 0, "60min": 1 } },
};

/**
 * Devuelve las líneas del presupuesto y los totales.
 * `programasValidos` (opcional) restringe los nombres de programa aceptados;
 * el servidor lo pasa para que no lleguen nombres inventados al correo.
 */
export function calcular(sel, tarifas, { programasValidos } = {}) {
  const iva = Number.isFinite(tarifas?.iva) ? tarifas.iva : defaultsBundled.iva;
  const lineas = [];

  // ── Auspicio de programa ──────────────────────────────────────────────
  const a = sel?.auspicio;
  if (a?.activo) {
    let programas = Array.isArray(a.programas) ? a.programas.map((p) => String(p).slice(0, 80)) : [];
    if (programasValidos) programas = programas.filter((p) => programasValidos.includes(p));
    programas = [...new Set(programas)].slice(0, MAX_PROGRAMAS);
    const plazos = plazosAuspicio(tarifas);
    const plazo = plazos.find((p) => p.meses === Number(a.meses)) || plazos[0];
    const base = auspicioMensualBase(tarifas);
    const mensualPorPrograma = Math.round(base * (1 - plazo.descuento / 100));
    if (programas.length > 0) {
      const mensual = mensualPorPrograma * programas.length;
      lineas.push({
        id: "auspicio",
        titulo: programas.length === 1 ? `Auspicio · ${programas[0]}` : `Auspicio · ${programas.length} programas`,
        detalle: [
          programas.length > 1 ? programas.join(", ") : null,
          "2 menciones en vivo + 2 frases por programa, lunes a viernes",
          `${plazo.meses} ${plazo.meses === 1 ? "mes" : "meses"}${plazo.descuento ? ` (−${plazo.descuento}%)` : ""}`,
        ].filter(Boolean),
        mensual,
        meses: plazo.meses,
        subtotal: mensual * plazo.meses,
        ahorro: (base - mensualPorPrograma) * programas.length * plazo.meses,
      });
    }
  }

  // ── Frases (packs mensuales o sueltas) ────────────────────────────────
  const f = sel?.frases;
  if (f?.activo) {
    const formato = formatoDe(tarifas, "frase_comercial");
    const horario = formato?.horarios?.find((h) => h.id === f.horario) || formato?.horarios?.[0];
    const pack = horario?.packs?.find((p) => p.id === String(f.pack)) || horario?.packs?.[0];
    if (pack) {
      const nombreHorario = horario.id === "prime" ? "Horario seleccionado" : "Horario repartido";
      if (pack.id === "suelta") {
        const cantidad = entero(f.cantidad, 1, MAX_SUELTAS);
        lineas.push({
          id: "frases",
          titulo: `Frases de 30″ · ${cantidad} sueltas`,
          detalle: [nombreHorario, `${cantidad} × ${fmtCLP(pack.precioUnitario)}`],
          unico: cantidad * pack.precioUnitario,
          subtotal: cantidad * pack.precioUnitario,
        });
      } else {
        const meses = entero(f.meses, 1, MAX_MESES);
        const mensual = pack.frases * pack.precioUnitario;
        lineas.push({
          id: "frases",
          titulo: `Frases de 30″ · pack ${pack.frases} al mes`,
          detalle: [nombreHorario, `${pack.frases} × ${fmtCLP(pack.precioUnitario)}`, `${meses} ${meses === 1 ? "mes" : "meses"}`],
          mensual,
          meses,
          subtotal: mensual * meses,
        });
      }
    }
  }

  // ── Unidades: entrevistas y podcast ───────────────────────────────────
  for (const [clave, formatoId, nombre] of [["entrevistas", "entrevista", "Entrevistas"], ["podcast", "podcast", "Podcast"]]) {
    const s = sel?.[clave];
    if (!s?.activo) continue;
    const formato = formatoDe(tarifas, formatoId);
    const recargo = clave === "entrevistas" && s.despacho && formato?.permiteDespacho ? (formato.recargoDespacho || 0) : 0;
    const partes = [];
    let subtotal = 0;
    let total = 0;
    for (const u of formato?.unidades || []) {
      const n = entero(s.cantidades?.[u.id], 0, MAX_UNIDADES);
      if (!n) continue;
      const precio = Math.round(u.precio * (1 + recargo));
      subtotal += n * precio;
      total += n;
      partes.push(`${n} × ${u.label.replace(/^(Entrevista|Podcast) de /, "")} (${fmtCLP(precio)})`);
    }
    if (total > 0) {
      lineas.push({
        id: clave,
        titulo: `${nombre} · ${total} ${clave === "podcast" ? (total === 1 ? "episodio" : "episodios") : (total === 1 ? "entrevista" : "entrevistas")}`,
        detalle: [...partes, recargo ? `Despacho en terreno (+${Math.round(recargo * 100)}%)` : null].filter(Boolean),
        unico: subtotal,
        subtotal,
      });
    }
  }

  const neto = lineas.reduce((s, l) => s + l.subtotal, 0);
  const mensual = lineas.reduce((s, l) => s + (l.mensual || 0), 0);
  const unico = lineas.reduce((s, l) => s + (l.unico || 0), 0);
  const ahorro = lineas.reduce((s, l) => s + (l.ahorro || 0), 0);
  const ivaMonto = Math.round(neto * iva);
  return { lineas, neto, iva: ivaMonto, total: neto + ivaMonto, mensual, unico, ahorro, ivaTasa: iva };
}

/**
 * Cuántas veces sale la marca al aire durante el primer mes: menciones y
 * frases del auspicio, frases del pack (o sueltas), entrevistas y podcast.
 */
export function salidasAlAire(sel, tarifas) {
  let n = 0;
  const a = sel?.auspicio;
  if (a?.activo) {
    const porPrograma = auspicioDe(tarifas).componentes.reduce((s, c) => s + c.cantidadMensual, 0);
    n += porPrograma * Math.min(MAX_PROGRAMAS, new Set(a.programas || []).size);
  }
  const f = sel?.frases;
  if (f?.activo) {
    const formato = formatoDe(tarifas, "frase_comercial");
    const horario = formato?.horarios?.find((h) => h.id === f.horario) || formato?.horarios?.[0];
    const pack = horario?.packs?.find((p) => p.id === String(f.pack)) || horario?.packs?.[0];
    if (pack) n += pack.id === "suelta" ? entero(f.cantidad, 1, MAX_SUELTAS) : pack.frases;
  }
  for (const [clave, formatoId] of [["entrevistas", "entrevista"], ["podcast", "podcast"]]) {
    const s = sel?.[clave];
    if (!s?.activo) continue;
    for (const u of formatoDe(tarifas, formatoId)?.unidades || []) n += entero(s.cantidades?.[u.id], 0, MAX_UNIDADES);
  }
  return n;
}
