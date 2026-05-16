import React, { useState } from "react";
import defaultContent from "../content/site.json";

const SETTINGS = defaultContent.settings;
const K = (style) => ({ fontFamily: "'Open Sans', sans-serif", ...style });

/* ─── Temas + routing ─────────────────────────────────────────────────────
   El servidor (api/contacto/submit) decide a qué casilla mandar el correo
   según el `tema`. Acá solo definimos las opciones visibles al cliente.
─────────────────────────────────────────────────────────────────────────── */
const TEMAS = [
  {
    id: "publicidad",
    titulo: "Cotizar publicidad",
    descripcion: "Quiero pautar avisos, frases, entrevistas o un podcast en Radio Araucana.",
    icon: "📣",
    sugerencia: {
      titulo: "Tienes un cotizador automático",
      texto: "Para armar tu cotización en pocos clics, entra a nuestro cotizador. Recibirás una propuesta más rápido.",
      cta: { label: "Ir al cotizador →", href: "/cotiza" },
    },
  },
  {
    id: "extractos",
    titulo: "Extracto legal",
    descripcion: "Necesito difundir un extracto para DGA, DIA u otro trámite que requiere publicación radial.",
    icon: "📜",
    sugerencia: {
      titulo: "Tenemos un sistema dedicado",
      texto: "Los extractos legales se cotizan y pagan online en nuestro sistema de Radio La Frontera 1110 AM.",
      cta: { label: "Ir a extractos →", href: "/frontera/extractos" },
    },
  },
  {
    id: "prensa",
    titulo: "Prensa y comunicados",
    descripcion: "Soy periodista, tengo un comunicado para difundir o quiero proponer una nota / entrevista a la radio.",
    icon: "📰",
  },
  {
    id: "general",
    titulo: "Consulta general",
    descripcion: "Tengo otra consulta para el equipo (institucional, programación, propuestas, etc.).",
    icon: "💬",
  },
];

const LogoSVG = ({ height = 32 }) => (
  <svg height={height} viewBox="0 0 600 274.21" fill="#fff" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }} aria-label="Radio Araucana FM 95.9">
    <g>
      <g>
        <path d="M5.43,45.99h37.15c8.43,0,14.79,2.29,19.07,6.88c4.29,4.59,6.43,10.76,6.43,18.52c0,4.73-1.18,8.93-3.55,12.59c-2.37,3.66-5.58,6.49-9.65,8.48c0.81,0.67,1.51,1.44,2.11,2.33c0.59,0.89,1.26,2.18,2,3.88l8.21,18.74H45.46l-7.54-17.19c-0.59-1.33-1.31-2.27-2.16-2.83c-0.85-0.55-2.05-0.83-3.6-0.83h-5.88v20.85H5.43V45.99z M37.25,80.59c3.03,0,5.38-0.79,7.04-2.38c1.66-1.59,2.49-3.86,2.49-6.82c0-6.28-2.96-9.43-8.87-9.43H26.27v18.63H37.25z" />
        <path d="M99.01,45.99h22.07l27.39,71.42h-21.74l-5.99-15.19H99.23l-5.88,15.19H71.62L99.01,45.99z M117.97,87.25l-7.98-20.96L102,87.25H117.97z" />
        <path d="M153.49,45.99h31.94c11.38,0,20.02,2.87,25.89,8.59c5.88,5.73,8.82,14.92,8.82,27.56c0,12.05-2.94,20.94-8.82,26.67c-5.88,5.73-14.51,8.59-25.89,8.59h-31.94V45.99z M182.77,101.44c3.7,0,6.69-0.54,8.98-1.61c2.29-1.07,4.05-2.99,5.27-5.77c1.22-2.77,1.83-6.75,1.83-11.92c0-5.25-0.55-9.33-1.66-12.25c-1.11-2.92-2.83-4.97-5.16-6.15c-2.33-1.18-5.42-1.77-9.26-1.77h-8.43v39.48H182.77z" />
        <path d="M226.7,45.99h20.85v71.42H226.7V45.99z" />
        <path d="M263.57,109.7c-6.14-5.88-9.2-15.14-9.2-27.78c0-13.01,3.05-22.44,9.15-28.28c6.1-5.84,15.21-8.76,27.34-8.76c12.12,0,21.24,2.94,27.34,8.82c6.1,5.88,9.15,15.29,9.15,28.22c0,12.57-3.07,21.81-9.2,27.72c-6.14,5.92-15.23,8.87-27.28,8.87C278.79,118.52,269.7,115.58,263.57,109.7z M302.43,96.29c2.4-2.99,3.6-7.78,3.6-14.36c0-6.95-1.18-11.9-3.55-14.86c-2.37-2.96-6.25-4.44-11.64-4.44c-5.4,0-9.28,1.48-11.64,4.44c-2.37,2.96-3.55,7.91-3.55,14.86c0,6.58,1.2,11.37,3.6,14.36c2.4,2.99,6.27,4.49,11.59,4.49C296.17,100.78,300.03,99.28,302.43,96.29z" />
        <path d="M30.6,122.04h22.07l27.39,71.42H58.32l-5.99-15.19H30.82l-5.88,15.19H3.21L30.6,122.04z M49.56,163.29l-7.98-20.96l-7.98,20.96H49.56z" />
        <path d="M85.08,122.04h37.15c8.43,0,14.79,2.29,19.07,6.88c4.29,4.59,6.43,10.76,6.43,18.52c0,4.73-1.18,8.93-3.55,12.59c-2.37,3.66-5.58,6.49-9.65,8.48c0.81,0.67,1.51,1.44,2.11,2.33c0.59,0.89,1.26,2.18,2,3.88l8.21,18.74h-21.74l-7.54-17.19c-0.59-1.33-1.31-2.27-2.16-2.83c-0.85-0.55-2.05-0.83-3.6-0.83h-5.88v20.85H85.08V122.04z M116.91,156.64c3.03,0,5.38-0.79,7.04-2.38c1.66-1.59,2.49-3.86,2.49-6.82c0-6.28-2.96-9.43-8.87-9.43h-11.64v18.63H116.91z" />
        <path d="M178.67,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L178.67,122.04z M197.63,163.29l-7.98-20.96l-7.98,20.96H197.63z" />
        <path d="M238.13,187.08c-6.17-4.99-9.26-12.03-9.26-21.13v-43.91h20.85v41.7c0,8.72,4.33,13.09,12.98,13.09c8.58,0,12.86-4.36,12.86-13.09v-41.7h20.85v43.91c0,6.06-1.41,11.24-4.21,15.53c-2.81,4.29-6.76,7.54-11.87,9.76c-5.1,2.22-10.98,3.33-17.63,3.33C252.49,194.56,244.3,192.07,238.13,187.08z" />
        <path d="M312.16,185.08c-6.8-6.32-10.2-15.32-10.2-27c0-12.05,3.34-21.25,10.04-27.61c6.69-6.36,16.58-9.54,29.66-9.54c4.21,0,8.04,0.32,11.48,0.94c3.44,0.63,6.89,1.57,10.37,2.83v18.19c-6.36-2.81-13.16-4.21-20.4-4.21c-6.8,0-11.81,1.55-15.03,4.66c-3.22,3.11-4.82,8.02-4.82,14.75c0,6.51,1.68,11.26,5.05,14.25c3.36,2.99,8.37,4.49,15.03,4.49c7.32,0,14.12-1.37,20.4-4.1v18.3c-6.88,2.37-14.19,3.55-21.96,3.55C328.83,194.56,318.96,191.4,312.16,185.08z" />
        <path d="M394.9,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L394.9,122.04z M413.86,163.29l-7.98-20.96l-7.98,20.96H413.86z" />
        <path d="M449.38,122.04h17.74l26.95,37.82v-37.82h20.85v71.42h-17.85l-26.84-37.7v37.7h-20.85V122.04z" />
        <path d="M547.33,122.04h22.07l27.39,71.42h-21.74l-5.99-15.19h-21.51l-5.88,15.19h-21.74L547.33,122.04z M566.3,163.29l-7.98-20.96l-7.98,20.96H566.3z" />
        <path d="M5.43,198.08H59.1v15.53H26.27v12.31h28.61v15.75H26.27v27.83H5.43V198.08z" />
        <path d="M63.4,198.08H83.7l17.74,36.26l17.63-36.26h20.18v71.42h-20.85v-35.71l-11.42,23.51h-11.2l-11.53-23.51v35.71H63.4V198.08z" />
        <path d="M161.05,269.99c-2.88-0.41-5.69-1.13-8.43-2.16v-16.19c2.51,1.11,5.12,1.89,7.82,2.33c2.7,0.44,5.75,0.67,9.15,0.67c5.25,0,9.26-1,12.03-2.99c2.77-2,4.16-4.51,4.16-7.54v-2.11c-1.85,1.18-4.18,2.15-6.99,2.88c-2.81,0.74-5.47,1.11-7.98,1.11c-8.65,0-15.03-2.01-19.13-6.04c-4.1-4.03-6.15-9.96-6.15-17.8c0-7.76,2.4-13.9,7.21-18.41c4.8-4.51,12.31-6.76,22.51-6.76c10.28,0,17.85,2.4,22.73,7.21c4.88,4.81,7.32,12.05,7.32,21.74v13.75c0,5.99-1.35,11.31-4.05,15.97c-2.7,4.66-6.6,8.32-11.7,10.98c-5.1,2.66-11.09,3.99-17.96,3.99C167.45,270.6,163.94,270.4,161.05,269.99z M185.78,227.69v-5.1c0-3.77-0.87-6.52-2.61-8.26c-1.74-1.74-4.45-2.61-8.15-2.61c-3.55,0-6.25,0.83-8.1,2.49c-1.85,1.66-2.77,4.05-2.77,7.15c0,3.25,0.81,5.69,2.44,7.32c1.63,1.63,4.36,2.44,8.21,2.44C178.28,231.13,181.94,229.98,185.78,227.69z" />
        <path d="M300.35,269.99c-2.88-0.41-5.69-1.13-8.43-2.16v-16.19c2.51,1.11,5.12,1.89,7.82,2.33c2.7,0.44,5.75,0.67,9.15,0.67c5.25,0,9.26-1,12.03-2.99c2.77-2,4.16-4.51,4.16-7.54v-2.11c-1.85,1.18-4.18,2.15-6.99,2.88c-2.81,0.74-5.47,1.11-7.98,1.11c-8.65,0-15.03-2.01-19.13-6.04c-4.1-4.03-6.15-9.96-6.15-17.8c0-7.76,2.4-13.9,7.21-18.41c4.8-4.51,12.31-6.76,22.51-6.76c10.28,0,17.85,2.4,22.73,7.21c4.88,4.81,7.32,12.05,7.32,21.74v13.75c0,5.99-1.35,11.31-4.05,15.97c-2.7,4.66-6.6,8.32-11.7,10.98c-5.1,2.66-11.09,3.99-17.96,3.99C306.74,270.6,303.23,270.4,300.35,269.99z M325.08,227.69v-5.1c0-3.77-0.87-6.52-2.61-8.26c-1.74-1.74-4.45-2.61-8.15-2.61c-3.55,0-6.25,0.83-8.1,2.49c-1.85,1.66-2.77,4.05-2.77,7.15c0,3.25,0.81,5.69,2.44,7.32c1.63,1.63,4.36,2.44,8.21,2.44C317.57,231.13,321.23,229.98,325.08,227.69z" />
        <path d="M221.85,269.66c-4.32-0.63-7.86-1.57-10.59-2.83v-16.75c2.44,1.18,5.56,2.13,9.37,2.83c3.81,0.7,7.08,1.05,9.81,1.05c4.06,0,7.04-0.63,8.93-1.89c1.89-1.26,2.83-3.25,2.83-5.99c0-2.59-0.7-4.45-2.11-5.6c-1.41-1.14-3.88-1.72-7.43-1.72h-21.74v-9.54l1.89-31.16h46.24l-1.44,15.97h-26.95l-0.67,10.2h8.1c16.93,0,25.39,7.54,25.39,22.62c0,7.32-2.53,13.1-7.6,17.36c-5.06,4.25-12.44,6.38-22.12,6.38C230.14,270.6,226.17,270.29,221.85,269.66z" />
        <path d="M268.41,254.52h16.41v14.97h-16.41V254.52z" />
      </g>
      <g>
        <path d="M549.22,15.66c-0.22,3.39-1.68,6.56-4.12,8.75c-12.17,10.93-25.76,20.18-40.11,26.96l-0.73,0.25c-17.3,8.3-35.71,13.37-54.88,14.95V42.5c10.17-0.79,19.87-2.69,29.12-5.7c19.2-6.31,37.2-16.54,52.98-30.86c4.4-3.64,10.46-3.64,14.1,0.47C548.01,9.07,549.22,12.24,549.22,15.66z" />
        <path d="M563.57,58.91c-1.93,1.71-3.64,3.42-5.58,4.88c-31.68,27.12-69.07,42.84-108.61,45.56V85.52c28.9-2.41,57.29-12.58,82.09-30c6.34-4.37,12.42-9.25,18.25-14.58c2.19-2.22,5.35-3.17,8.02-2.69c2.44,0.25,4.63,1.46,6.34,3.42h0.22l0.98,1.2C568.45,48.23,567.72,55.26,563.57,58.91z" />
        <path d="M579.38,99.02c-7.76,6.81-15.81,13.02-24.11,18.6h-50.03c21.74-8.49,42.2-21.1,60.77-37.55c2.66-2.19,5.83-2.91,9-2.19c2.92,0.73,5.58,3.14,7.03,6.08l0.51,0.48v0.95C584.23,90.28,583.02,95.63,579.38,99.02z" />
      </g>
    </g>
  </svg>
);

export default function ContactoApp() {
  const [tema, setTema] = useState(null);
  const [datos, setDatos] = useState({ nombre: "", empresa: "", telefono: "", email: "", mensaje: "" });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [enviado, setEnviado] = useState(false);

  const temaInfo = TEMAS.find((t) => t.id === tema);
  const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());

  const puedeEnviar =
    Boolean(tema) &&
    datos.nombre.trim().length >= 2 &&
    esEmail(datos.email) &&
    datos.mensaje.trim().length >= 5 &&
    !enviando;

  const enviar = async (e) => {
    e?.preventDefault?.();
    if (!puedeEnviar) return;
    setEnviando(true);
    setError("");
    try {
      const r = await fetch("/api/contacto/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tema,
          temaTitulo: temaInfo?.titulo,
          cliente: {
            nombre: datos.nombre.trim(),
            empresa: datos.empresa.trim(),
            telefono: datos.telefono.trim(),
            email: datos.email.trim(),
          },
          mensaje: datos.mensaje.trim(),
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(data.message || data.error || `Error ${r.status}.`);
      } else {
        setEnviado(true);
      }
    } catch (err) {
      setError("No pudimos enviar tu mensaje. Revisa tu conexión.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div style={{ background: "#191919", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <GlobalStyles />

      <header style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "18px 24px",
        position: "sticky", top: 0, background: "rgba(25,25,25,0.92)",
        backdropFilter: "blur(8px)", zIndex: 10,
      }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <a href="/" aria-label="Inicio Radio Araucana" style={{ display: "block" }}>
            <LogoSVG height={32} />
          </a>
          <a href="/" className="cot-back" style={K({ color: "rgba(255,255,255,0.6)", textDecoration: "none", fontSize: 13, fontWeight: 500 })}>
            ← Volver al sitio
          </a>
        </div>
      </header>

      <main style={{ flex: 1, padding: "clamp(48px, 8vw, 80px) 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {enviado ? (
            <Confirmacion temaTitulo={temaInfo?.titulo} nombre={datos.nombre} />
          ) : (
            <>
              <div style={{ textAlign: "center", marginBottom: 36 }}>
                <p style={K({ fontSize: 12, fontWeight: 600, color: "#52b870", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 })}>
                  Radio Araucana 95.9 FM · Temuco
                </p>
                <h1 style={K({ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 12 })}>
                  ¿En qué podemos ayudarte?
                </h1>
                <p style={K({ fontSize: 15, fontWeight: 300, color: "rgba(255,255,255,0.65)", lineHeight: 1.6 })}>
                  Elige el tema y te conectamos con la persona indicada. Respondemos en horario hábil.
                </p>
              </div>

              {/* Selector de tema */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
                {TEMAS.map((t) => {
                  const activo = tema === t.id;
                  return (
                    <button key={t.id} type="button" onClick={() => setTema(t.id)}
                      className="cot-card"
                      style={{
                        textAlign: "left",
                        background: activo ? "rgba(82,184,112,0.08)" : "rgba(255,255,255,0.03)",
                        border: activo ? "1px solid #52b870" : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 10, padding: "16px 18px", cursor: "pointer",
                        color: "#fff", fontFamily: "'Open Sans', sans-serif",
                        transition: "all 180ms ease", display: "flex", gap: 14, alignItems: "flex-start",
                      }}>
                      <span style={{ fontSize: 28, lineHeight: 1 }} aria-hidden>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <strong style={K({ fontSize: 16, fontWeight: 700, display: "block", marginBottom: 4 })}>{t.titulo}</strong>
                        <p style={K({ fontSize: 13, fontWeight: 300, color: "rgba(255,255,255,0.6)", lineHeight: 1.5 })}>
                          {t.descripcion}
                        </p>
                      </div>
                      <span style={{
                        flexShrink: 0, width: 18, height: 18, borderRadius: "50%",
                        border: activo ? "5px solid #52b870" : "1.5px solid rgba(255,255,255,0.3)",
                        background: activo ? "#191919" : "transparent",
                      }} aria-hidden />
                    </button>
                  );
                })}
              </div>

              {/* Sugerencia: si hay sistema dedicado, ofrecérselo en lugar del form */}
              {temaInfo?.sugerencia && (
                <div style={{
                  background: "rgba(82,184,112,0.06)",
                  border: "1px solid rgba(82,184,112,0.25)",
                  borderRadius: 10, padding: 18, marginBottom: 24,
                  display: "flex", flexDirection: "column", gap: 10,
                }}>
                  <p style={K({ fontSize: 13, fontWeight: 700, color: "#52b870" })}>
                    {temaInfo.sugerencia.titulo}
                  </p>
                  <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.55 })}>
                    {temaInfo.sugerencia.texto}
                  </p>
                  <div>
                    <a href={temaInfo.sugerencia.cta.href}
                      style={K({
                        display: "inline-block",
                        background: "#52b870", color: "#0a3d23",
                        padding: "10px 18px", borderRadius: 6,
                        fontWeight: 700, fontSize: 13, textDecoration: "none",
                      })}>
                      {temaInfo.sugerencia.cta.label}
                    </a>
                    <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8 })}>
                      O si prefieres, escríbenos abajo y te respondemos.
                    </p>
                  </div>
                </div>
              )}

              {/* Form (solo si hay tema) */}
              {tema && (
                <form onSubmit={enviar} style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, padding: 24,
                  display: "flex", flexDirection: "column", gap: 14,
                }}>
                  <Campo label="Nombre" required value={datos.nombre}
                    onChange={(v) => setDatos((d) => ({ ...d, nombre: v }))}
                    placeholder="Tu nombre" />
                  <Campo label="Empresa o agrupación" value={datos.empresa}
                    onChange={(v) => setDatos((d) => ({ ...d, empresa: v }))}
                    placeholder="Opcional" />
                  <Campo label="Email" required type="email" value={datos.email}
                    onChange={(v) => setDatos((d) => ({ ...d, email: v }))}
                    placeholder="tu@correo.cl" />
                  <Campo label="Teléfono / WhatsApp" type="tel" value={datos.telefono}
                    onChange={(v) => setDatos((d) => ({ ...d, telefono: v }))}
                    placeholder="+56 9 ..." />
                  <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.55)" })}>
                    Mensaje <span style={{ color: "#52b870" }}>*</span>
                    <textarea rows={5} value={datos.mensaje}
                      onChange={(e) => setDatos((d) => ({ ...d, mensaje: e.target.value }))}
                      placeholder={tema === "publicidad" ? "Cuéntanos qué buscas, fechas tentativas, presupuesto referencial…" :
                        tema === "extractos" ? "Cuéntanos sobre el trámite que necesitas difundir…" :
                          "Cuéntanos en qué podemos ayudarte"}
                      style={inputStyle} />
                  </label>

                  {error && (
                    <p style={K({ fontSize: 13, color: "#e87171" })}>{error}</p>
                  )}

                  <button type="submit" disabled={!puedeEnviar}
                    style={K({
                      background: puedeEnviar ? "#52b870" : "rgba(82,184,112,0.4)",
                      color: "#0a3d23", border: "none",
                      borderRadius: 6, padding: "14px 22px",
                      fontWeight: 700, fontSize: 14,
                      cursor: puedeEnviar ? "pointer" : "not-allowed",
                      letterSpacing: "0.02em", marginTop: 8,
                    })}>
                    {enviando ? "Enviando..." : "Enviar mensaje"}
                  </button>

                  <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5, textAlign: "center" })}>
                    Usamos tus datos solo para responder esta consulta. No los compartimos con terceros.
                  </p>
                </form>
              )}

              {/* Alternativas directas */}
              <div style={{
                marginTop: 36, padding: 20,
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10,
              }}>
                <p style={K({ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 })}>
                  ¿Prefieres otro canal?
                </p>
                <div style={K({ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.9 })}>
                  📞 <a href={`https://wa.me/${SETTINGS.whatsappNumber}`} target="_blank" rel="noreferrer"
                    style={{ color: "#52b870", textDecoration: "none" }}>{SETTINGS.adminPhone} (WhatsApp)</a><br />
                  ✉ <a href={`mailto:${SETTINGS.contactEmail}`}
                    style={{ color: "#52b870", textDecoration: "none" }}>{SETTINGS.contactEmail}</a><br />
                  📍 {SETTINGS.address}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: 24 }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.4)" })}>
            © 2026 Radios Araucana y La Frontera · {SETTINGS.address}
          </p>
        </div>
      </footer>
    </div>
  );
}

function Confirmacion({ temaTitulo, nombre }) {
  return (
    <div style={{ textAlign: "center", padding: "40px 0" }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: "rgba(82,184,112,0.15)", border: "2px solid #52b870",
        display: "flex", alignItems: "center", justifyContent: "center",
        margin: "0 auto 28px", fontSize: 36,
      }} aria-hidden>✓</div>

      <p style={K({ fontSize: 12, fontWeight: 600, color: "#52b870", textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 12 })}>
        Mensaje recibido
      </p>
      <h1 style={K({ fontSize: "clamp(28px, 4.5vw, 38px)", fontWeight: 700, lineHeight: 1.15, marginBottom: 16 })}>
        Gracias, {nombre.split(" ")[0]}
      </h1>
      <p style={K({ fontSize: 16, fontWeight: 300, color: "rgba(255,255,255,0.7)", lineHeight: 1.6, maxWidth: 480, margin: "0 auto 28px" })}>
        Tu consulta sobre <strong style={{ color: "#52b870" }}>{temaTitulo?.toLowerCase()}</strong> ya está en manos del equipo que la atiende. Te responderemos en horario hábil al correo que dejaste.
      </p>
      <a href="/" style={K({
        display: "inline-block",
        background: "transparent", color: "rgba(255,255,255,0.7)",
        border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6,
        padding: "12px 22px", fontWeight: 600, fontSize: 13,
        textDecoration: "none",
      })}>
        ← Volver al sitio
      </a>
    </div>
  );
}

function Campo({ label, required, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.55)" })}>
      {label}{required ? <span style={{ color: "#52b870" }}> *</span> : null}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6, padding: "12px 14px",
  color: "#fff", fontFamily: "'Open Sans', sans-serif",
  fontSize: 14, fontWeight: 400, outline: "none",
};

function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'Open Sans', sans-serif; background: #191919; }
      html { background: #191919; }
      .cot-card:hover { border-color: rgba(82,184,112,0.6) !important; transform: translateY(-2px); }
      .cot-back:hover { color: #52b870 !important; }
      input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
      input:focus, textarea:focus {
        border-color: rgba(82,184,112,0.7) !important;
        background: rgba(82,184,112,0.06) !important;
      }
    `}</style>
  );
}
