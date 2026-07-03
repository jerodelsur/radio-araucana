// Cliente Supabase server-side para los endpoints de extractos.
// Usa la secret key (bypass RLS) para crear órdenes desde la página pública
// sin exigir login del cliente.
//
// Compatibilidad de nombres de keys:
// - Nuevo formato (2025+): SUPABASE_SECRET_KEY (sb_secret_...)
// - Legacy: SUPABASE_SERVICE_ROLE_KEY (eyJ... JWT)
// Ambos son compatibles con el cliente; aceptamos cualquiera.

import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

function getSecretKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
}

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && getSecretKey());
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado. Faltan SUPABASE_URL o SUPABASE_SECRET_KEY.");
  }
  if (cachedClient) return cachedClient;
  cachedClient = createClient(process.env.SUPABASE_URL, getSecretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: { "x-application": "extractos-api" },
      // Timeout duro por request: un proyecto pausado o reactivándose puede
      // dejar el socket colgado y quemar la invocación completa de la lambda
      // (hasta el maxDuration de Vercel) sin este corte.
      fetch: (url, options = {}) =>
        fetch(url, {
          ...options,
          signal: AbortSignal.timeout(Number(process.env.SUPABASE_FETCH_TIMEOUT_MS) || 6000),
        }),
    },
  });
  return cachedClient;
}

// ¿El error corresponde a un fallo de red/servicio (proyecto pausado, DNS
// muerto, timeout) y no a un error de datos o credenciales? Sirve para que
// los endpoints respondan 503 "servicio caído" en vez de 401/500 engañosos.
export function isSupabaseUnreachable(error) {
  if (error?.status === 0) return true;
  const msg = String(error?.message || error || "").toLowerCase();
  return /fetch failed|failed to fetch|enotfound|econnrefused|econnreset|etimedout|abort|timeout|network/.test(msg);
}
