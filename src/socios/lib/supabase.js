import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const WINDOW_KEY = "__socios_supabase_client__";

export function isConfigured() {
  return Boolean(url && key);
}

export function getSupabase() {
  if (!isConfigured()) {
    throw new Error("Supabase no configurado. Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  if (typeof window !== "undefined" && window[WINDOW_KEY]) {
    return window[WINDOW_KEY];
  }
  const client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: false,
      storageKey: "socios-session",
      lock: async (_name, _acquireTimeout, fn) => fn(),
    },
  });
  if (typeof window !== "undefined") {
    window[WINDOW_KEY] = client;
  }
  return client;
}
