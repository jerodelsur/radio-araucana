import React from "react";
import { K } from "./Layout.jsx";

export default function Confirmacion({ cliente, onNueva }) {
  const tieneEmail = Boolean(cliente?.email);

  return (
    <section style={{ padding: "clamp(64px, 10vw, 120px) 24px" }}>
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%",
          background: "rgba(82,184,112,0.15)",
          border: "2px solid #52b870",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 28px", fontSize: 36,
        }} aria-hidden>
          ✓
        </div>

        <p style={K({
          fontSize: 12, fontWeight: 600, color: "#52b870",
          textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12,
        })}>Solicitud recibida</p>

        <h1 style={K({
          fontSize: "clamp(28px, 4.5vw, 38px)", fontWeight: 700,
          lineHeight: 1.15, marginBottom: 16, letterSpacing: "-0.01em",
        })}>
          Gracias, {cliente.nombre.split(" ")[0]}
        </h1>

        <p style={K({ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, marginBottom: 20 })}>
          Recibimos tu solicitud y la pasamos al equipo comercial. Te contactaremos en horario hábil con la
          propuesta formal — adaptada a tu campaña — para coordinar fechas y programación.
        </p>

        {tieneEmail && (
          <p style={K({ fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 28 })}>
            Te enviamos un correo a <strong style={{ color: "#fff" }}>{cliente.email}</strong> con un resumen de tu pedido y algunos ejemplos de packs para que te orientes.
          </p>
        )}

        <div style={{
          background: "rgba(82,184,112,0.06)",
          borderLeft: "3px solid #52b870",
          borderRadius: "0 8px 8px 0",
          padding: "16px 18px",
          textAlign: "left", marginBottom: 28,
        }}>
          <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 })}>
            Aplican <strong style={{ color: "#fff" }}>descuentos</strong> según volumen, continuidad y forma de pago.
            Además, los contratos de 6 o 12 meses acceden a <strong style={{ color: "#fff" }}>bonificaciones por permanencia</strong>.
            Conversemos para armar el convenio que mejor se adapte a tu campaña.
          </p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: 20,
          textAlign: "left", marginBottom: 28,
        }}>
          <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 })}>
            Si necesitas algo urgente, escríbenos directo:
          </p>
          <p style={K({ fontSize: 14, color: "#fff", lineHeight: 1.8 })}>
            <a href="https://wa.me/56992872087" target="_blank" rel="noreferrer"
              style={{ color: "#52b870", textDecoration: "none" }}>+56 9 9287 2087 (WhatsApp)</a><br />
            <a href="mailto:cotizaciones@araucanayfrontera.cl"
              style={{ color: "#52b870", textDecoration: "none" }}>cotizaciones@araucanayfrontera.cl</a>
          </p>
        </div>

        <button type="button" onClick={onNueva} className="cot-btn-secondary"
          style={K({
            background: "transparent", color: "#fff",
            border: "1px solid rgba(255,255,255,0.3)", borderRadius: 6,
            padding: "12px 22px", fontWeight: 600, fontSize: 13,
            cursor: "pointer", marginRight: 8,
          })}>
          Nueva cotización
        </button>
        <a href="/"
          style={K({
            display: "inline-block",
            background: "transparent", color: "rgba(255,255,255,0.6)",
            border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6,
            padding: "12px 22px", fontWeight: 600, fontSize: 13,
            textDecoration: "none",
          })}>
          Volver al sitio
        </a>
      </div>
    </section>
  );
}
