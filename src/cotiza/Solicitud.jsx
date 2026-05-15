import React, { useState } from "react";
import { K } from "./Layout.jsx";
import FAQ from "./FAQ.jsx";

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

/* ─── Opciones cerradas por formato ────────────────────────────────────────
   Cada formato pide al cliente N preguntas con respuestas predefinidas, así
   los datos que llegan a /cotiza/admin son consistentes y comparables. La
   estructura de "selecciones" guarda { preguntaId: opcionId } por formato.
─────────────────────────────────────────────────────────────────────────── */
const PREGUNTAS_POR_FORMATO = {
  frase_comercial: [
    {
      id: "cantidad",
      label: "¿Cuántas pasadas por día?",
      opciones: [
        { id: "1-2", label: "1 a 2" },
        { id: "3-5", label: "3 a 5" },
        { id: "6-10", label: "6 a 10" },
        { id: "10+", label: "Más de 10" },
      ],
    },
    {
      id: "duracion",
      label: "¿Por cuánto tiempo?",
      opciones: [
        { id: "una-semana", label: "Una semana" },
        { id: "un-mes", label: "Un mes" },
        { id: "2-3-meses", label: "2 a 3 meses" },
        { id: "4-mas-meses", label: "Más de 3 meses" },
      ],
    },
    {
      id: "horario",
      label: "¿En qué momento del día?",
      opciones: [
        { id: "cualquier", label: "Cualquier momento" },
        { id: "manana-mediodia", label: "Mañana / mediodía" },
        { id: "tarde-noche", label: "Tarde / noche" },
      ],
    },
  ],
  frase_politica: [
    {
      id: "cantidad",
      label: "¿Cuántas pasadas por día?",
      opciones: [
        { id: "1-2", label: "1 a 2" },
        { id: "3-5", label: "3 a 5" },
        { id: "6-10", label: "6 a 10" },
        { id: "10+", label: "Más de 10" },
      ],
    },
    {
      id: "duracion",
      label: "¿Por cuánto tiempo?",
      opciones: [
        { id: "una-semana", label: "Una semana" },
        { id: "dos-semanas", label: "Dos semanas" },
        { id: "un-mes", label: "Un mes" },
        { id: "hasta-eleccion", label: "Hasta la elección" },
      ],
    },
  ],
  entrevista: [
    {
      id: "duracion",
      label: "¿De cuánto?",
      opciones: [
        { id: "5min", label: "5 minutos" },
        { id: "10min", label: "10 minutos" },
      ],
    },
    {
      id: "cantidad",
      label: "¿Cuántas entrevistas?",
      opciones: [
        { id: "1", label: "1 entrevista" },
        { id: "2", label: "2 entrevistas" },
        { id: "3-5", label: "Serie de 3 a 5" },
      ],
    },
  ],
  podcast: [
    {
      id: "duracion",
      label: "¿De cuánto?",
      opciones: [
        { id: "30min", label: "30 minutos" },
        { id: "60min", label: "60 minutos" },
      ],
    },
    {
      id: "cantidad",
      label: "¿Cuántos episodios?",
      opciones: [
        { id: "1", label: "1 episodio" },
        { id: "2-4", label: "2 a 4 episodios" },
        { id: "mensual", label: "Programa mensual" },
      ],
    },
  ],
};

function preguntasFor(formatoId) {
  return PREGUNTAS_POR_FORMATO[formatoId] || [];
}

function necesidadString(formato, respuestas) {
  const preguntas = preguntasFor(formato.id);
  const partes = [];
  preguntas.forEach((p) => {
    const op = p.opciones.find((o) => o.id === respuestas?.[p.id]);
    if (op) {
      const labelLimpio = p.label.replace(/^¿/, "").replace(/\?$/, "");
      partes.push(`${labelLimpio}: ${op.label}`);
    }
  });
  return partes.join(" · ");
}

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
      // Inicializa cada pregunta sin respuesta hasta que el cliente la marque.
      const respuestasIniciales = {};
      preguntasFor(id).forEach((p) => { respuestasIniciales[p.id] = ""; });
      return { ...s, [id]: { respuestas: respuestasIniciales } };
    });
  };
  const setRespuesta = (formatoId, preguntaId, opcionId) =>
    setSelecciones((s) => ({
      ...s,
      [formatoId]: {
        ...s[formatoId],
        respuestas: { ...(s[formatoId]?.respuestas || {}), [preguntaId]: opcionId },
      },
    }));

  const formatosElegidos = formatos.filter((f) => selecciones[f.id]);
  const haySeleccion = formatosElegidos.length > 0;

  // Todos los formatos seleccionados deben tener todas sus preguntas respondidas.
  const todasRespondidas = formatosElegidos.every((f) => {
    const preguntas = preguntasFor(f.id);
    const respuestas = selecciones[f.id]?.respuestas || {};
    return preguntas.every((p) => Boolean(respuestas[p.id]));
  });
  const canSubmit = haySeleccion && todasRespondidas && !enviando;

  const enviar = () => {
    if (!canSubmit) return;
    const pedido = formatosElegidos.map((f) => {
      const respuestas = selecciones[f.id]?.respuestas || {};
      return {
        formatoId: f.id,
        titulo: f.titulo,
        duracion: f.duracion,
        opciones: respuestas,             // estructurado para el panel
        necesidad: necesidadString(f, respuestas), // legible para email/listado
      };
    });
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
                  {f.horarios && (
                    <p style={K({
                      fontSize: 11, fontWeight: 400,
                      color: "rgba(82,184,112,0.85)", lineHeight: 1.5,
                      marginTop: 10, paddingTop: 10,
                      borderTop: "1px dashed rgba(255,255,255,0.08)",
                    })}>
                      Hasta 30 seg por frase. Si dura más, se cobra como 2 frases.
                    </p>
                  )}
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
              {formatosElegidos.map((f) => {
                const preguntas = preguntasFor(f.id);
                const respuestas = selecciones[f.id]?.respuestas || {};
                return (
                  <div key={f.id} style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: 16,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
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

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {preguntas.map((p) => (
                        <div key={p.id}>
                          <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 8 })}>
                            {p.label}
                          </p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            {p.opciones.map((o) => {
                              const activa = respuestas[p.id] === o.id;
                              return (
                                <button key={o.id} type="button"
                                  onClick={() => setRespuesta(f.id, p.id, o.id)}
                                  style={K({
                                    background: activa ? "#52b870" : "rgba(255,255,255,0.04)",
                                    color: activa ? "#0a3d23" : "rgba(255,255,255,0.8)",
                                    border: activa ? "1px solid #52b870" : "1px solid rgba(255,255,255,0.15)",
                                    borderRadius: 999, padding: "8px 14px",
                                    fontSize: 13, fontWeight: activa ? 700 : 500,
                                    cursor: "pointer",
                                    transition: "all 150ms ease",
                                  })}>
                                  {o.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {!todasRespondidas && (
              <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 10, fontStyle: "italic" })}>
                Completa todas las preguntas de cada formato para poder enviar.
              </p>
            )}
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

      <FAQ />

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

