import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getSupabase, isConfigured } from "./supabase.js";

const AuthCtx = createContext(null);
const STORAGE_KEY = "socios-session";

function readValidSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage?.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const expiresAt = Number(parsed?.expires_at || parsed?.currentSession?.expires_at || 0);
    const nowSec = Math.floor(Date.now() / 1000);
    if (!expiresAt || expiresAt < nowSec + 30) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
    return null;
  }
}

export function clearSession() {
  if (typeof window === "undefined") return;
  try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* no-op */ }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(readValidSession()));
  const [error, setError] = useState(null);
  const subRef = useRef(null);

  useEffect(() => {
    if (!isConfigured()) {
      setLoading(false);
      setError("Supabase no configurado.");
      return;
    }
    const sb = getSupabase();
    let alive = true;
    let done = false;

    const timer = setTimeout(() => {
      if (!alive || done) return;
      setLoading(false);
    }, 3000);

    async function loadPerfil(u) {
      if (!u) { setPerfil(null); return; }
      const { data, error: err } = await sb
        .from("socios_usuarios")
        .select("id, nombre, rol")
        .eq("id", u.id)
        .maybeSingle();
      if (!alive) return;
      if (err || !data) {
        setPerfil(null);
        setError("Tu cuenta no tiene acceso al panel de socios.");
        await sb.auth.signOut();
        return;
      }
      setPerfil(data);
      setError(null);
    }

    (async () => {
      try {
        if (!readValidSession()) return;
        const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000));
        const session = await Promise.race([
          sb.auth.getSession().then(r => r.data.session),
          timeoutP,
        ]);
        if (!alive) return;
        setUser(session?.user ?? null);
        await loadPerfil(session?.user ?? null);
      } catch {
        clearSession();
      } finally {
        done = true;
        if (alive) setLoading(false);
      }
    })();

    const { data } = sb.auth.onAuthStateChange(async (_ev, session) => {
      if (!alive) return;
      setUser(session?.user ?? null);
      await loadPerfil(session?.user ?? null);
    });
    subRef.current = data?.subscription;

    return () => {
      alive = false;
      clearTimeout(timer);
      subRef.current?.unsubscribe?.();
    };
  }, []);

  const value = useMemo(() => ({
    user,
    perfil,
    loading,
    error,
    isAdmin: Boolean(user && perfil?.rol === "admin"),
    isSocio: Boolean(user && perfil),
    async signIn(email, password) {
      const sb = getSupabase();
      setError(null);
      clearSession();
      try {
        const timeoutP = new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000));
        const { data, error: err } = await Promise.race([
          sb.auth.signInWithPassword({ email, password }),
          timeoutP,
        ]);
        if (err) {
          const msg = translateError(err);
          setError(msg);
          return { ok: false, error: msg };
        }
        return { ok: true, user: data.user };
      } catch (e) {
        const msg = e?.message === "timeout"
          ? "El login tardó demasiado. Prueba en una ventana incógnita (Cmd+Shift+N) o espera 5 minutos e intenta de nuevo."
          : e?.message || "Error al iniciar sesión.";
        setError(msg);
        return { ok: false, error: msg };
      }
    },
    async signOut() {
      const sb = getSupabase();
      await sb.auth.signOut();
      setUser(null);
      setPerfil(null);
    },
  }), [user, perfil, loading, error]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}

function translateError(err) {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("invalid login")) return "Email o contraseña incorrectos.";
  if (msg.includes("email not confirmed")) return "Tu email no está confirmado.";
  if (msg.includes("rate limit")) return "Demasiados intentos. Espera unos minutos.";
  return err?.message || "Error al iniciar sesión.";
}
