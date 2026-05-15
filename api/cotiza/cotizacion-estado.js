// POST con auth: cambia el estado de una cotización formal.
// Body: { id, estado: "aceptada" | "rechazada" | "enviada" | "vencida",
//         cambioPor?, notasInternas? }

import { getSupabaseAdmin, isSupabaseConfigured } from "../extractos/_lib/supabase.js";
import { authOk } from "./_lib/auth.js";

export const config = { runtime: "nodejs" };

function clean(s, max = 400) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

const ESTADOS = ["enviada", "aceptada", "rechazada", "vencida"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!authOk(req)) return res.status(401).json({ error: "Unauthorized" });

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "supabase_not_configured" });
  }

  const { id, estado, cambioPor, notasInternas } = req.body || {};
  if (!id || typeof id !== "string") return res.status(400).json({ error: "id requerido" });
  if (!ESTADOS.includes(estado)) {
    return res.status(400).json({ error: "estado inválido", validos: ESTADOS });
  }

  const update = {
    estado,
    cambio_estado_en: new Date().toISOString(),
    cambio_estado_por: clean(cambioPor, 200) || null,
  };
  const notas = clean(notasInternas, 2000);
  if (notas) update.notas_internas = notas;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("cotiza_cotizaciones")
      .update(update)
      .eq("id", id)
      .select("id, numero, estado, cambio_estado_en")
      .single();
    if (error) {
      console.error("[/api/cotiza/cotizacion-estado] update fail:", error.message);
      return res.status(500).json({ error: "db_error", detail: error.message });
    }
    return res.status(200).json({ ok: true, cotizacion: data });
  } catch (err) {
    console.error("[/api/cotiza/cotizacion-estado]", err?.message ?? err);
    return res.status(500).json({ error: "internal_error" });
  }
}
