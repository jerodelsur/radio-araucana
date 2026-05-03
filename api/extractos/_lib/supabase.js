// Cliente Supabase server-side para los endpoints de extractos.
// Usa la SERVICE_ROLE_KEY (bypass RLS) para crear órdenes desde la página
// pública sin exigir login del cliente.

import { createClient } from "@supabase/supabase-js";

let cachedClient = null;

export function isSupabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase no está configurado. Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (cachedClient) return cachedClient;
  cachedClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { "x-application": "extractos-api" } },
    },
  );
  return cachedClient;
}
