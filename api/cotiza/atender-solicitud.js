// POST con auth: marca una solicitud como atendida (o descartada).
// Body: { id, estado: "atendida" | "descartada", cotizacionTotal?, notasInternas?, atendidaPor? }

import { getSupabaseAdmin, isSupabaseConfigured } from "../extractos/_lib/supabase.js";
import { authOk } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

function clean(s, max = 400) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!authOk(req)) return res.status(401).json({ error: "Unauthorized" });

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured" });
  }

  const { id, estado, cotizacionTotal, notasInternas, atendidaPor } = req.body || {};

  if (!id || typeof id !== "string") return res.status(400).json({ error: "id requerido" });
  if (!["atendida", "descartada", "pendiente"].includes(estado)) {
    return res.status(400).json({ error: "estado inválido" });
  }

  const update = {
    estado,
    notas_internas: clean(notasInternas, 2000) || null,
    atendida_por: clean(atendidaPor, 120) || null,
  };
  if (estado === "pendiente") {
    update.atendida_en = null;
    update.cotizacion_total = null;
  } else {
    update.atendida_en = new Date().toISOString();
    if (typeof cotizacionTotal === "number" && cotizacionTotal > 0) {
      update.cotizacion_total = Math.round(cotizacionTotal);
    }
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cotiza_solicitudes")
      .update(update)
      .eq("id", id)
      .select("id, estado")
      .single();
    if (error) {
      console.error("[/api/cotiza/atender-solicitud] update fail:", error.message);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }
    return res.status(200).json({ ok: true, solicitud: data });
  } catch (err) {
    console.error("[/api/cotiza/atender-solicitud]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
