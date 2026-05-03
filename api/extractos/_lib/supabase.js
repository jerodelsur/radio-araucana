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
    global: { headers: { "x-application": "extractos-api" } },
  });
  return cachedClient;
}
