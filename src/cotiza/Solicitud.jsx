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

/* ─── Opciones cerradas por formato ────────────────────────────────────────
   Cada formato pide al cliente N preguntas con respuestas predefinidas. La
   estructura de "selecciones" guarda { preguntaId: opcionId } por formato.

   Cada opción puede tener una `descripcion` consultiva que aparece cuando
   está seleccionada. La idea: ayudar al cliente a elegir según su objetivo
   (lanzamiento, mantenimiento de marca, inauguración, evento puntual, etc.).
   No siempre "más" es mejor.
─────────────────────────────────────────────────────────────────────────── */
const PREGUNTAS_POR_FORMATO = {
  frase_comercial: [
    {
      id: "cantidad",
      label: "¿Cuántas pasadas por día?",
      hint: "La cantidad ideal depende del objetivo de tu campaña.",
      opciones: [
        { id: "1", label: "1 frase al día", descripcion: "Presencia sutil. Ideal para marcas conocidas que quieren mantenerse en la mente del oyente sin sobrexponerse." },
        { id: "2", label: "2 frases al día", descripcion: "Refuerzo medido. Buen punto de partida para sostener la presencia: el oyente promedio te escucha varias veces por semana." },
        { id: "3", label: "3 frases al día", descripcion: "Cobertura sólida. Te posiciona en distintos momentos del día. Recomendado para mantenimiento activo de marca." },
        { id: "4", label: "4 frases al día", descripcion: "Presencia fuerte. Ideal para construir recordación rápido: marcas nuevas o ampliación de portafolio." },
        { id: "5", label: "5 frases al día", descripcion: "Alta exposición. Pensado para lanzamientos, inauguraciones o eventos puntuales donde necesitás impacto en poco tiempo." },
        { id: "6-10", label: "6 a 10 frases al día", descripcion: "Campaña intensiva. Para lanzamientos importantes, fechas comerciales fuertes (Navidad, Día del Padre) o eventos masivos." },
        { id: "10+", label: "Más de 10 frases al día", descripcion: "Saturación máxima. Solo recomendado para campañas de muy alto impacto en periodos cortos. Cuidamos juntos no agotar al oyente." },
      ],
    },
    {
      id: "duracion",
      label: "¿Por cuánto tiempo?",
      hint: "La duración define qué tipo de campaña estás haciendo: empujar algo puntual o construir marca a largo plazo.",
      opciones: [
        { id: "2-semanas", label: "2 semanas", descripcion: "Empuje corto. Promociones, ofertas, fechas puntuales o eventos específicos (una feria, una inauguración con fecha)." },
        { id: "1-mes", label: "1 mes", descripcion: "Campaña estándar. Tiempo mínimo recomendado para que tu mensaje se asiente y la mayoría de los oyentes te recuerde." },
        { id: "2-meses", label: "2 meses", descripcion: "Construcción de recordación. Ideal para presentar productos o servicios nuevos al mercado." },
        { id: "3-meses", label: "3 meses", descripcion: "Plan trimestral / estacional. Acompaña temporadas (verano, vuelta a clases, fin de año). Permite ajustar el mensaje a mitad de campaña." },
        { id: "6-meses", label: "6 meses", descripcion: "Marca instalada. Construye presencia sostenida. Recomendado para marcas que entran al mercado o se consolidan en La Araucanía." },
        { id: "1-ano", label: "1 año", descripcion: "Plan anual completo. Máxima presencia continua. Para marcas establecidas que quieren mantenerse top-of-mind todo el año." },
        { id: "mas-de-1-ano", label: "Más de un año", descripcion: "Compromiso de largo plazo. Conversemos un plan a medida con condiciones especiales." },
      ],
    },
    {
      id: "horario",
      label: "¿En qué momento del día?",
      hint: "Cada momento tiene un perfil de oyente distinto. Si no estás seguro, 'cualquier momento' es la opción más segura.",
      opciones: [
        { id: "cualquier", label: "Cualquier momento", descripcion: "Rotación libre durante toda la programación. Llegás al oyente promedio sin importar la hora. Mayor alcance, presupuesto eficiente." },
        { id: "manana", label: "Mañana (6 a 12 h)", descripcion: "Prime time matinal: gente desayunando, en el auto rumbo al trabajo o al colegio. Audiencia activa, ideal para mensajes de inicio de jornada." },
        { id: "mediodia", label: "Mediodía (12 a 15 h)", descripcion: "Hora del almuerzo, sobremesa. Buena para invitar a salir, ofrecer servicios o comercio del rubro alimentos y entretención." },
        { id: "tarde", label: "Tarde (15 a 19 h)", descripcion: "Vuelta del trabajo, decisión de planes para la noche o el fin de semana. Excelente para retail, gastronomía y servicios." },
        { id: "noche", label: "Noche (19 a 23 h)", descripcion: "Audiencia relajada en casa. Ideal para mensajes emocionales, marcas premium o servicios que requieren atención plena." },
      ],
    },
    {
      id: "objetivo",
      label: "¿Cuál es tu objetivo principal?",
      hint: "Esto nos ayuda a recomendarte el mejor mix de horarios y frecuencia.",
      opciones: [
        { id: "lanzamiento", label: "Lanzamiento de producto / servicio", descripcion: "Necesitás presencia fuerte en corto tiempo. Recomendamos alta frecuencia los primeros días + sostenido por al menos un mes." },
        { id: "inauguracion", label: "Inauguración / evento puntual", descripcion: "Concentramos pasadas en las semanas previas al evento. Frecuencia alta, duración corta." },
        { id: "marca-conocida", label: "Mantener marca conocida", descripcion: "Presencia constante de baja intensidad. Tu objetivo es que no te olviden." },
        { id: "marca-nueva", label: "Dar a conocer marca nueva", descripcion: "Construcción de recordación. Necesitás tiempo (mínimo 2-3 meses) y frecuencia media-alta." },
        { id: "promocion", label: "Promoción / oferta puntual", descripcion: "Empuje fuerte en corto plazo. Alta frecuencia para que el mensaje llegue antes de que termine la oferta." },
        { id: "campaña", label: "Campaña política / electoral", descripcion: "Crescendo hasta el día de la elección. Mensaje constante con refuerzos en los días previos." },
        { id: "otro", label: "Otro / aún no lo defino", descripcion: "Conversémoslo. El equipo comercial puede ayudarte a definirlo según tu negocio." },
      ],
    },
  ],
  frase_politica: [
    {
      id: "cantidad",
      label: "¿Cuántas pasadas por día?",
      hint: "En campañas políticas, la repetición ayuda a instalar nombre, eslogan o propuesta.",
      opciones: [
        { id: "1", label: "1 frase al día", descripcion: "Presencia mínima. Útil al inicio de campaña o como complemento a otros medios cuando el presupuesto de radio es acotado." },
        { id: "2", label: "2 frases al día", descripcion: "Presencia básica. Ideal en etapas tempranas para empezar a instalar nombre." },
        { id: "4", label: "4 frases al día", descripcion: "Refuerzo activo. Buena cobertura para campaña en construcción." },
        { id: "6", label: "6 frases al día", descripcion: "Campaña visible. El oyente promedio te escucha varias veces al día." },
        { id: "8", label: "8 frases al día", descripcion: "Alta exposición. Recomendado para tramo final o candidaturas con bajo conocimiento previo." },
        { id: "10+", label: "Más de 10 frases al día", descripcion: "Máxima exposición. Recta final de campaña o cierres." },
      ],
    },
    {
      id: "duracion",
      label: "¿Por cuánto tiempo?",
      hint: "Las campañas largas instalan el candidato; las cortas refuerzan antes de votar.",
      opciones: [
        { id: "1-semana", label: "1 semana", descripcion: "Cierre de campaña. Refuerzo final del mensaje días antes de la elección." },
        { id: "2-semanas", label: "2 semanas", descripcion: "Recta final. Repaso de propuestas y llamado al voto." },
        { id: "1-mes", label: "1 mes", descripcion: "Campaña estándar. Tiempo para instalar candidato o propuesta." },
        { id: "2-meses", label: "2 meses", descripcion: "Campaña extendida. Construcción de relato político." },
        { id: "hasta-eleccion", label: "Hasta el día de la elección", descripcion: "Cobertura completa. Acompaña al candidato desde el lanzamiento hasta el comicio, con intensidad creciente." },
      ],
    },
  ],
  entrevista: [
    {
      id: "duracion",
      label: "¿De cuánto?",
      hint: "La duración define qué tipo de conversación tendremos al aire.",
      opciones: [
        { id: "5min", label: "5 minutos", descripcion: "Conversación corta y enfocada. Ideal para una novedad específica: una apertura, un lanzamiento, un anuncio puntual. El oyente capta el mensaje sin que se diluya." },
        { id: "10min", label: "10 minutos", descripcion: "Profundidad y contexto. Tiempo para contar quién sos, qué hacés y por qué tu propuesta importa. Recomendado para construir posicionamiento." },
        { id: "15min", label: "15 minutos", descripcion: "Conversación extendida. Para temas con varias aristas o cuando hay más de un invitado. Permite explorar el tema sin apuro." },
      ],
    },
    {
      id: "modalidad",
      label: "¿Desde dónde?",
      hint: "El despacho en terreno tiene un recargo de 50% sobre el valor base.",
      opciones: [
        { id: "estudio", label: "Desde el estudio", descripcion: "Entrevista en nuestros estudios de Temuco o por teléfono, dentro de los bloques periodísticos. Valor base." },
        { id: "despacho", label: "Despacho en terreno", descripcion: "Móvil al lugar del evento, lanzamiento o actividad. Suma un 50% sobre el valor base por el desplazamiento." },
      ],
    },
    {
      id: "cantidad",
      label: "¿Cuántas entrevistas?",
      hint: "Una sola entrevista puede ser perfecta para un anuncio puntual; varias instalan tu voz como referente del tema.",
      opciones: [
        { id: "1", label: "1 entrevista", descripcion: "Para un hito específico: apertura, evento, anuncio importante." },
        { id: "2", label: "2 entrevistas", descripcion: "Una para anunciar, otra para reforzar o profundizar. Da continuidad al mensaje." },
        { id: "3", label: "3 entrevistas", descripcion: "Construcción de relato. Tres apariciones en distintos momentos instalan tu marca o causa como referente." },
        { id: "4", label: "4 entrevistas", descripcion: "Presencia sostenida. Una entrevista por semana durante un mes." },
        { id: "serie-mensual", label: "Serie mensual permanente", descripcion: "Cliente recurrente. Una entrevista por mes te mantiene como voz consultada del sector. Ideal para asociaciones, consultores, líderes gremiales." },
      ],
    },
  ],
  podcast: [
    {
      id: "duracion",
      label: "¿De cuánto?",
      hint: "30 minutos para temas concretos; 60 para conversaciones que profundizan.",
      opciones: [
        { id: "30min", label: "30 minutos", descripcion: "Episodio ágil. Ideal para una entrevista enfocada, una novedad o un único tema bien tratado. Más fácil de consumir." },
        { id: "60min", label: "60 minutos", descripcion: "Conversación profunda. Para temas complejos, varias voces o relatos extensos. Audiencia más comprometida pero menor alcance." },
      ],
    },
    {
      id: "cantidad",
      label: "¿Cuántos episodios?",
      hint: "Un piloto prueba el formato; una serie construye audiencia fiel.",
      opciones: [
        { id: "1", label: "1 episodio", descripcion: "Piloto o evento único. Probar el formato o tratar un tema específico." },
        { id: "2-3", label: "2 a 3 episodios", descripcion: "Mini-serie. Buena para temáticas con varios capítulos o construir expectativa de continuidad." },
        { id: "4", label: "4 episodios", descripcion: "Temporada corta. Buen formato para una temática con desarrollo: entrevistas a distintos protagonistas, abordaje por etapas." },
        { id: "mensual", label: "Programa mensual permanente", descripcion: "Programa propio. Construís audiencia fiel y te posicionás como referente del sector. Bonus: queda publicado en plataformas y se puede compartir." },
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

                    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                      {preguntas.map((p) => {
                        const opcionElegida = p.opciones.find((o) => o.id === respuestas[p.id]);
                        return (
                          <div key={p.id}>
                            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: 600, marginBottom: p.hint ? 2 : 8 })}>
                              {p.label}
                            </p>
                            {p.hint && (
                              <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: 8, lineHeight: 1.5 })}>
                                {p.hint}
                              </p>
                            )}
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
                            {opcionElegida?.descripcion && (
                              <div style={{
                                marginTop: 10, padding: "10px 12px",
                                background: "rgba(82,184,112,0.06)",
                                borderLeft: "2px solid #52b870",
                                borderRadius: "0 6px 6px 0",
                              }}>
                                <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.55 })}>
                                  <strong style={{ color: "#52b870" }}>{opcionElegida.label}</strong> — {opcionElegida.descripcion}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

