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
 *     auspicio:    { activo, cantidad, franjas: ["manana"|"tarde"|"noche"], meses },
 *     frases:      { activo, horario: "base"|"prime", pack: "suelta"|"30"|…, cantidad, meses },
 *     entrevistas: { activo, cantidades: { "5min": n, … }, despacho },
 *     podcast:     { activo, modalidad: "grabado"|"diferido"|"vivo", cantidades: { "30min": n, … } (por mes), meses: 1|6|12 },
 *   }
 */

import defaultsBundled from "../content/cotiza-tarifas.json" with { type: "json" };

const MAX_PROGRAMAS = 10;

// Franjas de preferencia. El programa concreto se define internamente con el
// cliente (hay bloques arrendados), por eso la web nunca nombra programas.
export const FRANJAS = [
  { id: "manana", label: "Mañana", desde: 6, hasta: 13 },
  { id: "tarde", label: "Tarde", desde: 13, hasta: 18 },
  { id: "noche", label: "Noche", desde: 18, hasta: 20 },
];
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

/**
 * Modalidades del podcast (grabado, diferido, en vivo). Si el tarifario
 * guardado en el blob todavía no las trae, valen las del bundle.
 */
export function modalidadesPodcast(tarifas) {
  const propias = formatoDe(tarifas, "podcast")?.modalidades;
  return Array.isArray(propias) && propias.length ? propias : defaultsBundled.formatos.find((f) => f.id === "podcast").modalidades;
}

/** Precio de un episodio según modalidad: base + recargo por minuto. */
export function precioPodcast(unidad, modalidad) {
  const minutos = Number(unidad.minutos) || parseInt(unidad.id, 10) || 0;
  return unidad.precio + minutos * (Number(modalidad?.recargoPorMinuto) || 0);
}

export function plazosAuspicio(tarifas) {
  return auspicioDe(tarifas).plazos;
}

export const SELECCION_INICIAL = {
  auspicio: { activo: true, cantidad: 1, franjas: [], meses: 1 },
  frases: { activo: false, horario: "base", pack: "60", cantidad: 10, meses: 1 },
  entrevistas: { activo: false, cantidades: { "5min": 0, "10min": 1, "15min": 0 }, despacho: false },
  podcast: { activo: false, modalidad: "grabado", cantidades: { "30min": 0, "60min": 1 }, meses: 1 },
};

/**
 * Devuelve las líneas del presupuesto y los totales.
 * Las franjas se filtran contra FRANJAS, así no llega texto libre al correo.
 */
export function calcular(sel, tarifas) {
  const iva = Number.isFinite(tarifas?.iva) ? tarifas.iva : defaultsBundled.iva;
  const lineas = [];

  // ── Auspicio de programa ──────────────────────────────────────────────
  const a = sel?.auspicio;
  if (a?.activo) {
    const cantidad = entero(a.cantidad, 1, MAX_PROGRAMAS);
    const franjas = FRANJAS.filter((f) => Array.isArray(a.franjas) && a.franjas.includes(f.id));
    const plazos = plazosAuspicio(tarifas);
    const plazo = plazos.find((p) => p.meses === Number(a.meses)) || plazos[0];
    const base = auspicioMensualBase(tarifas);
    const mensualPorPrograma = Math.round(base * (1 - plazo.descuento / 100));
    {
      const mensual = mensualPorPrograma * cantidad;
      lineas.push({
        id: "auspicio",
        titulo: cantidad === 1 ? "Auspicio de programa" : `Auspicio · ${cantidad} programas`,
        detalle: [
          franjas.length ? `Franja preferida: ${franjas.map((f) => f.label.toLowerCase()).join(", ")}` : "Programa a definir con el equipo",
          "2 menciones en vivo + 2 frases por programa, lunes a viernes",
          `${plazo.meses} ${plazo.meses === 1 ? "mes" : "meses"}${plazo.descuento ? ` (−${plazo.descuento}%)` : ""}`,
        ].filter(Boolean),
        mensual,
        meses: plazo.meses,
        subtotal: mensual * plazo.meses,
        ahorro: (base - mensualPorPrograma) * cantidad * plazo.meses,
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
    const modalidades = clave === "podcast" ? modalidadesPodcast(tarifas) : [];
    const modalidad = modalidades.find((m) => m.id === s.modalidad) || modalidades[0];
    const partes = [];
    let subtotal = 0;
    let total = 0;
    for (const u of formato?.unidades || []) {
      const n = entero(s.cantidades?.[u.id], 0, MAX_UNIDADES);
      if (!n) continue;
      const precio = clave === "podcast" ? precioPodcast(u, modalidad) : Math.round(u.precio * (1 + recargo));
      subtotal += n * precio;
      total += n;
      partes.push(`${n} × ${u.label.replace(/^(Entrevista|Podcast) de /, "")} (${fmtCLP(precio)})`);
    }
    // El podcast se contrata con plazo (1, 6 o 12 meses): las cantidades son
    // episodios por mes y el descuento del plazo rebaja el valor mensual.
    if (total > 0 && clave === "podcast") {
      const plazos = plazosAuspicio(tarifas);
      const plazo = plazos.find((p) => p.meses === Number(s.meses)) || plazos[0];
      const mensual = Math.round(subtotal * (1 - plazo.descuento / 100));
      const extras = [modalidad ? `Modalidad: ${modalidad.label.toLowerCase()}` : null];
      if (plazo.meses > 1) {
        lineas.push({
          id: clave,
          titulo: `Podcast · ${total} al mes por ${plazo.meses} meses`,
          detalle: [...partes.map((x) => `${x} al mes`), ...extras, `${plazo.meses} meses (−${plazo.descuento}%)`].filter(Boolean),
          mensual,
          meses: plazo.meses,
          subtotal: mensual * plazo.meses,
          ahorro: (subtotal - mensual) * plazo.meses,
        });
      } else {
        lineas.push({
          id: clave,
          titulo: `Podcast · ${total} ${total === 1 ? "episodio" : "episodios"}`,
          detalle: [...partes, ...extras].filter(Boolean),
          unico: subtotal,
          subtotal,
        });
      }
      continue;
    }
    if (total > 0) {
      lineas.push({
        id: clave,
        titulo: `${nombre} · ${total} ${clave === "podcast" ? (total === 1 ? "episodio" : "episodios") : (total === 1 ? "entrevista" : "entrevistas")}`,
        detalle: [...partes, recargo ? `Despacho en terreno (+${Math.round(recargo * 100)}%)` : null, modalidad ? `Modalidad: ${modalidad.label.toLowerCase()}` : null].filter(Boolean),
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
    n += porPrograma * entero(a.cantidad, 1, MAX_PROGRAMAS);
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
