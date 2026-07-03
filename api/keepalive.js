// GET /api/keepalive
//
// Ping mínimo a Supabase para que el proyecto free-tier registre actividad y
// no se pause por inactividad (Supabase pausa proyectos gratuitos tras ~7 días
// sin requests a su API; una consulta REST cuenta como actividad).
//
// Lo invocan dos schedulers independientes (si uno falla, el otro cubre):
//   1. Vercel Cron (vercel.json → "crons"), diario.
//   2. GitHub Actions (.github/workflows/supabase-keepalive.yml), 2x/semana.
//
// Si la env CRON_SECRET existe, exige `Authorization: Bearer <CRON_SECRET>`
// (Vercel lo agrega automáticamente a sus crons cuando esa env está definida).
// Sin CRON_SECRET el endpoint queda abierto pero rate-limiteado: el ping es
// inofensivo y barato (una consulta head/count a una tabla de ~2 filas).

import { rateLimit, tooManyRequests, safeEqual } from "./_lib/security.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./extractos/_lib/supabase.js";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!rateLimit(req, { key: "keepalive", limit: 10 })) return tooManyRequests(res);

  const secret = process.env.CRON_SECRET || "";
  if (secret) {
    const header = String(req.headers.authorization || "");
    const token = header.replace(/^Bearer\s+/i, "").trim();
    if (!safeEqual(token, secret)) return res.status(401).json({ error: "unauthorized" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(200).json({ ok: false, skipped: "supabase_not_configured" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { error, count } = await supabase
      .from("admin_users")
      .select("id", { head: true, count: "exact" })
      .limit(1);
    if (error) {
      // 502 y no 500: el fallo queda visible en el dashboard de crons de
      // Vercel y en el log del workflow de GitHub (curl --fail).
      console.error("[/api/keepalive] ping a Supabase falló:", error.message);
      return res.status(502).json({ ok: false, error: error.message });
    }
    return res.status(200).json({ ok: true, adminUsers: count ?? null, at: new Date().toISOString() });
  } catch (err) {
    console.error("[/api/keepalive] excepción:", err?.message ?? err);
    return res.status(502).json({ ok: false, error: String(err?.message ?? err) });
  }
}
