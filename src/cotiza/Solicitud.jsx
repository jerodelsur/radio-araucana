import React, { useState } from "react";
import { K } from "./Layout.jsx";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 20,
};

const WHATSAPP_URL =
  "https://wa.me/56992872087?text=" +
  encodeURIComponent("Hola Radio Araucana, quiero cotizar publicidad y necesito una respuesta urgente.");

/**
 * Flujo público: el cliente indica qué formatos le interesan y la cantidad
 * aproximada, sin que vea precios. La cotización formal la arma el equipo
 * comercial desde /cotiza/interno y la envía manualmente.
 */
export default function Solicitud({ tarifas, cliente, onVolver, onEnviar, enviando, errorEnvio }) {
  const [selecciones, setSelecciones] = useState({});
  const [comentarios, setComentarios] = useState("");

  const formatos = tarifas.formatos;

  const toggle = (id) => {
    setSelecciones((s) => {
      if (s[id]) {
        const next = { ...s };
        delete next[id];
        return next;
      }
      return { ...s, [id]: { necesidad: "" } };
    });
  };
  const update = (id, patch) => setSelecciones((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const formatosElegidos = formatos.filter((f) => selecciones[f.id]);
  const haySeleccion = formatosElegidos.length > 0;
  const canSubmit = haySeleccion && !enviando;

  const enviar = () => {
    if (!canSubmit) return;
    const pedido = formatosElegidos.map((f) => ({
      formatoId: f.id,
      titulo: f.titulo,
      duracion: f.duracion,
      necesidad: (selecciones[f.id].necesidad || "").trim(),
    }));
    onEnviar({ cliente, pedido, comentarios: comentarios.trim() });
  };

  return (
    <>
      <section style={{ background: "rgba(82,184,112,0.06)", borderBottom: "1px solid rgba(82,184,112,0.15)", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.7)" })}>
            <span style={{ color: "#52b870" }}>● </span>
            Cotizando como <strong style={{ color: "#fff" }}>{cliente.nombre}</strong>{cliente.empresa ? ` · ${cliente.empresa}` : ""}
          </p>
          <button type="button" onClick={onVolver}
            style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", fontSize: 12, cursor: "pointer", padding: 4, textDecoration: "underline" })}>
            ← Cambiar datos
          </button>
        </div>
      </section>

      <section style={{ padding: "clamp(32px, 5vw, 48px) 24px 16px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <h1 style={K({ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 12 })}>
            ¿Qué formatos te interesan?
          </h1>
          <p style={K({ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 })}>
            Marca los formatos que te llaman la atención y cuéntanos qué necesitas. El equipo comercial te
            contacta con una propuesta a medida.
          </p>
        </div>
      </section>

      <section style={{ padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={SectionTitle}>1 · Elige los formatos de tu interés</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: 16,
          }}>
            {formatos.map((f) => {
              const sel = Boolean(selecciones[f.id]);
              return (
                <button key={f.id} type="button" onClick={() => toggle(f.id)} className="cot-card"
                  aria-pressed={sel}
                  style={{
                    textAlign: "left",
                    background: sel ? "rgba(82,184,112,0.08)" : "rgba(255,255,255,0.03)",
                    border: sel ? "1px solid #52b870" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: 20, cursor: "pointer",
                    color: "#fff", fontFamily: "'Open Sans', sans-serif",
                    transition: "all 180ms ease",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <span style={{ fontSize: 32 }} aria-hidden>{f.icon}</span>
                    <span style={K({
                      fontSize: 11, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.1em", padding: "4px 8px", borderRadius: 4,
                      background: sel ? "#52b870" : "rgba(255,255,255,0.08)",
                      color: sel ? "#191919" : "rgba(255,255,255,0.6)",
                    })}>
                      {sel ? "✓ Agregado" : f.duracion}
                    </span>
                  </div>
                  <h3 style={K({ fontSize: 18, fontWeight: 700, marginBottom: 6 })}>{f.titulo}</h3>
                  <p style={K({ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 })}>{f.descripcion}</p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {haySeleccion && (
        <section style={{ padding: "32px 24px 16px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={SectionTitle}>2 · Cuéntanos qué necesitas en cada uno</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {formatosElegidos.map((f) => (
                <div key={f.id} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }} aria-hidden>{f.icon}</span>
                      <strong style={K({ fontSize: 15, fontWeight: 700 })}>{f.titulo}</strong>
                      <span style={K({ fontSize: 12, color: "rgba(255,255,255,0.4)" })}>· {f.duracion}</span>
                    </div>
                    <button type="button" onClick={() => toggle(f.id)}
                      style={K({ background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", fontSize: 12, cursor: "pointer", padding: 4 })}
                      aria-label={`Quitar ${f.titulo}`}>
                      Quitar ✕
                    </button>
                  </div>
                  <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.55)" })}>
                    ¿Qué cantidad o frecuencia tienes en mente?
                    <input type="text" value={selecciones[f.id].necesidad}
                      onChange={(e) => update(f.id, { necesidad: e.target.value })}
                      placeholder={placeholderPara(f.id)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 6, padding: "12px 14px",
                        color: "#fff", fontFamily: "'Open Sans', sans-serif",
                        fontSize: 14, outline: "none",
                      }} />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section style={{ padding: "32px 24px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={SectionTitle}>3 · Algo más</h2>
          <textarea rows={3} value={comentarios}
            onChange={(e) => setComentarios(e.target.value)}
            placeholder="Fechas tentativas, mensaje a difundir, presupuesto referencial, alguna campaña específica, etc."
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "14px 16px",
              color: "#fff", fontFamily: "'Open Sans', sans-serif",
              fontSize: 14, fontWeight: 400, outline: "none",
              resize: "vertical", minHeight: 96,
            }} />
        </div>
      </section>

      <section style={{ padding: "16px 24px 64px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between",
            background: "linear-gradient(135deg, #1d4a2b 0%, #29623a 100%)",
            borderRadius: 10, padding: 24,
          }}>
            <div style={{ flex: "1 1 280px" }}>
              <h3 style={K({ fontSize: 18, fontWeight: 700, marginBottom: 4 })}>
                {haySeleccion ? "El equipo comercial te contacta con la propuesta" : "Selecciona al menos un formato"}
              </h3>
              <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.85)" })}>
                Te responderemos a <strong>{cliente.email || cliente.telefono}</strong> en horario hábil.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer"
                style={K({
                  background: "transparent", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.4)", borderRadius: 6,
                  padding: "14px 22px", fontWeight: 600, fontSize: 14,
                  textDecoration: "none", display: "inline-block",
                })}>
                WhatsApp urgente
              </a>
              <button type="button" onClick={enviar} disabled={!canSubmit} className="cot-btn-primary"
                style={K({
                  background: canSubmit ? "#fff" : "rgba(255,255,255,0.3)",
                  color: "#0a3d23", border: "none",
                  borderRadius: 6, padding: "14px 26px",
                  fontWeight: 700, fontSize: 14,
                  cursor: canSubmit ? "pointer" : "not-allowed",
                  letterSpacing: "0.02em",
                })}>
                {enviando ? "Enviando..." : "Solicitar cotización"}
              </button>
            </div>
          </div>
          {errorEnvio && (
            <p style={K({ fontSize: 13, color: "#e87171", marginTop: 12, textAlign: "center" })}>{errorEnvio}</p>
          )}
        </div>
      </section>
    </>
  );
}

function placeholderPara(id) {
  switch (id) {
    case "frase_comercial":
    case "frase_politica":
      return "Ej: 6 pasadas diarias por 2 meses · campaña de invierno";
    case "entrevista":
      return "Ej: 2 entrevistas durante el mes · lanzamiento de producto";
    case "podcast":
      return "Ej: 4 episodios mensuales · serie sobre turismo";
    default:
      return "Cuéntanos qué necesitas";
  }
}
