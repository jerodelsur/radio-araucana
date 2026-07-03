// Verifica que el caller esté autenticado contra Supabase Auth y tenga fila
// en public.admin_users. Misma base que el panel de extractos: una sola cuenta
// habilita ambos paneles.
//
// El cliente manda `Authorization: Bearer <access_token>` donde access_token
// es el JWT de Supabase. Acá lo intercambiamos por el user y chequeamos rol.

import { getSupabaseAdmin, isSupabaseConfigured, isSupabaseUnreachable } from "../../extractos/_lib/supabase.js";

/**
 * Resultado del chequeo de auth:
 * - "ok": token válido y con fila en admin_users.
 * - "invalid": token malo, expirado o sin permisos.
 * - "unreachable": Supabase no responde (proyecto pausado, red caída). Los
 *   handlers deben responder 503 en este caso — un 401 manda a la operadora
 *   a "revisar su contraseña" cuando el problema es el servicio.
 */
export async function checkAuth(req) {
  if (!isSupabaseConfigured()) return "unreachable";
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, ...rest] = String(header).split(" ");
  const token = rest.join(" ").trim();
  if (scheme !== "Bearer" || !token) return "invalid";

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) return isSupabaseUnreachable(error) ? "unreachable" : "invalid";
    if (!user) return "invalid";

    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (adminErr) return isSupabaseUnreachable(adminErr) ? "unreachable" : "invalid";
    return adminRow ? "ok" : "invalid";
  } catch (err) {
    console.warn("[cotiza/auth] error verificando token:", err?.message);
    return isSupabaseUnreachable(err) ? "unreachable" : "invalid";
  }
}

// Respuesta estándar cuando checkAuth no devolvió "ok".
export function denyAuth(res, reason) {
  if (reason === "unreachable") {
    return res.status(503).json({
      error: "auth_unavailable",
      message: "La base de datos no está disponible en este momento (no es un problema de tu clave). Espera unos minutos y reintenta.",
    });
  }
  return res.status(401).json({ error: "Unauthorized" });
}
