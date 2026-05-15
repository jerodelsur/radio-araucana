import React, { useState } from "react";
import { K } from "./Layout.jsx";

export default function LoginAdmin({ titulo, descripcion, onLogin }) {
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [validando, setValidando] = useState(false);

  const submit = async (e) => {
    e?.preventDefault?.();
    const v = pass.trim();
    if (!v || validando) return;

    setError("");
    setValidando(true);
    try {
      const r = await fetch("/api/cotiza/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: v }),
      });
      if (r.ok) {
        onLogin(v);
        return;
      }
      if (r.status === 401) {
        setError("Clave incorrecta.");
      } else if (r.status === 503) {
        setError("El sistema no está configurado en el servidor. Avisá a soporte.");
      } else {
        const data = await r.json().catch(() => ({}));
        setError(data.message || data.error || `Error ${r.status}`);
      }
    } catch (err) {
      setError("No pudimos contactar al servidor. Revisá tu conexión.");
    } finally {
      setValidando(false);
    }
  };

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
        <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 16 })}>
          Contraseña
          <input
            type="password"
            value={pass}
            onChange={(e) => { setPass(e.target.value); setError(""); }}
            autoFocus
            disabled={validando}
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: `1px solid ${error ? "#e87171" : "rgba(255,255,255,0.12)"}`,
              borderRadius: 6, padding: "12px 14px", color: "#fff",
              fontFamily: "'Open Sans', sans-serif", fontSize: 14, outline: "none",
            }} />
        </label>
        {error && (
          <p style={K({ fontSize: 12, color: "#e87171", marginBottom: 16, lineHeight: 1.5 })}>
            {error}
          </p>
        )}
        <button type="submit" className="cot-btn-primary" disabled={validando || !pass.trim()}
          style={K({
            width: "100%",
            background: validando ? "rgba(82,184,112,0.4)" : "#52b870",
            color: "#0a3d23",
            border: "none", borderRadius: 6, padding: "12px 22px",
            fontWeight: 700, fontSize: 14,
            cursor: validando ? "wait" : (pass.trim() ? "pointer" : "not-allowed"),
            opacity: pass.trim() ? 1 : 0.6,
            letterSpacing: "0.02em",
          })}>
          {validando ? "Validando..." : "Entrar"}
        </button>
      </form>
    </section>
  );
}
