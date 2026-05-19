/**
 * Helpers de cálculo y formato para el cotizador.
 *
 * El catálogo de tarifas vive en src/content/cotiza-tarifas.json (defaults
 * bundled) y se sirve runtime desde /api/cotiza/tarifas, que lee un blob
 * editable desde /cotiza/admin. Acá solo viven helpers puros, sin precios.
 */

import defaultsBundled from "../content/cotiza-tarifas.json";

export const TARIFAS_DEFAULT = defaultsBundled;

export function formatCLP(n) {
  if (!Number.isFinite(n)) return "$0";
  return "$" + Math.round(n).toLocaleString("es-CL");
}

/**
 * Verifica que un cupón sea válido en este momento: no expirado y con usos
 * disponibles. Devuelve { ok: true } o { ok: false, motivo: string }.
 */
export function cuponDisponible(cupon, ahora = new Date()) {
  if (!cupon) return { ok: false, motivo: "Cupón no encontrado" };
  if (cupon.activo === false) return { ok: false, motivo: "Cupón desactivado" };
  if (cupon.expiraEn) {
    const expira = new Date(cupon.expiraEn);
    if (!Number.isNaN(expira.getTime()) && expira < ahora) {
      return { ok: false, motivo: "Cupón expirado" };
    }
  }
  if (Number.isFinite(cupon.maxUsos) && cupon.maxUsos > 0) {
    const usados = Number(cupon.usosActuales) || 0;
    if (usados >= cupon.maxUsos) return { ok: false, motivo: "Cupón ya alcanzó su límite de usos" };
  }
  return { ok: true };
}

export function validarCupon(codigoInput, cupones) {
  if (!codigoInput || !Array.isArray(cupones)) return { cupon: null, motivo: "Código no válido" };
  const codigo = codigoInput.trim().toUpperCase();
  const cupon = cupones.find((c) => c.codigo?.toUpperCase() === codigo);
  if (!cupon) return { cupon: null, motivo: "Código no válido" };
  const disp = cuponDisponible(cupon);
  if (!disp.ok) return { cupon: null, motivo: disp.motivo };
  return { cupon, motivo: null };
}

export function aplicarCupon(subtotal, cupon) {
  if (!cupon) return 0;
  if (cupon.tipo === "porcentaje") return Math.round((subtotal * cupon.valor) / 100);
  if (cupon.tipo === "monto") return Math.min(cupon.valor, subtotal);
  return 0;
}

/* ─── Cálculo de líneas ───────────────────────────────────────────────────── */
export function precioLineaFrase(formato, seleccion) {
  const horario = formato.horarios.find((h) => h.id === seleccion.horarioId);
  if (!horario) return null;
  const pack = horario.packs.find((p) => p.id === seleccion.packId);
  if (!pack) return null;
  const meses = Math.max(1, Number(seleccion.meses) || 1);
  const esPackMensual = pack.id !== "suelta";
  const cantidadFrases = pack.frases * meses;
  const subtotalMensual = pack.precioUnitario * pack.frases;
  const subtotal = esPackMensual ? subtotalMensual * meses : pack.precioUnitario * meses;
  return {
    detalle: `${formato.titulo} · ${horario.label} · ${pack.label}${esPackMensual ? ` × ${meses} ${meses === 1 ? "mes" : "meses"}` : meses > 1 ? ` × ${meses}` : ""}`,
    horarioLabel: horario.label,
    packLabel: pack.label,
    cantidadFrases,
    subtotal,
    meses,
    esPackMensual,
  };
}

export function precioLineaUnidad(formato, seleccion) {
  const unidad = formato.unidades.find((u) => u.id === seleccion.unidadId);
  if (!unidad) return null;
  const cantidad = Math.max(0, Number(seleccion.cantidad) || 0);
  if (cantidad === 0) return null;

  const aplicaDespacho = Boolean(seleccion.despacho && formato.permiteDespacho);
  const recargoPct = aplicaDespacho ? Number(formato.recargoDespacho) || 0 : 0;
  const precioConRecargo = Math.round(unidad.precio * (1 + recargoPct));
  const sufijoDespacho = aplicaDespacho
    ? ` · despacho en terreno (+${Math.round(recargoPct * 100)}%)`
    : "";

  return {
    detalle: `${unidad.label}${sufijoDespacho} × ${cantidad}`,
    cantidad,
    subtotal: precioConRecargo * cantidad,
    precioUnitario: precioConRecargo,
    despacho: aplicaDespacho,
  };
}

export function calcularLineas(formatos, selecciones) {
  const lineas = [];
  for (const [formatoId, sel] of Object.entries(selecciones)) {
    const formato = formatos.find((f) => f.id === formatoId);
    if (!formato) continue;
    const linea =
      formato.horarios ? precioLineaFrase(formato, sel) : precioLineaUnidad(formato, sel);
    if (linea) lineas.push({ formato, ...linea });
  }
  return lineas;
}

export function calcularTotales({ lineas, ivaRate = 0.19, cupon = null }) {
  const subtotal = lineas.reduce((sum, l) => sum + l.subtotal, 0);
  const descuento = aplicarCupon(subtotal, cupon);
  const baseConDescuento = Math.max(0, subtotal - descuento);
  const iva = Math.round(baseConDescuento * ivaRate);
  const total = baseConDescuento + iva;
  return { subtotal, descuento, baseConDescuento, iva, total };
}
