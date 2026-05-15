import React, { useState } from "react";
import { K } from "./Layout.jsx";

function esEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
}

export default function Identificacion({ valorInicial, onContinuar }) {
  const [c, setC] = useState(valorInicial || { nombre: "", empresa: "", telefono: "", email: "" });
  const [touched, setTouched] = useState(false);

  const nombreOk = c.nombre.trim().length >= 2;
  const contactoOk = c.telefono.trim() || esEmail(c.email);
  const emailFormatoOk = !c.email.trim() || esEmail(c.email);
  const valido = nombreOk && contactoOk && emailFormatoOk;

  const submit = (e) => {
    e.preventDefault();
    setTouched(true);
    if (!valido) return;
    onContinuar({
      nombre: c.nombre.trim(),
      empresa: c.empresa.trim(),
      telefono: c.telefono.trim(),
      email: c.email.trim(),
    });
  };

  return (
    <section style={{ padding: "clamp(48px, 8vw, 96px) 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        <p style={K({
          fontSize: 12, fontWeight: 600, color: "#52b870",
          textTransform: "uppercase", letterSpacing: "0.18em",
          marginBottom: 16, textAlign: "center",
        })}>
          Publicidad · Radio Araucana 95.9 FM
        </p>
        <h1 style={K({
          fontSize: "clamp(28px, 4.5vw, 40px)", fontWeight: 700,
          lineHeight: 1.15, marginBottom: 16,
          letterSpacing: "-0.01em", textAlign: "center",
        })}>
          Antes de cotizar, cuéntanos quién eres
        </h1>
        <p style={K({
          fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.65)",
          lineHeight: 1.6, marginBottom: 36, textAlign: "center",
        })}>
          Así podemos contactarte con la propuesta formal y resolver cualquier duda sobre tu campaña.
        </p>

        <form onSubmit={submit} style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 12, padding: 24,
          display: "flex", flexDirection: "column", gap: 14,
        }}>
          <Campo
            label="Nombre"
            required
            value={c.nombre}
            onChange={(v) => setC((s) => ({ ...s, nombre: v }))}
            placeholder="Tu nombre y apellido"
            error={touched && !nombreOk ? "Ingresa tu nombre" : null}
          />
          <Campo
            label="Empresa, agrupación o partido"
            value={c.empresa}
            onChange={(v) => setC((s) => ({ ...s, empresa: v }))}
            placeholder="Opcional"
          />
          <Campo
            label="Teléfono / WhatsApp"
            type="tel"
            value={c.telefono}
            onChange={(v) => setC((s) => ({ ...s, telefono: v }))}
            placeholder="+56 9 ..."
          />
          <Campo
            label="Email"
            type="email"
            value={c.email}
            onChange={(v) => setC((s) => ({ ...s, email: v }))}
            placeholder="tu@correo.cl"
            error={touched && c.email && !emailFormatoOk ? "Email no válido" : null}
          />
          {touched && !contactoOk && (
            <p style={K({ fontSize: 12, color: "#e87171", marginTop: -4 })}>
              Necesitamos al menos un teléfono o un email para contactarte.
            </p>
          )}

          <button
            type="submit"
            disabled={!valido && touched}
            className="cot-btn-primary"
            style={K({
              background: valido ? "#52b870" : "rgba(82,184,112,0.4)",
              color: "#0a3d23", border: "none",
              borderRadius: 6, padding: "14px 22px",
              fontWeight: 700, fontSize: 14,
              cursor: valido ? "pointer" : "not-allowed",
              letterSpacing: "0.02em", marginTop: 8,
              transition: "background 150ms ease",
            })}
          >
            Continuar al cotizador →
          </button>

          <p style={K({
            fontSize: 11, color: "rgba(255,255,255,0.4)",
            lineHeight: 1.5, textAlign: "center", marginTop: 4,
          })}>
            Usamos tus datos solo para responder esta cotización. No los compartimos con terceros.
          </p>
        </form>
      </div>
    </section>
  );
}

function Campo({ label, required, value, onChange, placeholder, type = "text", error }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.6)" })}>
      {label}{required ? <span style={{ color: "#52b870" }}> *</span> : null}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "#e87171" : "rgba(255,255,255,0.12)"}`,
          borderRadius: 6, padding: "12px 14px",
          color: "#fff", fontFamily: "'Open Sans', sans-serif",
          fontSize: 14, fontWeight: 400, outline: "none",
        }}
      />
      {error && <span style={K({ fontSize: 11, color: "#e87171" })}>{error}</span>}
    </label>
  );
}
