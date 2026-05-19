import React, { useState } from "react";
import { K } from "./Layout.jsx";
import { useAuth, clearStoredSession } from "../extractos/lib/auth.jsx";

export default function LoginAdmin({ titulo, descripcion }) {
  const { signIn, authError, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [validando, setValidando] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    const em = email.trim();
    const pw = password;
    if (!em || !pw || validando) return;

    setError("");
    setValidando(true);
    try {
      const res = await signIn(em, pw);
      if (!res.ok) {
        setError(res.error || "No pudimos iniciar sesión.");
      }
      // Si ok, AuthProvider valida fila en admin_users y Admin.jsx re-renderiza.
    } finally {
      setValidando(false);
    }
  };

  const disabled = validando || authLoading || !email.trim() || !password;

  return (
    <section style={{ padding: "clamp(64px, 10vw, 120px) 24px" }}>
      <form onSubmit={submit} style={{
        maxWidth: 420, margin: "0 auto",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12, padding: 28,
      }}>
        <h1 style={K({ fontSize: 22, fontWeight: 700, marginBottom: 8 })}>{titulo}</h1>
        <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 20, lineHeight: 1.5 })}>
          {descripcion}
        </p>

        <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14 })}>
          Email
          <input
            type="email"
            inputMode="email"
            autoComplete="username"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            autoFocus
            disabled={validando}
            placeholder="gerencia@araucanayfrontera.cl"
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "#e87171" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 6, padding: "12px 14px", color: "#fff",
              fontFamily: "'Open Sans', sans-serif", fontSize: 14, outline: "none",
            }} />
        </label>

        <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 })}>
          Contraseña
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(""); }}
            disabled={validando}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "#e87171" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 6, padding: "12px 14px", color: "#fff",
              fontFamily: "'Open Sans', sans-serif", fontSize: 14, outline: "none",
            }} />
        </label>

        {(error || authError) && (
          <p style={K({ fontSize: 12, color: "#e87171", marginBottom: 16, lineHeight: 1.5 })}>
            {error || authError}
          </p>
        )}

        <button type="submit" className="cot-btn-primary" disabled={disabled}
          style={K({
            width: "100%",
            background: validando ? "rgba(82,184,112,0.4)" : "#52b870",
            color: "#0a3d23",
            border: "none", borderRadius: 6, padding: "12px 22px",
            fontWeight: 700, fontSize: 14,
            cursor: validando ? "wait" : (disabled ? "not-allowed" : "pointer"),
            opacity: disabled ? 0.6 : 1,
            letterSpacing: "0.02em",
          })}>
          {validando ? "Validando..." : "Entrar"}
        </button>

        <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 16, lineHeight: 1.5, textAlign: "center" })}>
          Misma cuenta que para el panel de extractos.
        </p>

        <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 12, lineHeight: 1.5, textAlign: "center" })}>
          ¿Se queda colgado o no entra?{" "}
          <button
            type="button"
            onClick={() => { clearStoredSession(); window.location.reload(); }}
            style={{
              background: "none", border: "none", padding: 0,
              color: "#7bd8a0", cursor: "pointer", fontSize: 11,
              textDecoration: "underline", fontFamily: "inherit",
            }}
          >
            limpiar sesión y reintentar
          </button>
        </p>
      </form>
    </section>
  );
}
