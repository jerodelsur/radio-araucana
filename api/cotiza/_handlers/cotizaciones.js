// GET con auth: lista cotizaciones formales con filtros. Marca vencidas lazy
// (>30 días enviada sin respuesta) antes de devolver el listado.
//
// Query params:
//   estado=enviada|aceptada|rechazada|vencida|todas (default: todas)
//   q=texto    (búsqueda en nombre/empresa/email/numero)
//   limit=N    (default 100, max 500)

import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { authOk } from "../_lib/auth.js";

export const config = { runtime: "nodejs" };

const ESTADOS_VALIDOS = ["enviada", "aceptada", "rechazada", "vencida", "todas"];

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!(await authOk(req))) return res.status(401).json({ error: "Unauthorized" });

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured", cotizaciones: [] });
  }

  res.setHeader("Cache-Control", "no-store");

  const estado = typeof req.query?.estado === "string" ? req.query.estado : "todas";
  if (!ESTADOS_VALIDOS.includes(estado)) {
    return res.status(400).json({ error: "estado inválido", validos: ESTADOS_VALIDOS });
  }

  const q = typeof req.query?.q === "string" ? req.query.q.trim().slice(0, 100) : "";
  const limit = Math.min(500, Math.max(1, Number(req.query?.limit) || 100));

  try {
    const supabase = getSupabaseAdmin();

    // Marcar vencidas (lazy): cotizaciones enviada hace más de 30 días sin
    // respuesta. La función está definida en la migración 0011.
    try {
      await supabase.rpc("mark_cotizaciones_vencidas");
    } catch (err) {
      console.warn("[/api/cotiza/cotizaciones] mark_vencidas fail:", err?.message);
    }

    let query = supabase
      .from("cotiza_cotizaciones")
      .select("id, numero, created_at, cliente_nombre, cliente_empresa, cliente_telefono, cliente_email, lineas, subtotal, descuento_pyme, descuento_agencia, descuento_cupon, iva, total, estado, enviada_en, enviada_via, enviada_a, cambio_estado_en, cambio_estado_por, notas_internas, comentarios, pyme_aplicado, agencia_tramo, cupon_codigo, solicitud_id, propuesta_b")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (estado !== "todas") query = query.eq("estado", estado);
    if (q) {
      const safe = q.replace(/[%_]/g, "");
      query = query.or(`numero.ilike.%${safe}%,cliente_nombre.ilike.%${safe}%,cliente_empresa.ilike.%${safe}%,cliente_email.ilike.%${safe}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("[/api/cotiza/cotizaciones] select fail:", error.message);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }
    return res.status(200).json({ cotizaciones: data || [] });
  } catch (err) {
    console.error("[/api/cotiza/cotizaciones]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
