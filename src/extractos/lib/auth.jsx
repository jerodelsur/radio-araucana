// Sesión admin con Supabase Auth.
// - AuthProvider escucha onAuthStateChange.
// - useAuth() devuelve { user, adminProfile, loading, signIn, signOut }.
// - adminProfile es la fila de public.admin_users (rol: admin | operator).
// - Si el user existe en auth pero NO en admin_users, no se considera admin
//   (signOut automático al detectarlo).

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowser, isSupabaseBrowserConfigured } from "./supabase-browser.js";

const AuthCtx = createContext(null);

// Storage key DEBE coincidir con el de supabase-browser.js
const STORAGE_KEY = "extractos-admin-session";

// Lee la sesión de localStorage y valida que el access_token no esté expirado.
// Si está corrupta o expirada, la borra y devuelve null. Sin esto, getSession()
// puede quedarse colgado intentando "validar" un token zombie y la UI queda en
// "Verificando sesión..." indefinidamente.
function readValidStoredSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const expiresAt = Number(parsed?.expires_at || parsed?.currentSession?.expires_at || 0);
    const nowSec = Math.floor(Date.now() / 1000);
    // Margen de 30s — si está al borde de expirar tampoco vale la pena intentar.
    if (!expiresAt || expiresAt < nowSec + 30) {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
      return null;
    }
    return parsed;
  } catch {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
    return null;
  }
}

function hasStoredSession() {
  return Boolean(readValidStoredSession());
}

// Borra cualquier sesión guardada. Botón de pánico para cuando el browser
// quedó con estado raro y Bertha/Jerónimo tienen que entrar de cero.
export function clearStoredSession() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  // Si no hay sesión guardada, no necesitamos "verificar" nada — loading=false
  // de entrada y RequireAdmin redirige instantáneamente a /admin/login.
  // Esto elimina el flash de "Verificando sesión..." en visitas no-autenticadas.
  const [loading, setLoading] = useState(() => hasStoredSession());
  const [authError, setAuthError] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!isSupabaseBrowserConfigured()) {
      setLoading(false);
      setAuthError("Supabase no configurado en este entorno.");
      return;
    }
    const supabase = getSupabaseBrowser();
    let alive = true;
    let bootstrapDone = false;

    // Timeout duro: si algo se cuelga >3s, desbloqueamos la UI mostrando login.
    // El bootstrap normal toma <500ms; 3s ya es señal clara de que algo (extensión,
    // red, supabase-js) está bloqueando. Mejor mostrar login y dejar al user
    // hacer login fresh que dejarlo viendo "Verificando sesión..." 8 segundos.
    const safetyTimer = setTimeout(() => {
      if (!alive || bootstrapDone) return;
      console.warn("[auth] safety timeout — desbloqueando loading state");
      setLoading(false);
    }, 3000);

    async function loadProfile(currentUser) {
      if (!currentUser) {
        setAdminProfile(null);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("admin_users")
          .select("id, full_name, phone, role")
          .eq("id", currentUser.id)
          .maybeSingle();
        if (!alive) return;
        if (error) {
          console.warn("[auth] error leyendo admin_users:", error.message);
          setAdminProfile(null);
          setAuthError(`No pudimos verificar tus permisos: ${error.message}`);
          return;
        }
        if (!data) {
          console.warn("[auth] user sin fila en admin_users");
          setAdminProfile(null);
          setAuthError("Tu cuenta no tiene permisos de administración.");
          return;
        }
        setAdminProfile(data);
        setAuthError(null);
      } catch (err) {
        console.error("[auth] excepción en loadProfile:", err);
        setAdminProfile(null);
        setAuthError(err?.message || "Error al cargar tu perfil de admin.");
      }
    }

    // Bootstrap inicial.
    // - Si no hay sesión válida en localStorage, no llamamos a getSession() para
    //   nada — login se muestra al instante.
    // - Si hay sesión, race con timeout de 2s: si supabase-js o una extensión
    //   bloquean el call, caemos al login en lugar de quedar colgados.
    (async () => {
      try {
        if (!readValidStoredSession()) {
          // Sin sesión guardada (o expirada) → no hace falta validar nada.
          return;
        }
        const sessionPromise = supabase.auth.getSession().then((r) => r.data.session);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("getSession timeout")), 2000)
        );
        const session = await Promise.race([sessionPromise, timeoutPromise]);
        if (!alive) return;
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
        await loadProfile(session?.user ?? null);
      } catch (err) {
        // En timeout o error, asumimos sesión inválida y mostramos login.
        // No bloqueamos al user con un error rojo: si las credenciales son válidas
        // y vuelve a entrar fresh, todo funciona.
        console.warn("[auth] bootstrap fallback (mostrando login):", err?.message);
        clearStoredSession();
      } finally {
        bootstrapDone = true;
        if (alive) setLoading(false);
      }
    })();

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      setAccessToken(session?.access_token ?? null);
      await loadProfile(session?.user ?? null);
    });
    subscriptionRef.current = data?.subscription;

    return () => {
      alive = false;
      clearTimeout(safetyTimer);
      subscriptionRef.current?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    accessToken,
    adminProfile,
    loading,
    authError,
    isAdmin: Boolean(user && adminProfile),
    async signIn(email, password) {
      const supabase = getSupabaseBrowser();
      setAuthError(null);
      // Limpiamos cualquier sesión vieja en localStorage de forma síncrona —
      // supabase.auth.signOut() es async y puede colgarse intentando contactar
      // al servidor con un token zombie. Nukear directo elimina la causa raíz
      // ("ya tengo sesión, refrescala primero" antes de procesar el nuevo login).
      clearStoredSession();
      try {
        const signInPromise = supabase.auth.signInWithPassword({ email, password });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), 15000)
        );
        const { data, error } = await Promise.race([signInPromise, timeoutPromise]);
        if (error) {
          setAuthError(translateAuthError(error));
          return { ok: false, error: translateAuthError(error) };
        }
        return { ok: true, user: data.user };
      } catch (err) {
        const isTimeout = err?.message === "timeout";
        const msg = isTimeout
          ? "El login tardó más de 15 segundos. Esto suele pasar con extensiones del navegador interfiriendo. Prueba en una ventana incógnita (Cmd+Shift+N) o desactiva temporalmente las extensiones."
          : err?.message || "Error al iniciar sesión.";
        setAuthError(msg);
        return { ok: false, error: msg };
      }
    },
    async signOut() {
      const supabase = getSupabaseBrowser();
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      setAdminProfile(null);
    },
    async requestPasswordReset(email) {
      const supabase = getSupabaseBrowser();
      const redirectTo = `${window.location.origin}/frontera/extractos/admin/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return { ok: false, error: translateAuthError(error) };
      return { ok: true };
    },
    async updatePassword(newPassword) {
      const supabase = getSupabaseBrowser();
      console.log("[auth] updatePassword: iniciando...");
      const sessionRes = await supabase.auth.getSession();
      console.log("[auth] updatePassword: session?", Boolean(sessionRes.data.session), sessionRes.data.session?.user?.email);
      try {
        const updatePromise = supabase.auth.updateUser({ password: newPassword });
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Timeout: la solicitud tardó más de 15 segundos. Intenta de nuevo o pide un nuevo link de reset.")), 15000)
        );
        const { error } = await Promise.race([updatePromise, timeoutPromise]);
        console.log("[auth] updatePassword: completado, error?", error);
        if (error) return { ok: false, error: translateAuthError(error) };
        return { ok: true };
      } catch (err) {
        console.error("[auth] updatePassword: excepción:", err);
        return { ok: false, error: err?.message || "Error desconocido al actualizar contraseña." };
      }
    },
  }), [user, accessToken, adminProfile, loading, authError]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function translateAuthError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (msg.includes("email not confirmed")) return "Tu email aún no está confirmado.";
  if (msg.includes("rate limit")) return "Demasiados intentos. Espera unos minutos.";
  return error?.message || "No pudimos iniciar sesión.";
}
