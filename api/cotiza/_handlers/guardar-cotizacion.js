// POST con auth: persiste una cotización formal armada en /cotiza/interno.
// Se llama:
//  - Internamente desde /api/cotiza/enviar-cliente tras enviar el email
//  - Externamente desde el botón "Marcar enviada por WhatsApp" del cotizador
// El trigger asigna número COT-YYYY-NNNN automáticamente.

import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { checkAuth, denyAuth } from "../_lib/auth.js";

export const config = { runtime: "nodejs" };

function clean(s, max = 400) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}
function num(n) {
  return typeof n === "number" && Number.isFinite(n) ? Math.round(n) : 0;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const auth = await checkAuth(req);
  if (auth !== "ok") return denyAuth(res, auth);

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured" });
  }

  const b = req.body || {};
  // Backward compat: aceptamos formato plano (legacy) o nuevo con propuesta_a/_b
  const propA = b.propuesta_a || b;
  const propB = b.propuesta_b || null;

  if (!Array.isArray(propA.lineas) || propA.lineas.length === 0) {
    return res.status(400).json({ error: "Falta arreglo lineas" });
  }
  if (typeof propA.total !== "number" || propA.total <= 0) {
    return res.status(400).json({ error: "Total inválido" });
  }
  if (!clean(b.cliente?.nombre)) {
    return res.status(400).json({ error: "Nombre del cliente requerido" });
  }

  const enviada_via = ["email", "whatsapp", "manual"].includes(b.enviada_via) ? b.enviada_via : "manual";

  const cleanLineas = (lineas) => (lineas || []).map((l) => ({
    detalle: clean(l.detalle, 300),
    subtotal: num(l.subtotal),
  }));

  const propuestaBJson = propB ? {
    lineas: cleanLineas(propB.lineas),
    subtotal: num(propB.subtotal),
    descuento_pyme: num(propB.descuento_pyme),
    descuento_agencia: num(propB.descuento_agencia),
    descuento_cupon: num(propB.descuento_cupon),
    iva: num(propB.iva),
    total: num(propB.total),
    pyme_aplicado: Boolean(propB.pyme_aplicado),
    agencia_tramo: clean(propB.agencia_tramo, 80) || null,
    cupon_codigo: clean(propB.cupon_codigo, 40) || null,
    comentarios: clean(propB.comentarios, 2000) || null,
  } : null;

  const row = {
    solicitud_id: b.solicitud_id || null,
    cliente_nombre: clean(b.cliente.nombre, 200),
    cliente_empresa: clean(b.cliente.empresa, 200) || null,
    cliente_telefono: clean(b.cliente.telefono, 80) || null,
    cliente_email: clean(b.cliente.email, 200) || null,
    lineas: cleanLineas(propA.lineas),
    comentarios: clean(propA.comentarios, 2000) || null,
    subtotal: num(propA.subtotal),
    descuento_pyme: num(propA.descuento_pyme),
    descuento_agencia: num(propA.descuento_agencia),
    descuento_cupon: num(propA.descuento_cupon),
    iva: num(propA.iva),
    total: num(propA.total),
    pyme_aplicado: Boolean(propA.pyme_aplicado),
    agencia_tramo: clean(propA.agencia_tramo, 80) || null,
    cupon_codigo: clean(propA.cupon_codigo, 40) || null,
    estado: "enviada",
    enviada_via,
    enviada_a: clean(b.enviada_a, 200) || null,
    propuesta_b: propuestaBJson,
  };

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cotiza_cotizaciones")
      .insert(row)
      .select("id, numero, estado, created_at")
      .single();
    if (error) {
      console.error("[/api/cotiza/guardar-cotizacion] insert fail:", error.message);
      return res.status(500).json({ error: "db_error" });
    }
    return res.status(200).json({ ok: true, cotizacion: data });
  } catch (err) {
    console.error("[/api/cotiza/guardar-cotizacion]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
