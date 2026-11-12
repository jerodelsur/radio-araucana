/* ─── Asistente de preguntas frecuentes (guiado, SIN IA) ─────────────────────
   Mismo motor que el asistente del APA y del Liceo: respuestas escritas a mano
   y coincidencia por palabras clave; no inventa nada. Si no entiende, deriva al
   formulario de contacto. El único tema que abre WhatsApp es la publicidad.

   - Los datos que cambian (parrilla, dirección, teléfono, horario, WhatsApp) se
     leen de `ctx`, que arma App.jsx desde el contenido de /admin: si cambian
     allá, el asistente los dice bien sin tocar este archivo.
   - Regla de contenido: sólo lo que el sitio ya publica (portada, /faq,
     /sobre-nosotros). Nada de precios ni promesas que no estén ahí.
   - Cada mensaje del asistente guarda el *tema*, no el texto: se vuelve a
     dibujar con los datos del momento («ahora suena…» no queda viejo).
   ──────────────────────────────────────────────────────────────────────── */
import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { X, ArrowUp, ArrowUpRight, Play, Pause, MessageCircle } from "lucide-react";

const SvgWhatsApp = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

/* ─── Piezas de las respuestas ────────────────────────────────────────────── */
// Los botones internos (#seccion) cierran el panel para que se vea adónde
// llevaron.
const Acciones = ({ children }) => <div className="asis-acciones">{children}</div>;
function BotonEscuchar({ ctx, cual = "araucana" }) {
  const sonando = ctx.station === cual;
  const nombre = cual === "frontera" ? "La Frontera" : "en vivo";
  return (
    <button type="button" className="btn btn-red btn-sm" onClick={() => ctx.play(cual)} aria-pressed={sonando}>
      {sonando ? <Pause size={15} aria-hidden="true" /> : <Play size={15} fill="#fff" aria-hidden="true" />}
      {sonando ? "Pausar" : `Escuchar ${nombre}`}
    </button>
  );
}
const BotonIr = ({ href, children, api, clase = "btn-cream" }) => {
  const interno = href.startsWith("#");
  const externo = /^https?:/.test(href);
  return (
    <a href={href} className={`btn btn-sm ${clase}`} onClick={interno ? api.close : undefined} {...(externo ? { target: "_blank", rel: "noreferrer" } : {})}>
      {children} {!interno && <ArrowUpRight size={15} aria-hidden="true" />}
    </a>
  );
};

const horario = (p) => `${p.start} a ${p.end}`;
function FilaPrograma({ p }) {
  return (
    <li><b style={{ fontVariantNumeric: "tabular-nums" }}>{horario(p)}</b> · {p.name}<span className="asis-tenue"> · {p.host}</span></li>
  );
}

/* ─── Preguntas y respuestas ──────────────────────────────────────────────── */
// kw: palabras clave ya normalizadas (minúsculas, sin acentos ni signos).
// a(ctx, api): la respuesta · label: texto de la ficha · sub: subtemas ·
// more: temas relacionados que se ofrecen debajo.
const FAQ = [
  { id: "escuchar", label: "Cómo escuchar",
    kw: ["escuchar", "escucho", "oir", "sintonizar", "sintonia", "frecuencia", "dial", "fm", "online", "en vivo", "internet", "stream", "streaming", "senal", "radio en vivo", "poner la radio"],
    a: (ctx) => (<>
      <p>Estamos en el <b>95.9 FM</b> en Temuco, Padre Las Casas y el centro de La Araucanía. Por internet, la señal en vivo suena aquí mismo las 24 horas, desde cualquier país.</p>
      <Acciones><BotonEscuchar ctx={ctx} /></Acciones>
    </>),
    more: ["programacion", "frontera"],
    sub: [
      { id: "extranjero", label: "Desde fuera de Chile",
        kw: ["extranjero", "otro pais", "fuera de chile", "exterior", "desde afuera", "argentina", "espana", "estados unidos", "europa"],
        a: (ctx) => (<>
          <p>Funciona desde cualquier país, sin restricciones. Solo toca play: no necesitas cuenta ni instalar nada.</p>
          <Acciones><BotonEscuchar ctx={ctx} /></Acciones>
        </>) },
      { id: "app", label: "¿Hay aplicación?",
        kw: ["app", "aplicacion", "descargar", "instalar", "play store", "app store", "android", "iphone", "celular", "telefono movil"],
        a: () => <p>No hace falta una aplicación: la señal suena directo desde el navegador del teléfono, entrando a <b>radioaraucana.cl</b> y tocando play.</p> },
      { id: "cobertura", label: "¿Hasta dónde llega la señal?",
        kw: ["cobertura", "alcance", "hasta donde", "llega la senal", "comunas", "no se escucha", "se escucha mal", "mala senal"],
        a: (ctx) => (<>
          <p>La señal 95.9 FM llega con buena recepción a Temuco, Padre Las Casas y las comunas cercanas. Si estás fuera de esa zona o se escucha mal, la señal por internet es la misma.</p>
          <Acciones><BotonEscuchar ctx={ctx} /></Acciones>
        </>) },
    ] },

  { id: "programacion", label: "Programación",
    kw: ["programa", "programas", "programacion", "parrilla", "horario", "horarios", "a que hora", "que suena", "que hay", "ahora", "al aire", "quien esta", "locutor", "conductor", "hoy"],
    a: (ctx, api) => (<>
      <p>
        {ctx.ahora
          ? <>Ahora está al aire <b>{ctx.ahora.name}</b>, con {ctx.ahora.host.split("·")[0].trim()}, hasta las {ctx.ahora.end}.</>
          : <>Ahora suena la selección musical de Radio Araucana.</>}
        {ctx.sigue && <> Sigue <b>{ctx.sigue.prog.name}</b>, {ctx.sigue.cuando ? `${ctx.sigue.cuando} a las` : "a las"} {ctx.sigue.prog.start}.</>}
      </p>
      <p>La parrilla, en hora de Chile:</p>
      <ul className="asis-lista">{ctx.programs.map((p, i) => <FilaPrograma key={i} p={p} />)}</ul>
      <Acciones><BotonIr href="#programacion" api={api}>Ver la programación</BotonIr><BotonEscuchar ctx={ctx} /></Acciones>
    </>),
    more: ["escuchar", "podcast"] },

  { id: "podcast", label: "Podcast y videos",
    kw: ["podcast", "capitulo", "capitulos", "video", "videos", "youtube", "araucana digital", "reel", "reels", "shorts", "entrevista", "entrevistas", "veo", "ver", "mirar", "entrevistas en video", "entrevistas completas", "ver el programa"],
    a: (ctx, api) => (<>
      <p><b>Araucana Digital</b> es nuestro podcast en video: entrevistas completas con autoridades, deportistas, artistas y emprendedores de la región.</p>
      <p>Los capítulos están en esta misma página y en YouTube. Los reels van en Instagram.</p>
      <Acciones>
        <BotonIr href="#podcast" api={api}>Ver los capítulos</BotonIr>
        <BotonIr href={ctx.redes.youtube} api={api} clase="btn-ghost">YouTube</BotonIr>
        <BotonIr href={ctx.redes.instagram} api={api} clase="btn-ghost">Instagram</BotonIr>
      </Acciones>
    </>),
    more: ["redes", "entrevista"] },

  // El único tema que deriva a WhatsApp: lo atiende una persona.
  { id: "publicidad", label: "Publicidad",
    kw: ["publicidad", "publicitar", "publicitario", "avisar", "aviso", "avisos", "anuncio", "anunciar", "pauta", "comercial", "cotizar", "cotizacion", "tarifa", "tarifas", "precio", "precios", "cuanto cuesta", "cuanto sale", "valor", "contratar", "auspicio", "auspiciar", "frases", "marketing", "promocionar", "mi negocio", "mi empresa"],
    a: (ctx) => (<>
      <p>La publicidad la ve directamente una persona del área comercial. Escríbenos por WhatsApp y te respondemos en horario de oficina: {ctx.settings.adminHours}</p>
      <Acciones>
        <a href={ctx.waUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm asis-wa"><SvgWhatsApp size={17} /> Cotizar por WhatsApp</a>
      </Acciones>
      <p className="asis-tenue">Si prefieres, también puedes <a href="/cotiza">armar tu cotización en línea</a>.</p>
    </>),
    more: ["extractos"] },

  { id: "extractos", label: "Extractos legales",
    kw: ["extracto", "extractos", "un extracto", "extracto legal", "legal", "legales", "dga", "dia", "derechos de agua", "publicacion radial", "difusion radial", "aviso legal", "tramite", "notificacion", "juzgado"],
    a: (ctx, api) => (<>
      <p>Los extractos legales (DGA, DIA y otros trámites que piden difusión radial) se emiten por <b>Radio La Frontera 1110 AM</b>.</p>
      <p>Se cotizan en línea: ingresas el texto del extracto y el sistema te da el valor.</p>
      <Acciones><BotonIr href="/frontera/extractos" api={api}>Cotizar un extracto</BotonIr></Acciones>
    </>),
    more: ["publicidad", "contacto"] },

  { id: "contacto", label: "Contacto",
    kw: ["contacto", "contactar", "contactarlos", "telefono", "llamar", "numero", "correo", "email", "mail", "escribir", "escribirles", "direccion", "donde estan", "donde quedan", "ubicacion", "estudios", "oficina", "horario de atencion", "atencion", "hablar con alguien", "una persona"],
    a: (ctx, api) => (<>
      <p>Los estudios están en el Edificio Torre Caupolicán: <b>{ctx.settings.address}</b>.</p>
      <p>Atención de oficina: {ctx.settings.adminHours} Teléfono: <a href={`tel:${(ctx.settings.adminPhone || "").replace(/\s/g, "")}`}>{ctx.settings.adminPhone}</a>.</p>
      <p>Para escribirnos, usa el formulario: tu mensaje llega al área que corresponde.</p>
      <Acciones><BotonIr href="/contacto" api={api}>Ir al formulario de contacto</BotonIr></Acciones>
    </>),
    more: ["publicidad"],
    sub: [
      { id: "entrevista", label: "Proponer una entrevista",
        kw: ["proponer", "una entrevista", "proponer una entrevista", "pedir una entrevista", "dar una entrevista", "entrevistar", "entrevistarme", "me entrevisten", "invitado", "invitar", "ir a la radio", "salir en la radio", "salir al aire", "dar a conocer", "lanzamiento", "mi proyecto"],
        a: (ctx, api) => (<>
          <p>Cuéntanos en el formulario de contacto quién eres y qué proyecto, lanzamiento o causa quieres dar a conocer. El equipo revisa las propuestas y te responde.</p>
          <Acciones><BotonIr href="/contacto" api={api}>Proponer una entrevista</BotonIr></Acciones>
        </>) },
      { id: "prensa", label: "Prensa y comunicados",
        kw: ["prensa", "comunicado", "comunicados", "periodista", "nota de prensa", "vocero", "gabinete", "informacion de prensa"],
        a: (ctx, api) => (<>
          <p>Los comunicados de prensa se reciben por el formulario de contacto o en <a href="mailto:prensa@araucanayfrontera.cl">prensa@araucanayfrontera.cl</a>.</p>
          <Acciones><BotonIr href="/contacto" api={api}>Enviar un comunicado</BotonIr></Acciones>
        </>) },
    ] },

  { id: "frontera", label: "Radio La Frontera",
    kw: ["frontera", "la frontera", "1110", "am", "folklore", "folclor", "campesino", "campesina", "emisora hermana"],
    a: (ctx, api) => (<>
      <p><b>Radio La Frontera 1110 AM</b> es nuestra emisora hermana, fundada en octubre de 1939: folklore, información campesina y la región al día. También suena por internet.</p>
      <Acciones><BotonEscuchar ctx={ctx} cual="frontera" /><BotonIr href="/frontera" api={api} clase="btn-ghost">Conocer La Frontera</BotonIr></Acciones>
    </>),
    more: ["extractos", "escuchar"] },

  { id: "historia", label: "Historia de la radio",
    kw: ["historia", "desde cuando", "fundada", "fundacion", "fundaron", "antiguedad", "cuantos anos", "primera fm", "1960", "quienes son", "quienes somos", "sobre la radio", "dueno", "duenos"],
    a: (ctx, api) => (<>
      <p>Radio Araucana nació el 1 de enero de 1960 en Temuco como XQD 1, la primera radio de Frecuencia Modulada en Chile y la segunda de Latinoamérica. Desde 1981 transmite desde el Cerro Ñielol.</p>
      <p>Es parte del Grupo Radios Araucana y La Frontera.</p>
      <Acciones><BotonIr href="/sobre-nosotros" api={api}>Nuestra historia</BotonIr></Acciones>
    </>),
    more: ["frontera"] },

  { id: "redes", label: "Redes sociales",
    kw: ["redes", "redes sociales", "instagram", "facebook", "seguir", "seguirlos", "insta", "fb", "tiktok", "suscribirme", "suscribirse"],
    a: (ctx, api) => (<>
      <p>Estamos en YouTube (podcast y entrevistas completas), Instagram (reels y avisos del día) y Facebook (noticias regionales y transmisiones).</p>
      <Acciones>
        <BotonIr href={ctx.redes.youtube} api={api}>YouTube</BotonIr>
        <BotonIr href={ctx.redes.instagram} api={api} clase="btn-ghost">Instagram</BotonIr>
        <BotonIr href={ctx.redes.facebook} api={api} clase="btn-ghost">Facebook</BotonIr>
      </Acciones>
    </>),
    more: ["podcast"] },
];

const STARTERS = ["escuchar", "programacion", "podcast", "publicidad", "extractos", "contacto"];
const GREET = ["hola", "holi", "buenas", "buenos dias", "buenas tardes", "buenas noches", "wena", "alo"];
const THANKS = ["gracias", "muchas gracias", "se agradece", "vale", "perfecto"];

const TEXTOS = {
  bienvenida: () => <p>Hola. Respondo las dudas más comunes sobre la radio: <b>cómo escucharnos, la programación, el podcast, publicidad, extractos legales y contacto</b>. Elige un tema o escribe tu pregunta.</p>,
  saludo: () => <p>¡Hola! Elige un tema o escribe tu pregunta.</p>,
  gracias: () => <p>¡De nada! ¿Te ayudo con algo más?</p>,
  nose: (ctx, api) => (<>
    <p>Esa respuesta no la tengo. Escríbenos por el formulario de contacto y te responde una persona del equipo.</p>
    <Acciones><BotonIr href="/contacto" api={api}>Ir al formulario de contacto</BotonIr></Acciones>
  </>),
};

/* ─── Motor ───────────────────────────────────────────────────────────────── */
const norm = (s) => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();

function findFAQ(id) {
  for (const f of FAQ) {
    if (f.id === id) return { f, parent: null };
    for (const s of f.sub || []) if (s.id === id) return { f: s, parent: f };
  }
  return null;
}
// Fichas bajo una respuesta: subtemas (o hermanos) + temas relacionados.
function followUps(f, parent) {
  const out = [];
  ((parent || f).sub || []).forEach((s) => { if (s !== f) out.push({ id: s.id, label: s.label }); });
  (f.more || []).forEach((id) => { const r = findFAQ(id); if (r) out.push({ id, label: r.f.label }); });
  return out;
}
// Las claves cortas (≤5 letras, sin espacios) sólo cuentan como palabra
// completa: si no, «dia» coincidiría dentro de «mediano».
function kwMatches(n, words, kw) {
  if (kw.includes(" ")) return ` ${n} `.includes(` ${kw} `);
  if (kw.length > 5) return n.includes(kw);
  return words.includes(kw);
}
function kwScore(n, words, list) {
  let score = 0;
  for (const kw of list) if (kwMatches(n, words, kw)) score += kw.includes(" ") ? 3 : kw.length > 6 ? 2 : 1;
  return score;
}
// Compiten todas las entradas y todos los subtemas: un subtema es más
// específico, así que gana el empate.
function match(n) {
  const words = n.split(" ");
  let best = null, bestScore = 0;
  for (const f of FAQ) {
    const s = kwScore(n, words, f.kw);
    if (s > bestScore) { bestScore = s; best = f.id; }
    for (const sub of f.sub || []) {
      const own = kwScore(n, words, sub.kw);
      if (own && own + 1 > bestScore) { bestScore = own + 1; best = sub.id; }
    }
  }
  return best;
}
// «¿A qué hora es La Gran Manada?»: si nombran un programa de la parrilla, se
// responde con ese bloque.
function matchPrograma(n, programs) {
  return programs.findIndex((p) => {
    const nombre = norm(p.name).replace(/^(la|el|los|las) /, "");
    return nombre.length >= 5 && n.includes(nombre);
  });
}
// Devuelve qué dibujar: { faq }, { prog } o { ui }.
function respond(text, ctx) {
  const n = norm(text), words = n.split(" ");
  const corto = !text.includes("?") && words.length <= 3;
  if (corto && THANKS.some((t) => kwMatches(n, words, t))) return { ui: "gracias" };
  const prog = matchPrograma(n, ctx.programs);
  if (prog >= 0) return { prog };
  const faq = match(n);
  if (faq) return { faq };
  if (words.length <= 4 && GREET.some((g) => kwMatches(n, words, g))) return { ui: "saludo" };
  if (THANKS.some((t) => kwMatches(n, words, t))) return { ui: "gracias" };
  return { ui: "nose" };
}

function Respuesta({ r, ctx, api }) {
  if (r.faq) { const x = findFAQ(r.faq); return x ? x.f.a(ctx, api) : TEXTOS.nose(ctx, api); }
  if (r.prog != null) {
    const p = ctx.programs[r.prog];
    if (!p) return TEXTOS.nose(ctx, api);
    return (<>
      <p><b>{p.name}</b> va de {horario(p)}, hora de Chile, con {p.host}.{ctx.ahora === p ? " Está al aire ahora." : ""}</p>
      <Acciones><BotonEscuchar ctx={ctx} /><BotonIr href="#programacion" api={api} clase="btn-ghost">Ver la programación</BotonIr></Acciones>
    </>);
  }
  return (TEXTOS[r.ui] || TEXTOS.nose)(ctx, api);
}
const fichasDe = (r) => {
  if (r.faq) { const x = findFAQ(r.faq); return x ? followUps(x.f, x.parent) : []; }
  if (r.prog != null) return [{ id: "programacion", label: "Programación" }];
  return [];
};

/* ─── Interfaz ────────────────────────────────────────────────────────────── */
const Estilos = () => (
  <style>{`
    .asis-fab { position: fixed; right: 20px; bottom: 92px; z-index: 9997; display: inline-flex; align-items: center; gap: 10px; min-height: 52px; padding: 0 20px 0 16px; border-radius: 999px; border: 1px solid rgba(17,19,17,.2); background: var(--cream); color: #131413; font-family: var(--font); font-weight: 700; font-size: 15px; cursor: pointer; box-shadow: 0 10px 30px rgba(0,0,0,.45); transition: transform 180ms var(--ease), background 180ms var(--ease); }
    .asis-fab:hover { transform: translateY(-2px); background: #fff; }
    .asis-fab:active { transform: scale(.98); }

    .asis-panel { position: fixed; right: 20px; bottom: 84px; z-index: 9998; width: min(392px, calc(100vw - 24px)); height: min(620px, calc(100dvh - 176px)); display: flex; flex-direction: column; background: var(--ink-3); border: 1px solid var(--line-strong); border-radius: 18px; overflow: hidden; box-shadow: 0 24px 64px rgba(0,0,0,.6); font-family: var(--font); animation: asisIn .24s var(--ease); }
    @keyframes asisIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
    @media (max-width: 639px) { .asis-panel { right: 12px; left: 12px; width: auto; } }
    @media (prefers-reduced-motion: reduce) { .asis-panel { animation: none; } }

    .asis-head { display: flex; align-items: center; gap: 12px; padding: 12px 10px 12px 16px; border-bottom: 1px solid var(--line); background: var(--ink-2); }
    .asis-head-t { flex: 1; min-width: 0; }
    .asis-head-t strong { display: block; font-weight: 800; font-size: 15px; line-height: 1.25; color: var(--cream); }
    .asis-head-t span { display: block; font-weight: 600; font-size: 13px; color: var(--cream-55); }

    .asis-body { flex: 1; overflow-y: auto; padding: 16px 14px; display: flex; flex-direction: column; gap: 10px; overscroll-behavior: contain; }
    .asis-msg { max-width: 90%; padding: 10px 14px; font-size: 15px; line-height: 1.5; color: var(--cream); }
    .asis-msg p + p, .asis-msg p + ul, .asis-msg ul + p { margin-top: 8px; }
    .asis-bot { align-self: flex-start; background: rgba(246,243,238,.07); border-radius: 4px 16px 16px 16px; }
    .asis-user { align-self: flex-end; background: var(--green-deep); color: #fff; border-radius: 16px 16px 4px 16px; }
    .asis-bot a:not(.btn) { color: var(--lime); text-underline-offset: 3px; }
    .asis-tenue { color: var(--cream-70); font-size: 14px; }
    .asis-lista { list-style: none; display: flex; flex-direction: column; gap: 5px; font-size: 14px; }
    .asis-acciones { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
    .asis-acciones .btn { min-height: 40px; }
    .asis-wa { background: #25D366; color: #0b2414; }
    .asis-wa:hover { background: #3ee07b; transform: translateY(-1px); }
    .asis-fichas { display: flex; flex-wrap: wrap; gap: 6px; padding-left: 2px; }

    .asis-pie { border-top: 1px solid var(--line); padding: 10px 12px 10px; background: var(--ink-2); }
    .asis-temas { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .asis-temas.compacto { flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; margin-right: -12px; padding-right: 12px; }
    .asis-temas.compacto::-webkit-scrollbar { display: none; }
    .asis-temas .tema-chip, .asis-fichas .tema-chip { flex: 0 0 auto; white-space: nowrap; }
    .asis-form { display: flex; align-items: center; gap: 8px; }
    .asis-input { flex: 1; min-width: 0; height: 46px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--line-strong); background: rgba(246,243,238,.05); color: var(--cream); font-family: var(--font); font-size: 16px; }
    .asis-input::placeholder { color: var(--cream-55); }
    .asis-enviar { flex-shrink: 0; width: 46px; height: 46px; border-radius: 50%; border: 0; background: var(--cream); color: #131413; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; transition: background 160ms var(--ease), transform 160ms var(--ease); }
    .asis-enviar:hover { background: var(--lime); }
    .asis-enviar:active { transform: scale(.95); }
    .asis-nota { margin-top: 8px; font-size: 12px; color: var(--cream-55); text-align: center; }
  `}</style>
);

let serie = 0;

export default function Asistente({ open, setOpen, ctx }) {
  const [msgs, setMsgs] = useState([{ id: 0, who: "bot", r: { ui: "bienvenida" } }]);
  const [texto, setTexto] = useState("");
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const cerrarRef = useRef(null);
  const ultimaPregunta = useRef(null);
  const api = { close: () => setOpen(false) };
  const conversando = msgs.length > 1;

  const preguntar = (label, r) => {
    setMsgs((m) => [...m, { id: ++serie, who: "user", text: label }, { id: ++serie, who: "bot", r }]);
  };
  const enviar = (e) => {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    preguntar(t, respond(t, ctx));
  };

  // La vista queda al inicio de la pregunta, para leer la respuesta desde arriba.
  useLayoutEffect(() => {
    const body = bodyRef.current, q = ultimaPregunta.current;
    if (open && body && q) body.scrollTop = q.offsetTop - body.offsetTop - 8;
  }, [msgs, open]);

  useEffect(() => {
    if (!open) return;
    // En táctil no se enfoca el campo: el teclado taparía los temas.
    const fino = window.matchMedia?.("(hover: hover) and (pointer: fine)").matches;
    const t = setTimeout(() => (fino ? inputRef.current : cerrarRef.current)?.focus(), 220);
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { clearTimeout(t); window.removeEventListener("keydown", onKey); };
  }, [open, setOpen]);

  const idUltimaPregunta = [...msgs].reverse().find((m) => m.who === "user")?.id;

  return (
    <>
      <Estilos />
      {!open && (
        <button type="button" className="asis-fab hide-sm-down" onClick={() => setOpen(true)} aria-expanded="false" aria-controls="asistente">
          <MessageCircle size={22} aria-hidden="true" /> ¿Te ayudamos?
        </button>
      )}
      {open && (
        <div id="asistente" className="asis-panel" role="dialog" aria-label="Asistente de Radio Araucana">
          <div className="asis-head">
            <div className="asis-head-t">
              <strong>Asistente de Radio Araucana</strong>
              <span>Preguntas frecuentes</span>
            </div>
            <button ref={cerrarRef} type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar el asistente" style={{ border: "none" }}><X size={20} /></button>
          </div>

          <div className="asis-body" ref={bodyRef} role="log" aria-live="polite" tabIndex={0}>
            {msgs.map((m) => m.who === "user" ? (
              <div key={m.id} ref={m.id === idUltimaPregunta ? ultimaPregunta : undefined} className="asis-msg asis-user">{m.text}</div>
            ) : (
              <div key={m.id} style={{ display: "contents" }}>
                <div className="asis-msg asis-bot"><Respuesta r={m.r} ctx={ctx} api={api} /></div>
                {fichasDe(m.r).length > 0 && (
                  <div className="asis-fichas">
                    {fichasDe(m.r).map((c) => (
                      <button key={c.id} type="button" className="tema-chip" onClick={() => preguntar(c.label, { faq: c.id })}>{c.label}</button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="asis-pie">
            <div className={`asis-temas${conversando ? " compacto" : ""}`} role="group" aria-label="Temas">
              {STARTERS.map((id) => {
                const f = findFAQ(id).f;
                return <button key={id} type="button" className="tema-chip" onClick={() => preguntar(f.label, { faq: id })}>{f.label}</button>;
              })}
            </div>
            <form className="asis-form" onSubmit={enviar}>
              <input ref={inputRef} className="asis-input" type="text" value={texto} onChange={(e) => setTexto(e.target.value)}
                placeholder="Escribe tu pregunta…" aria-label="Escribe tu pregunta" enterKeyHint="send" autoComplete="off" maxLength={200} />
              <button type="submit" className="asis-enviar" aria-label="Enviar"><ArrowUp size={20} aria-hidden="true" /></button>
            </form>
            <p className="asis-nota">Respuestas automáticas, sin IA.</p>
          </div>
        </div>
      )}
    </>
  );
}
