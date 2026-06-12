// POST con auth: elimina (hard delete) una solicitud de cotiza_solicitudes.
// Pensado para limpiar pruebas o solicitudes duplicadas. La acción es
// irreversible — el frontend pide confirmación antes de invocar.
// Body: { id: uuid }

import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { authOk } from "../_lib/auth.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!(await authOk(req))) return res.status(401).json({ error: "Unauthorized" });

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured" });
  }

  const { id } = req.body || {};
  if (!id || typeof id !== "string") return res.status(400).json({ error: "id requerido" });

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cotiza_solicitudes")
      .delete()
      .eq("id", id)
      .select("id, cliente_nombre")
      .single();
    if (error) {
      console.error("[/api/cotiza/eliminar-solicitud] delete fail:", error.message);
      return res.status(500).json({ error: "db_error" });
    }
    if (!data) {
      return res.status(404).json({ error: "not_found" });
    }
    return res.status(200).json({ ok: true, eliminada: data });
  } catch (err) {
    console.error("[/api/cotiza/eliminar-solicitud]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
