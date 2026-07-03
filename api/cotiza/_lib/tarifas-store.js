// Acceso compartido al blob `cotiza-tarifas.json` para los endpoints de cotiza.
// Lee con fallback a defaults bundled. Persiste cambios incrementales (ej:
// `usosActuales` de cupones al consumirlos).

import { list, put } from "@vercel/blob";
import defaultTarifas from "../../../src/content/cotiza-tarifas.json" with { type: "json" };

const BLOB_KEY = "cotiza-tarifas.json";

// Cachear la URL pública del blob en memoria del lambda (mismo patrón que
// api/content.js): list() es una "advanced operation" con cuota mensual
// (2k/mes en Hobby) y solo hace falta la primera vez tras un cold start —
// con addRandomSuffix:false la URL nunca cambia al reescribir.
let cachedBlobUrl = null;

export async function leerTarifas() {
  try {
    if (!cachedBlobUrl) {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      const target = blobs.find((b) => b.pathname === BLOB_KEY);
      if (target) cachedBlobUrl = target.url;
    }
    if (cachedBlobUrl) {
      const fetched = await fetch(cachedBlobUrl, { cache: "no-store" });
      if (fetched.ok) return await fetched.json();
      // URL inválida (improbable): invalidar para re-listar al próximo request.
      cachedBlobUrl = null;
    }
  } catch (err) {
    cachedBlobUrl = null;
    console.warn("[tarifas-store] read fail:", err?.message ?? err);
  }
  return defaultTarifas;
}

export async function escribirTarifas(data) {
  const out = {
    ...data,
    actualizado: new Date().toISOString().slice(0, 10),
  };
  await put(BLOB_KEY, JSON.stringify(out, null, 2), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
  return out;
}

/**
 * Verifica que un cupón está disponible AHORA (no expirado, no agotado, activo).
 * Devuelve { ok, motivo? }. No modifica estado.
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
    if (usados >= cupon.maxUsos) return { ok: false, motivo: "Cupón agotado" };
  }
  return { ok: true };
}

/**
 * Consume un cupón: valida y, si tiene `maxUsos`, incrementa `usosActuales` y
 * persiste el blob. Si el cupón es ilimitado, no escribe.
 *
 * Nota: Vercel Blob no tiene transacciones. Para la baja concurrencia esperada
 * (1-2 cotizaciones simultáneas) el último-en-escribir gana — riesgo aceptable.
 * Si en el futuro hay problemas, migrar el contador a Supabase (UPDATE ... RETURNING).
 */
export async function consumirCupon(codigo) {
  if (!codigo) return { ok: false, motivo: "Código no provisto" };
  const codigoUpper = String(codigo).trim().toUpperCase();
  const tarifas = await leerTarifas();
  const cupones = Array.isArray(tarifas.cupones) ? tarifas.cupones : [];
  const idx = cupones.findIndex((c) => c.codigo?.toUpperCase() === codigoUpper);
  if (idx < 0) return { ok: false, motivo: "Cupón no encontrado" };

  const cupon = cupones[idx];
  const disp = cuponDisponible(cupon);
  if (!disp.ok) return disp;

  // Solo persistir si hay límite de usos definido. Sin límite = solo validar.
  if (Number.isFinite(cupon.maxUsos) && cupon.maxUsos > 0) {
    const actualizado = {
      ...cupon,
      usosActuales: (Number(cupon.usosActuales) || 0) + 1,
    };
    const nuevasCupones = cupones.map((c, i) => (i === idx ? actualizado : c));
    try {
      await escribirTarifas({ ...tarifas, cupones: nuevasCupones });
    } catch (err) {
      console.error("[tarifas-store] no se pudo persistir consumo:", err?.message ?? err);
      return { ok: false, motivo: "No se pudo registrar el uso del cupón" };
    }
  }
  return { ok: true, cupon };
}
