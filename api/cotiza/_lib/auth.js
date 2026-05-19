// Verifica que el caller esté autenticado contra Supabase Auth y tenga fila
// en public.admin_users. Misma base que el panel de extractos: una sola cuenta
// habilita ambos paneles.
//
// El cliente manda `Authorization: Bearer <access_token>` donde access_token
// es el JWT de Supabase. Acá lo intercambiamos por el user y chequeamos rol.

import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";

export async function authOk(req) {
  if (!isSupabaseConfigured()) return false;
  const header = req.headers.authorization || req.headers.Authorization || "";
  const [scheme, ...rest] = String(header).split(" ");
  const token = rest.join(" ").trim();
  if (scheme !== "Bearer" || !token) return false;

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return false;

    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();
    if (adminErr || !adminRow) return false;
    return true;
  } catch (err) {
    console.warn("[cotiza/auth] error verificando token:", err?.message);
    return false;
  }
}
