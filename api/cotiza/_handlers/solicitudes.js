// GET con auth: lista solicitudes públicas guardadas. Devuelve por defecto
// las pendientes ordenadas por más reciente. Aceptan ?estado=atendida para
// histórico.

import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { authOk } from "../_lib/auth.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!authOk(req)) return res.status(401).json({ error: "Unauthorized" });

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured", solicitudes: [] });
  }

  res.setHeader("Cache-Control", "no-store");

  const estado = typeof req.query?.estado === "string" ? req.query.estado : "pendiente";
  const validos = ["pendiente", "atendida", "descartada", "todas"];
  if (!validos.includes(estado)) {
    return res.status(400).json({ error: "estado inválido", validos });
  }

  try {
    const supabase = getSupabaseAdmin();
    let query = supabase
      .from("cotiza_solicitudes")
      .select("id, created_at, cliente_nombre, cliente_empresa, cliente_telefono, cliente_email, pedido, comentarios, estado, atendida_en, atendida_por, cotizacion_total")
      .order("created_at", { ascending: false })
      .limit(100);
    if (estado !== "todas") query = query.eq("estado", estado);

    const { data, error } = await query;
    if (error) {
      console.error("[/api/cotiza/solicitudes] select fail:", error?.message);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }
    return res.status(200).json({ solicitudes: data || [] });
  } catch (err) {
    console.error("[/api/cotiza/solicitudes]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
