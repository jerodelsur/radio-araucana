import React, { useState } from "react";
import { K } from "./Layout.jsx";

export default function LoginAdmin({ titulo, descripcion, onLogin }) {
  const [pass, setPass] = useState("");

  const submit = (e) => {
    e?.preventDefault?.();
    const v = pass.trim();
    if (!v) return;
    onLogin(v);
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
          <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoFocus
            style={{
              width: "100%", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
              padding: "12px 14px", color: "#fff",
              fontFamily: "'Open Sans', sans-serif", fontSize: 14, outline: "none",
            }} />
        </label>
        <button type="submit" className="cot-btn-primary"
          style={K({
            width: "100%", background: "#52b870", color: "#0a3d23",
            border: "none", borderRadius: 6, padding: "12px 22px",
            fontWeight: 700, fontSize: 14, cursor: "pointer", letterSpacing: "0.02em",
          })}>
          Entrar
        </button>
      </form>
    </section>
  );
}
