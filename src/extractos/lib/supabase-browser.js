// Cliente Supabase para el navegador (admin panel).
// Usa la publishable key — RLS aplica. Solo usuarios listados en
// public.admin_users pueden leer/modificar orders, signers, etc.

import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Singleton a nivel de WINDOW (no solo módulo): HMR puede reejecutar el módulo
// y dejar varios clients vivos en paralelo, lo que produce "Multiple GoTrueClient
// instances detected" + signIn que se cuelga porque varios clients se pelean
// por la misma sesión en localStorage.
const WINDOW_KEY = "__extractos_admin_supabase_client__";

export function isSupabaseBrowserConfigured() {
  return Boolean(url && key);
}

export function getSupabaseBrowser() {
  if (!isSupabaseBrowserConfigured()) {
    throw new Error("Supabase browser no configurado. Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  if (typeof window !== "undefined" && window[WINDOW_KEY]) {
    return window[WINDOW_KEY];
  }
  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      // autoRefreshToken=false: si el token expira, pedimos login de nuevo en lugar
      // de intentar refresh automático. El refresh puede quedarse colgado en redes
      // lentas o con sesiones corruptas, bloqueando todas las queries.
      // Para un admin panel donde la sesión típica dura minutos, no compensa.
      autoRefreshToken: false,
      storageKey: "extractos-admin-session",
      // Deshabilitamos navigator.locks: si hay múltiples pestañas, se pelean por
      // el lock y los signIn/updateUser quedan colgados con NavigatorLockAcquireTimeoutError.
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  });
  if (typeof window !== "undefined") {
    window[WINDOW_KEY] = client;
  }
  return client;
}
