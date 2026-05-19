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

function hasStoredSession() {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage?.getItem(STORAGE_KEY));
  } catch {
    return false;
  }
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

    // Timeout duro: si algo se cuelga >8s, desbloqueamos la UI mostrando login.
    // Solo dispara si el bootstrap NO terminó — no es ruido si todo va bien.
    const safetyTimer = setTimeout(() => {
      if (!alive || bootstrapDone) return;
      console.warn("[auth] safety timeout — desbloqueando loading state");
      setLoading(false);
    }, 8000);

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

    // Bootstrap inicial — try/finally garantiza que loading=false siempre se llame
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!alive) return;
        setUser(session?.user ?? null);
        setAccessToken(session?.access_token ?? null);
        await loadProfile(session?.user ?? null);
      } catch (err) {
        console.error("[auth] bootstrap error:", err);
        if (alive) setAuthError(err?.message || "Error al inicializar sesión.");
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
      // Limpiamos cualquier sesión vieja en localStorage. Sesiones corruptas o
      // con token expirado pueden hacer que signInWithPassword se cuelgue intentando
      // refresh interno antes de procesar el nuevo login.
      try {
        await Promise.race([
          supabase.auth.signOut({ scope: "local" }),
          new Promise((res) => setTimeout(res, 1500)),
        ]);
      } catch { /* no-op */ }
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
