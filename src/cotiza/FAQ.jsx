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
        Si tu mensaje dura más de 30 segundos, <strong>se cobra como dos frases</strong> porque
        estaría ocupando el espacio completo de otro spot en una tanda publicitaria. Por eso conviene
        cuidar la duración del guion al escribirlo.
      </>
    ),
  },
  {
    q: "¿Cuál es la diferencia entre Horario Repartido y Horario Seleccionado?",
    a: (
      <>
        <strong>Horario Repartido</strong> rota de forma aleatoria durante toda la programación, así tu
        frase pasa en distintos momentos del día y llega a audiencias variadas.{" "}
        <strong>Horario Seleccionado</strong> es el que tú eliges: bloques específicos de audiencia
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
        formal. Si necesitas algo urgente, escríbenos a{" "}
        <a href="mailto:cotizaciones@araucanayfrontera.cl" style={{ color: "#52b870", textDecoration: "none" }}>
          cotizaciones@araucanayfrontera.cl
        </a>{" "}
        o por WhatsApp al{" "}
        <a href="https://wa.me/56992872087" target="_blank" rel="noreferrer" style={{ color: "#52b870", textDecoration: "none" }}>
          +56 9 9287 2087
        </a>.
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
        Durante los periodos de campaña, es una cuña electoral de 30 segundos. La{" "}
        <strong>ley chilena de propaganda política</strong> regula este tipo de avisos, por eso tienen
        tarifa diferenciada y condiciones específicas (períodos electorales, identificación del
        candidato/a, etc.). Te guiamos según lo que pide la normativa. En tiempos en que no hay
        campaña, también son frases que nos piden autoridades para que sus mensajes lleguen a la
        región.
      </>
    ),
  },
  {
    q: "¿Y la entrevista y el podcast?",
    a: (
      <>
        La <strong>entrevista</strong> es una aparición de <strong>5, 10 o 15 minutos</strong> dentro
        de un bloque periodístico —ideal para autoridades, voceros, lanzamientos—.{" "}
        El <strong>podcast</strong> es un programa de larga duración (30 o 60 min) producido en
        nuestros estudios, que sale al aire y queda publicado en el sitio y plataformas. También
        existe la posibilidad de hacer entrevistas fuera de los estudios (<strong>despachos en
        terreno</strong>).
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
