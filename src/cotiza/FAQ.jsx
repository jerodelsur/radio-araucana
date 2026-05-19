import React from "react";
import { K } from "./Layout.jsx";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 20,
};

const PREGUNTAS = [
  {
    q: "¿Qué es una “frase” publicitaria?",
    a: (
      <>
        Una frase es un <strong>spot publicitario grabado de hasta 30 segundos</strong>. Es la unidad
        básica de pauta en la radio: cada vez que tu frase sale al aire, cuenta como una pasada.
        Si tu mensaje dura <strong>más de 30 segundos, se cobra como dos frases</strong> (cada bloque
        adicional de hasta 30 segundos suma una frase más). Por eso conviene cuidar la duración del
        guion al escribirlo.
      </>
    ),
  },
  {
    q: "¿Cuál es la diferencia entre Horario Repartido y Horario Seleccionado?",
    a: (
      <>
        <strong>Horario Repartido</strong> rota de forma aleatoria durante toda la programación, así tu
        frase pasa en distintos momentos del día y llega a audiencias variadas.{" "}
        <strong>Horario Seleccionado</strong> es el que tú eliges: bloques específicos de mayor audiencia
        —como los matinales o los informativos centrales— y por eso tiene mayor costo por frase. Muchas
        campañas combinan ambos: seleccionado para impacto y repartido para frecuencia.
      </>
    ),
  },
  {
    q: "¿Cómo funcionan los packs mensuales y la “tarifa suelta”?",
    a: (
      <>
        Los packs (30, 60, 90, 120) son <strong>cantidades de frases por mes</strong>. Mientras más
        frases incluye el pack, <strong>menor es el precio por frase</strong>. La tarifa suelta es
        para campañas chicas o pasadas puntuales y tiene precio por frase individual, sin
        compromiso mensual.
      </>
    ),
  },
  {
    q: "¿Quién produce y graba la frase?",
    a: (
      <>
        Podemos grabar tu frase en los estudios de Radio Araucana con nuestros locutores
        profesionales, o bien recibimos tu audio si ya lo tienes producido. Si necesitas
        producción (locución, música, efectos), el equipo comercial te confirma si va incluida o
        si tiene costo aparte según la complejidad.
      </>
    ),
  },
  {
    q: "¿Puedo cambiar el mensaje durante el mes?",
    a: (
      <>
        Sí. Dentro del pack mensual <strong>los cambios de creatividad son sin costo adicional</strong>,
        solo necesitamos que coordines el nuevo guion o audio con producción con al menos 24 a 48
        horas de anticipación.
      </>
    ),
  },
  {
    q: "¿Los precios incluyen IVA?",
    a: (
      <>
        Los valores que ves en la cotización son <strong>netos</strong>. Al total se le suma el{" "}
        <strong>19% de IVA</strong> en la factura. La cotización formal que te envía el equipo
        comercial detalla subtotal, IVA y total.
      </>
    ),
  },
  {
    q: "¿Cómo es el proceso después de enviar la solicitud?",
    a: (
      <>
        Al enviar el formulario, el equipo comercial recibe tu pedido y te contacta en horario
        hábil (lunes a viernes) por el medio que indicaste —email o teléfono— con la propuesta
        formal. Si necesitas algo urgente, escríbenos directo al WhatsApp del botón superior.
      </>
    ),
  },
  {
    q: "¿Cómo se paga y cuándo sale al aire?",
    a: (
      <>
        Trabajamos con <strong>factura electrónica</strong> y el medio de pago habitual es
        transferencia bancaria. La pauta comienza a salir al aire una vez recibido el comprobante de
        pago y aprobado el audio definitivo por producción.
      </>
    ),
  },
  {
    q: "¿Qué es una “frase política”?",
    a: (
      <>
        Es una cuña de campaña electoral de 30 segundos. La <strong>ley chilena de propaganda
        política</strong> regula este tipo de avisos, por eso tienen tarifa diferenciada y
        condiciones específicas (períodos electorales, identificación del candidato/a, etc.). Te
        guiamos en lo que pide la normativa.
      </>
    ),
  },
  {
    q: "¿Y la entrevista y el podcast?",
    a: (
      <>
        La <strong>entrevista</strong> es una aparición de 5 o 10 minutos dentro de un bloque
        periodístico —ideal para autoridades, voceros, lanzamientos—.{" "}
        El <strong>podcast</strong> es un programa de larga duración (30 o 60 min) producido en
        nuestros estudios, que sale al aire y queda publicado en el sitio y plataformas.
      </>
    ),
  },
  {
    q: "¿Hay descuentos disponibles?",
    a: (
      <>
        Sí. A mayor volumen del pack mensual, mejor precio por frase. Además contamos con tarifas
        especiales para <strong>PYME regional</strong> (empresas con única sede en Temuco) y para{" "}
        <strong>agencias con compromiso anual</strong>. Si crees calificar, coméntalo en el
        formulario y el equipo comercial lo aplica en la propuesta.
      </>
    ),
  },
];

export default function FAQ() {
  return (
    <section style={{ padding: "32px 24px 16px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h2 style={SectionTitle}>Cómo funciona la cotización · Preguntas frecuentes</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PREGUNTAS.map((p, i) => (
            <details key={i} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <summary style={K({
                fontSize: 14, fontWeight: 600, color: "#fff",
                cursor: "pointer", listStyle: "none",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
              })}>
                <span>{p.q}</span>
                <span aria-hidden style={K({
                  color: "#52b870", fontSize: 18, lineHeight: 1, fontWeight: 400,
                  flexShrink: 0,
                })}>+</span>
              </summary>
              <div style={K({
                fontSize: 14, fontWeight: 300,
                color: "rgba(255,255,255,0.7)", lineHeight: 1.65,
                marginTop: 10,
              })}>
                {p.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
