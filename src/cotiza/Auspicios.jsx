import { useEffect, useMemo, useRef, useState } from "react";
import { OPCIONES_TIPO_PROMOCION } from "./Identificacion.jsx";
import defaultContent from "../content/site.json";
import {
  SELECCION_INICIAL, calcular, fmtCLP, auspicioDe, auspicioMensualBase,
  plazosAuspicio, formatoDe, salidasAlAire,
} from "./auspicios-calc.js";

/* ─── /cotiza/auspicios ──────────────────────────────────────────────────
   Cotizador interactivo con precios a la vista y el look del podcast
   Araucana Digital: muro de cuadritos verdes, Anton en crema, palabra clave
   en serif itálica lima y relieve 3D (sombra dura = cubo extruido).

   Cada selección hace que pase algo: el muro lanza una onda, «tu día al
   aire» enciende el programa y sus salidas, las cifras ruedan y una línea
   cuenta qué cambió. El servidor recalcula todo con el mismo módulo antes
   de enviar el correo; lo que se ve acá es una vista previa.
─────────────────────────────────────────────────────────────────────────── */

const CREMA = "#F6F3EE";
const VERDE = "#52B870";
const LIMA = "#92BD55";
const PROFUNDO = "#29623A";
const PANEL = "#0A3D23";
const FONDO = "#0B1610";
const STORAGE_SEL = "cotiza_auspicios_sel_v2";

const esEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
const sinTildes = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
const conductorDe = (p) => String(p?.host || "").split("·")[0].trim();
const horaDecimal = (hhmm) => { const [h, m] = String(hhmm).split(":").map(Number); return h + (m || 0) / 60; };
const azar = (a, b = 0) => { const h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
const reduceMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Retratos reales de los conductores (los mismos de la parrilla de la portada).
const FOTOS = {
  "alejandro contreras": "/programas/alejandro-contreras.jpg",
  "miguel angel contreras": "/programas/miguel-angel-contreras.jpg",
  "mariela gonzalez": "/programas/mariela-gonzalez.jpg",
  "cristian inostroza": "/programas/cristian-inostroza.jpg",
  "luis vega": "/programas/luis-vega.jpg",
  "rolando gomez": "/programas/rolando-gomez.jpg",
};
const fotoDe = (p) => (typeof p?.photo === "string" && p.photo.trim()) || FOTOS[sinTildes(conductorDe(p))] || "";
const iniciales = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

function leerSeleccion() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_SEL) || "null");
    if (s && typeof s === "object") return { ...SELECCION_INICIAL, ...s };
  } catch { /* ignore */ }
  return SELECCION_INICIAL;
}

/* ─── Muro de cuadritos (canvas) ───────────────────────────────────────────
   El mosaico del estudio, con cada cuadro extruido. `pulso` (contador) lanza
   una onda que levanta y enciende los cuadros; `nivel` (0–1) deja más
   cuadros crema encendidos mientras más grande es la propuesta. */
const PALETA = ["#0A3D23", "#0F4A2B", "#29623A", "#29623A", "#3C8F55", "#52B870", "#52B870", "#7DBB5E", "#92BD55"];

function Muro({ pulso = 0, nivel = 0, celda = 46, origen = [0.5, 0.5], style, className }) {
  const ref = useRef(null);
  const estado = useRef({ nivel, raf: 0, inicio: 0 });
  useEffect(() => { estado.current.nivel = nivel; }, [nivel]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    let ancho = 0, alto = 0;

    const mezclar = (hex, hacia, k) => {
      const a = parseInt(hex.slice(1), 16), b = parseInt(hacia.slice(1), 16);
      const c = (s) => Math.round(((a >> s) & 255) + (((b >> s) & 255) - ((a >> s) & 255)) * k);
      return `rgb(${c(16)},${c(8)},${c(0)})`;
    };

    const dibujar = (t) => {
      const cols = Math.ceil(ancho / celda) + 1, filas = Math.ceil(alto / celda) + 1;
      const ox = origen[0] * ancho, oy = origen[1] * alto;
      const dur = 1300, vel = Math.hypot(ancho, alto) / 900;
      ctx.fillStyle = PANEL;
      ctx.fillRect(0, 0, ancho, alto);
      for (let f = 0; f < filas; f++) {
        for (let c = 0; c < cols; c++) {
          const r = azar(c, f);
          let color = PALETA[Math.floor(r * PALETA.length)];
          // Cuadros crema: siempre unos pocos, más mientras crece la propuesta.
          if (azar(c + 31, f + 17) < 0.025 + estado.current.nivel * 0.13) color = CREMA;
          const x = c * celda, y = f * celda;
          let k = 0;
          if (t >= 0 && t < dur) {
            const d = Math.hypot(x + celda / 2 - ox, y + celda / 2 - oy);
            const frente = t * vel;
            k = Math.exp(-(((d - frente) / (celda * 1.6)) ** 2)) * (1 - t / dur);
          }
          const sube = k * 7;
          ctx.fillStyle = k > 0.02 ? mezclar(color.startsWith("#") ? color : "#52B870", color === CREMA ? "#FFFFFF" : "#C9E58A", k * 0.85) : color;
          ctx.fillRect(x, y - sube, celda, celda);
          // Relieve: canto inferior y derecho en sombra, filo superior con luz.
          ctx.fillStyle = "rgba(4,24,13,0.34)";
          ctx.fillRect(x, y - sube + celda - 5, celda, 5 + sube);
          ctx.fillRect(x + celda - 3, y - sube, 3, celda);
          ctx.fillStyle = "rgba(246,243,238,0.10)";
          ctx.fillRect(x, y - sube, celda - 3, 2);
        }
      }
    };

    const ajustar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const caja = canvas.getBoundingClientRect();
      ancho = caja.width; alto = caja.height;
      canvas.width = Math.round(ancho * dpr); canvas.height = Math.round(alto * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dibujar(-1);
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(canvas);
    const e = estado.current;
    e.dibujar = dibujar;
    return () => { ro.disconnect(); cancelAnimationFrame(e.raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celda]);

  useEffect(() => {
    const e = estado.current;
    if (!e.dibujar) return undefined;
    cancelAnimationFrame(e.raf);
    if (reduceMotion()) { e.dibujar(-1); return undefined; }
    e.inicio = performance.now();
    const paso = (ahora) => {
      const t = ahora - e.inicio;
      e.dibujar(t);
      if (t < 1300) e.raf = requestAnimationFrame(paso); else e.dibujar(-1);
    };
    e.raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(e.raf);
  }, [pulso, nivel]);

  return <canvas ref={ref} aria-hidden="true" className={className} style={{ display: "block", width: "100%", height: "100%", ...style }} />;
}

/* Cifra que rueda hasta el nuevo valor. */
function Cifra({ valor, formato = fmtCLP, className, style }) {
  const [mostrado, setMostrado] = useState(valor);
  const desde = useRef(valor);
  useEffect(() => {
    const dur = reduceMotion() ? 0 : 520;
    const inicio = performance.now(), origen = desde.current;
    let raf;
    const paso = (t) => {
      const p = dur ? Math.min(1, (t - inicio) / dur) : 1;
      const v = Math.round(origen + (valor - origen) * (1 - Math.pow(1 - p, 4)));
      setMostrado(v); desde.current = v;
      if (p < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor]);
  return <span className={className} style={{ fontVariantNumeric: "tabular-nums", ...style }}>{formato(mostrado)}</span>;
}

function Interruptor({ activo, onChange, etiqueta }) {
  return (
    <button type="button" role="switch" aria-checked={activo} aria-label={etiqueta}
      onClick={() => onChange(!activo)} className="aus-switch"><span /></button>
  );
}

function Contador({ valor, min = 0, max = 50, onChange, etiqueta }) {
  return (
    <div className="aus-stepper" role="group" aria-label={etiqueta}>
      <button type="button" aria-label={`Restar ${etiqueta}`} disabled={valor <= min} onClick={() => onChange(Math.max(min, valor - 1))}>−</button>
      <output key={valor} aria-live="polite">{valor}</output>
      <button type="button" aria-label={`Sumar ${etiqueta}`} disabled={valor >= max} onClick={() => onChange(Math.min(max, valor + 1))}>+</button>
    </div>
  );
}

function Bloque({ indice, titulo, acento, bajada, desde, activo, onToggle, children }) {
  return (
    <section className="aus-bloque" data-on={activo || undefined}>
      <header className="aus-bloque-head" onClick={() => onToggle(!activo)}>
        <span className="aus-indice" aria-hidden="true">{indice}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 className="aus-h2">{titulo} {acento && <em>{acento}</em>}</h2>
          <p className="aus-bajada">{bajada}</p>
          {desde && <p className="aus-desde">{desde}</p>}
        </div>
        <span onClick={(e) => e.stopPropagation()}>
          <Interruptor activo={activo} onChange={onToggle} etiqueta={`Incluir ${titulo} ${acento || ""}`} />
        </span>
      </header>
      {activo && <div className="aus-bloque-body">{children}</div>}
    </section>
  );
}

const Etiqueta = ({ children }) => <p className="aus-etiqueta">{children}</p>;

/* ─── Tu día al aire ───────────────────────────────────────────────────────
   La parrilla de un día hábil. Los programas auspiciados se encienden con
   sus 2 menciones (crema) y 2 frases (lima); las frases del pack se reparten
   por el día o se agrupan en los bloques de mayor audiencia. */
function DiaAlAire({ programas, sel, frasesAlDia, prime, mini }) {
  const inicio = Math.min(...programas.map((p) => horaDecimal(p.start)), 6);
  const fin = Math.max(...programas.map((p) => horaDecimal(p.end)), 20);
  const pct = (h) => ((h - inicio) / (fin - inicio)) * 100;
  const horas = [];
  for (let h = Math.ceil(inicio); h <= fin; h += 2) horas.push(h);

  const puntos = [];
  if (frasesAlDia > 0) {
    const picos = [7.5, 8.6, 12.2, 13.8, 18.4, 19.2, 9.4, 17.1];
    for (let i = 0; i < Math.min(frasesAlDia, 8); i++) {
      puntos.push(prime ? picos[i] : inicio + ((i + 0.5 + (azar(i, frasesAlDia) - 0.5) * 0.5) / frasesAlDia) * (fin - inicio));
    }
  }
  const elegidos = sel.auspicio.activo ? sel.auspicio.programas : [];

  return (
    <div className="aus-dia" data-mini={mini || undefined}>
      <div className="aus-dia-pista">
        {programas.map((p) => {
          const on = elegidos.includes(p.name);
          const a = horaDecimal(p.start), b = horaDecimal(p.end);
          return (
            <div key={p.name} className="aus-dia-prog" data-on={on || undefined} title={`${p.name} · ${p.start} a ${p.end}`}
              style={{ left: `${pct(a)}%`, width: `calc(${pct(b) - pct(a)}% - 3px)` }}>
              {on && [0, 1, 2, 3].map((i) => (
                <i key={i} data-tipo={i % 2 ? "frase" : "mencion"} style={{ left: `${12 + i * 25}%`, animationDelay: `${i * 70}ms` }} />
              ))}
            </div>
          );
        })}
      </div>
      <div className="aus-dia-tanda">
        {puntos.map((h, i) => <i key={`${frasesAlDia}-${prime}-${i}`} style={{ left: `${pct(h)}%`, animationDelay: `${i * 60}ms` }} />)}
      </div>
      {!mini && (
        <>
          <div className="aus-dia-horas">
            {horas.map((h) => <span key={h} style={{ left: `${pct(h)}%` }}>{String(h).padStart(2, "0")}</span>)}
          </div>
          <p className="aus-dia-leyenda">
            <span><i data-tipo="mencion" />Mención en vivo</span>
            <span><i data-tipo="frase" />Frase de 30″</span>
          </p>
        </>
      )}
    </div>
  );
}

export default function Auspicios({ tarifas, cliente: clienteInicial, onGuardarCliente, onEnviar, enviando, errorEnvio }) {
  const [sel, setSel] = useState(leerSeleccion);
  const [programas, setProgramas] = useState(defaultContent.programs || []);
  const [cliente, setCliente] = useState(() => ({
    nombre: "", empresa: "", telefono: "", email: "", tipoPromocion: "", tipoPromocionOtro: "",
    ...(clienteInicial || {}),
  }));
  const [comentarios, setComentarios] = useState("");
  const [intento, setIntento] = useState(false);
  const [pulso, setPulso] = useState(0);
  const [nota, setNota] = useState("Elige un programa y mira cómo se enciende tu día al aire.");
  const formRef = useRef(null);

  // La parrilla vive en el contenido editable del sitio; si falla, la del bundle.
  useEffect(() => {
    let cancel = false;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancel && Array.isArray(d?.programs) && d.programs.length) setProgramas(d.programs); })
      .catch(() => {});
    return () => { cancel = true; };
  }, []);

  useEffect(() => {
    const antes = document.title;
    document.title = "Arma tu auspicio en Radio Araucana 95.9 FM: precios al instante";
    return () => { document.title = antes; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_SEL, JSON.stringify(sel)); } catch { /* ignore */ }
  }, [sel]);

  const presupuesto = useMemo(() => calcular(sel, tarifas), [sel, tarifas]);
  const salidas = useMemo(() => salidasAlAire(sel, tarifas), [sel, tarifas]);
  const auspicio = auspicioDe(tarifas);
  const baseAuspicio = auspicioMensualBase(tarifas);
  const plazos = plazosAuspicio(tarifas);
  const frase = formatoDe(tarifas, "frase_comercial");
  const entrevista = formatoDe(tarifas, "entrevista");
  const podcast = formatoDe(tarifas, "podcast");
  const horarioFrases = frase?.horarios?.find((h) => h.id === sel.frases.horario) || frase?.horarios?.[0];
  const packFrases = horarioFrases?.packs?.find((p) => p.id === sel.frases.pack) || horarioFrases?.packs?.[0];
  const frasesAlDia = sel.frases.activo && packFrases && packFrases.id !== "suelta" ? Math.round(packFrases.frases / 30) : 0;

  // Toda acción cambia la selección, cuenta qué pasó y lanza la onda del muro.
  const accion = (clave, cambios, mensaje) => {
    setSel((s) => ({ ...s, [clave]: { ...s[clave], ...cambios } }));
    if (mensaje) setNota(mensaje);
    setPulso((p) => p + 1);
  };

  const togglePrograma = (p) => {
    const actuales = sel.auspicio.programas || [];
    const estaba = actuales.includes(p.name);
    accion("auspicio",
      { programas: estaba ? actuales.filter((n) => n !== p.name) : [...actuales, p.name] },
      estaba ? `Quitaste ${p.name}.` : `${conductorDe(p)} te nombra en vivo dos veces por programa, de ${p.start} a ${p.end}.`);
  };

  const elegirPlazo = (pl) => {
    const mensual = Math.round(baseAuspicio * (1 - pl.descuento / 100));
    accion("auspicio", { meses: pl.meses }, pl.descuento
      ? `Con ${pl.meses} meses pagas ${fmtCLP(mensual)} al mes en vez de ${fmtCLP(baseAuspicio)}.`
      : "Un mes para probar, sin compromiso de permanencia.");
  };

  // Validación de contacto (mismas reglas que /api/cotiza/submit).
  const c = cliente;
  const errores = {
    nombre: c.nombre.trim().length < 2,
    empresa: c.empresa.trim().length < 2,
    contacto: !c.telefono.trim() && !esEmail(c.email),
    email: Boolean(c.email.trim()) && !esEmail(c.email),
    tipo: !c.tipoPromocion || (c.tipoPromocion === "otro" && c.tipoPromocionOtro.trim().length < 2),
  };
  const contactoValido = !Object.values(errores).some(Boolean);
  const hayAlgo = presupuesto.lineas.length > 0;
  const nivel = Math.min(1, presupuesto.lineas.length / 4 + Math.min(salidas, 400) / 800);

  const irAlFormulario = () => {
    formRef.current?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
    setTimeout(() => formRef.current?.querySelector("input")?.focus({ preventScroll: true }), 500);
  };

  const enviar = (e) => {
    e.preventDefault();
    setIntento(true);
    if (!hayAlgo || !contactoValido || enviando) return;
    const datos = {
      nombre: c.nombre.trim(), empresa: c.empresa.trim(), telefono: c.telefono.trim(), email: c.email.trim(),
      tipoPromocion: c.tipoPromocion, tipoPromocionOtro: c.tipoPromocion === "otro" ? c.tipoPromocionOtro.trim() : "",
    };
    onGuardarCliente?.(datos);
    onEnviar({ cliente: datos, armado: sel, comentarios: comentarios.trim() });
  };

  const campo = (clave, props = {}) => (
    <input value={c[clave]} onChange={(e) => setCliente({ ...c, [clave]: e.target.value })} className="aus-input" {...props} />
  );

  const mejorDescuento = Math.max(...plazos.map((p) => p.descuento));
  const dia = (mini) => <DiaAlAire programas={programas} sel={sel} frasesAlDia={frasesAlDia} prime={horarioFrases?.id === "prime"} mini={mini} />;
  const resumen = (compacto) => (
    <Resumen presupuesto={presupuesto} salidas={salidas} nota={nota} pulso={pulso} nivel={nivel} compacto={compacto} dia={dia(false)} />
  );

  return (
    <div className="aus">
      <EstilosAuspicios />

      {/* ── Hero: el muro del estudio con el panel del podcast ── */}
      <section className="aus-hero">
        <Muro pulso={pulso} nivel={nivel} celda={56} origen={[0.72, 0.5]} style={{ position: "absolute", inset: 0 }} />
        <div className="aus-hero-velo" />
        <div className="aus-hero-in">
          <div className="aus-hero-panel aus-reveal">
            <p className="aus-kicker">Auspicios · Radio Araucana FM 95.9</p>
            <h1 className="aus-h1">Arma tu auspicio <em>a tu medida</em></h1>
            <p className="aus-hero-texto">
              Elige un programa, súmale frases, entrevistas o un podcast y mira el precio moverse.
              Cuando te guste la combinación, nos la envías.
            </p>
            <p className="aus-hero-datos">
              <span><b>{fmtCLP(Math.round(baseAuspicio * (1 - mejorDescuento / 100)))}</b> al mes, el auspicio más conveniente</span>
              <span><b>−{mejorDescuento}%</b> en planes de 12 meses</span>
            </p>
          </div>
        </div>
      </section>

      <div className="aus-grid">
        <div className="aus-col">

          {/* 01 · Auspicio de programa */}
          <Bloque indice="01" titulo="Auspicia un" acento="programa" bajada={auspicio.descripcion}
            desde={`Desde ${fmtCLP(Math.round(baseAuspicio * (1 - mejorDescuento / 100)))} + IVA al mes`}
            activo={sel.auspicio.activo}
            onToggle={(v) => accion("auspicio", { activo: v }, v ? "Auspicio de programa incluido." : "Sacaste el auspicio de programa.")}>
            <Etiqueta>¿Con quién quieres sonar?</Etiqueta>
            <div className="aus-programas">
              {programas.map((p, i) => {
                const on = sel.auspicio.programas.includes(p.name);
                const foto = fotoDe(p);
                return (
                  <button key={p.name} type="button" className="aus-programa" aria-pressed={on} onClick={() => togglePrograma(p)}
                    style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="aus-retrato">
                      {foto ? <img src={foto} alt="" loading="lazy" /> : <b>{iniciales(conductorDe(p))}</b>}
                    </span>
                    <span className="aus-programa-txt">
                      <span className="aus-programa-hora">{p.start} a {p.end}</span>
                      <strong>{p.name}</strong>
                      <span className="aus-programa-host">{p.host}</span>
                    </span>
                    <span className="aus-check" aria-hidden="true">✓</span>
                  </button>
                );
              })}
            </div>
            {sel.auspicio.programas.length === 0 && (
              <p className="aus-aviso">Elige al menos un programa para ver el precio.</p>
            )}

            <div style={{ marginTop: 28 }}>
              <Etiqueta>¿Por cuánto tiempo?</Etiqueta>
              <div className="aus-segmentos" role="radiogroup" aria-label="Plazo del auspicio">
                {plazos.map((pl) => {
                  const on = Number(sel.auspicio.meses) === pl.meses;
                  return (
                    <button key={pl.meses} type="button" role="radio" aria-checked={on} className="aus-segmento" onClick={() => elegirPlazo(pl)}
                      aria-label={`${pl.meses} ${pl.meses === 1 ? "mes" : "meses"}${pl.descuento ? `, ${pl.descuento}% de descuento` : ""}`}>
                      <span className="aus-seg-num">{pl.meses}</span>
                      <span className="aus-seg-uni">{pl.meses === 1 ? "mes" : "meses"}</span>
                      <span className="aus-seg-precio">{fmtCLP(Math.round(baseAuspicio * (1 - pl.descuento / 100)))} al mes</span>
                      {pl.descuento > 0 && <span className="aus-badge">−{pl.descuento}%</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <ul className="aus-incluye">
              {auspicio.componentes.map((comp) => (
                <li key={comp.id}>
                  <b>{comp.cantidadMensual}</b>
                  <span><strong>{comp.label} al mes</strong><small>{comp.detalle}</small></span>
                </li>
              ))}
            </ul>
          </Bloque>

          {/* 02 · Frases */}
          <Bloque indice="02" titulo="Suma frases de" acento="30 segundos"
            bajada="Tu spot grabado suena en la programación. Repartido rota durante todo el día; seleccionado sale en los bloques que tú eliges."
            desde={`Desde ${fmtCLP(Math.min(...(frase?.horarios?.flatMap((h) => h.packs.map((p) => p.precioUnitario)) || [0])))} + IVA por frase`}
            activo={sel.frases.activo}
            onToggle={(v) => accion("frases", { activo: v }, v ? "Frases incluidas: mira los puntos lima en tu día." : "Sacaste las frases.")}>
            <Etiqueta>Horario</Etiqueta>
            <div className="aus-segmentos aus-segmentos-2" role="radiogroup" aria-label="Horario de las frases">
              {(frase?.horarios || []).map((h) => (
                <button key={h.id} type="button" role="radio" aria-checked={horarioFrases?.id === h.id} className="aus-segmento aus-segmento-txt"
                  onClick={() => accion("frases", { horario: h.id }, h.id === "prime" ? "Tú eliges los bloques donde suena tu marca." : "Tus frases rotan durante toda la programación.")}>
                  <span className="aus-seg-titulo">{h.id === "prime" ? "Seleccionado" : "Repartido"}</span>
                  <span className="aus-seg-precio">{h.hint}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: 28 }}>
              <Etiqueta>¿Cuántas?</Etiqueta>
              <div className="aus-packs" role="radiogroup" aria-label="Pack de frases">
                {(horarioFrases?.packs || []).map((p) => (
                  <button key={p.id} type="button" role="radio" aria-checked={packFrases?.id === p.id} className="aus-pack"
                    onClick={() => accion("frases", { pack: p.id }, p.id === "suelta"
                      ? "Frases sueltas: pagas solo las que uses, sin compromiso mensual."
                      : `${p.frases} frases al mes: unas ${Math.round(p.frases / 30)} al día.`)}>
                    <strong>{p.id === "suelta" ? "1+" : p.frases}</strong>
                    <span>{p.id === "suelta" ? "sueltas" : "al mes"}</span>
                    <em>{fmtCLP(p.precioUnitario)} c/u</em>
                  </button>
                ))}
              </div>
            </div>

            <div className="aus-fila">
              {packFrases?.id === "suelta" ? (
                <>
                  <span>¿Cuántas frases?</span>
                  <Contador valor={Number(sel.frases.cantidad) || 1} min={1} max={500} etiqueta="frases" onChange={(v) => accion("frases", { cantidad: v })} />
                </>
              ) : (
                <>
                  <span>¿Por cuántos meses?<small>Las frases de cada pack se pueden usar dentro de 6 meses.</small></span>
                  <Contador valor={Number(sel.frases.meses) || 1} min={1} max={12} etiqueta="meses" onChange={(v) => accion("frases", { meses: v })} />
                </>
              )}
            </div>
          </Bloque>

          {/* 03 · Entrevistas */}
          <Bloque indice="03" titulo="Cuenta tu historia en una" acento="entrevista"
            bajada="Conversación en estudio o por teléfono dentro de los bloques periodísticos. Para voceros, lanzamientos y autoridades."
            desde={`Desde ${fmtCLP(Math.min(...(entrevista?.unidades || []).map((u) => u.precio)))} + IVA`}
            activo={sel.entrevistas.activo}
            onToggle={(v) => accion("entrevistas", { activo: v }, v ? "Entrevista incluida: una conversación en vivo sobre tu marca." : "Sacaste las entrevistas.")}>
            {(entrevista?.unidades || []).map((u) => (
              <div key={u.id} className="aus-fila">
                <span>{u.label}<small>{fmtCLP(u.precio)} + IVA cada una</small></span>
                <Contador valor={Number(sel.entrevistas.cantidades?.[u.id]) || 0} etiqueta={u.label}
                  onChange={(v) => accion("entrevistas", { cantidades: { ...sel.entrevistas.cantidades, [u.id]: v } })} />
              </div>
            ))}
            {entrevista?.permiteDespacho && (
              <div className="aus-fila">
                <span>{entrevista.despachoLabel}<small>{entrevista.despachoDescripcion}</small></span>
                <Interruptor activo={Boolean(sel.entrevistas.despacho)} etiqueta="Despacho en terreno"
                  onChange={(v) => accion("entrevistas", { despacho: v }, v ? "Vamos a terreno: la entrevista sale desde tu local o evento." : "Entrevista en el estudio.")} />
              </div>
            )}
          </Bloque>

          {/* 04 · Podcast */}
          <Bloque indice="04" titulo="Graba tu propio" acento="podcast"
            bajada="Un episodio producido en el estudio de Araucana Digital. Sale por streaming y por la radio, y queda publicado en nuestras plataformas."
            desde={`Desde ${fmtCLP(Math.min(...(podcast?.unidades || []).map((u) => u.precio)))} + IVA por episodio`}
            activo={sel.podcast.activo}
            onToggle={(v) => accion("podcast", { activo: v }, v ? "Podcast incluido: grabas en el estudio del muro verde." : "Sacaste el podcast.")}>
            {(podcast?.unidades || []).map((u) => (
              <div key={u.id} className="aus-fila">
                <span>{u.label}<small>{fmtCLP(u.precio)} + IVA por episodio</small></span>
                <Contador valor={Number(sel.podcast.cantidades?.[u.id]) || 0} etiqueta={u.label}
                  onChange={(v) => accion("podcast", { cantidades: { ...sel.podcast.cantidades, [u.id]: v } })} />
              </div>
            ))}
          </Bloque>

          {/* 05 · Envío */}
          <form ref={formRef} onSubmit={enviar} className="aus-bloque aus-form" data-on noValidate>
            <header className="aus-bloque-head" style={{ cursor: "default" }}>
              <span className="aus-indice" aria-hidden="true">05</span>
              <div>
                <h2 className="aus-h2">Envíanos tu <em>propuesta</em></h2>
                <p className="aus-bajada">Te llega una copia por correo y el equipo comercial te contacta en horario hábil para confirmarla.</p>
              </div>
            </header>
            <div className="aus-bloque-body">
              <div className="aus-resumen-inline">{resumen(true)}</div>

              <div className="aus-campos">
                <label>Nombre *{campo("nombre", { autoComplete: "name", "aria-invalid": intento && errores.nombre })}</label>
                <label>Empresa o marca *{campo("empresa", { autoComplete: "organization", "aria-invalid": intento && errores.empresa })}</label>
                <label>Teléfono o WhatsApp{campo("telefono", { type: "tel", autoComplete: "tel", placeholder: "+56 9", "aria-invalid": intento && errores.contacto })}</label>
                <label>Correo{campo("email", { type: "email", autoComplete: "email", "aria-invalid": intento && (errores.contacto || errores.email) })}</label>
                <label className="aus-ancho">¿Qué quieres promocionar? *
                  <select value={c.tipoPromocion} onChange={(e) => setCliente({ ...c, tipoPromocion: e.target.value })} className="aus-input" aria-invalid={intento && errores.tipo}>
                    <option value="">Elige una opción</option>
                    {OPCIONES_TIPO_PROMOCION.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </label>
                {c.tipoPromocion === "otro" && (
                  <label className="aus-ancho">Cuéntanos qué es *{campo("tipoPromocionOtro", { "aria-invalid": intento && errores.tipo })}</label>
                )}
                <label className="aus-ancho">Comentarios (opcional)
                  <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} rows={3} maxLength={2000} className="aus-input"
                    placeholder="Fechas, campaña, lo que quieras que sepamos" />
                </label>
              </div>

              {intento && (!hayAlgo || !contactoValido) && (
                <p role="alert" className="aus-aviso">
                  {!hayAlgo ? "Arma al menos una opción con precio antes de enviar." :
                    errores.contacto ? "Déjanos un teléfono o un correo para contactarte." :
                    errores.email ? "Revisa el formato del correo." : "Completa los campos marcados con *."}
                </p>
              )}
              {errorEnvio && <p role="alert" className="aus-aviso" style={{ color: "#FFA69B" }}>{errorEnvio}</p>}

              <button type="submit" className="aus-cta" disabled={enviando} style={{ marginTop: 22, width: "100%" }}>
                {enviando ? "Enviando…" : `Enviar propuesta${hayAlgo ? ` · ${fmtCLP(presupuesto.total)}` : ""}`}
              </button>
              <p className="aus-legal">Valores referenciales sujetos a confirmación de Radio Araucana. No se cobra nada al enviar.</p>
            </div>
          </form>
        </div>

        {/* ── Ticket fijo (escritorio) ── */}
        <aside className="aus-lateral" aria-label="Resumen de tu propuesta">
          {resumen(false)}
          <button type="button" className="aus-cta" disabled={!hayAlgo} onClick={irAlFormulario} style={{ width: "100%", marginTop: 18 }}>
            Enviar esta propuesta
          </button>
        </aside>
      </div>

      {/* ── Barra inferior (móvil) ── */}
      {pulso > 0 && <p key={pulso} className="aus-toast" aria-hidden="true">{nota}</p>}
      <div className="aus-barra" data-on={hayAlgo || undefined}>
        <div key={pulso} className="aus-barra-flash" aria-hidden="true" />
        <div className="aus-barra-dia" aria-hidden="true">{dia(true)}</div>
        <div className="aus-barra-fila">
          <div>
            <small>{salidas} salidas al aire · total con IVA</small>
            <Cifra valor={presupuesto.total} className="aus-barra-total" />
          </div>
          <button type="button" className="aus-cta" onClick={irAlFormulario}>Enviar</button>
        </div>
      </div>
    </div>
  );
}

function Resumen({ presupuesto, salidas, nota, pulso, nivel, dia, compacto }) {
  const { lineas, neto, iva, total, mensual, ahorro, ivaTasa } = presupuesto;
  return (
    <div className="aus-ticket" data-compacto={compacto || undefined}>
      <div className="aus-ticket-muro">
        <Muro pulso={pulso} nivel={nivel} celda={30} origen={[0.1, 0.5]} style={{ position: "absolute", inset: 0 }} />
        <div className="aus-ticket-muro-velo" />
        <div className="aus-ticket-cifra">
          <p className="aus-kicker">Tu marca al aire</p>
          <p><Cifra valor={salidas} formato={(n) => n.toLocaleString("es-CL")} className="aus-salidas" /><span>salidas<br />el primer mes</span></p>
        </div>
      </div>

      <div className="aus-ticket-cuerpo">
        <Etiqueta>Un día en la 95.9</Etiqueta>
        {dia}
        <p key={nota} className="aus-nota" aria-live="polite">{nota}</p>

        {lineas.length > 0 && (
          <>
            <ul className="aus-lineas">
              {lineas.map((l) => (
                <li key={l.id}>
                  <div><strong>{l.titulo}</strong><span>{fmtCLP(l.subtotal)}</span></div>
                  <p>{l.meses > 1 ? `${fmtCLP(l.mensual)} al mes × ${l.meses} meses${l.ahorro ? ` · ${l.detalle[l.detalle.length - 1].match(/−\d+%/)?.[0] || ""}` : ""}` : l.detalle[l.detalle.length - 1]}</p>
                </li>
              ))}
            </ul>
            {ahorro > 0 && <p key={ahorro} className="aus-ahorro">Ahorras {fmtCLP(ahorro)} por el plazo</p>}
            <dl className="aus-totales">
              <div><dt>Neto</dt><dd>{fmtCLP(neto)}</dd></div>
              <div><dt>IVA {Math.round(ivaTasa * 100)}%</dt><dd>{fmtCLP(iva)}</dd></div>
            </dl>
            <div className="aus-total">
              <span>Total</span>
              <Cifra valor={total} />
            </div>
            {lineas.some((l) => l.meses > 1) && <p className="aus-mensual">Hasta {fmtCLP(Math.round(mensual * (1 + ivaTasa)))} al mes con IVA</p>}
          </>
        )}
      </div>
    </div>
  );
}

function EstilosAuspicios() {
  const L = "rgba(246,243,238,0.10)";
  return (
    <style>{`
      .aus { background: ${FONDO}; color: ${CREMA}; font-family: 'Open Sans', sans-serif; padding-bottom: 56px;
        --anton: 'Anton', 'Arial Narrow', Impact, sans-serif; --serif: 'Instrument Serif', Georgia, serif; --barlow: 'Barlow Condensed', 'Arial Narrow', sans-serif;
        --salida: cubic-bezier(.16,1,.3,1); }
      .aus em { font-family: var(--serif); font-style: italic; font-weight: 400; color: ${LIMA}; text-transform: none; letter-spacing: -0.01em; }

      @keyframes ausUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }
      @keyframes ausPop { 0% { opacity: 0; transform: scale(0) rotate(45deg); } 70% { transform: scale(1.25) rotate(45deg); } 100% { opacity: 1; transform: scale(1) rotate(45deg); } }
      @keyframes ausGolpe { 0% { transform: scale(1.18); color: ${LIMA}; } 100% { transform: none; } }
      @keyframes ausFlash { from { opacity: .9; transform: scaleX(0); } to { opacity: 0; transform: scaleX(1); } }
      .aus-reveal { animation: ausUp 800ms var(--salida) both; }

      /* ── Hero ── */
      .aus-hero { position: relative; overflow: hidden; min-height: clamp(380px, 52vw, 520px); display: flex; align-items: center; }
      .aus-hero-velo { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(11,22,16,0) 55%, ${FONDO} 100%); }
      .aus-hero-in { position: relative; width: 100%; max-width: 1180px; margin: 0 auto; padding: clamp(28px, 5vw, 56px) clamp(16px, 4vw, 40px); }
      .aus-hero-panel { background: ${PANEL}; border-radius: 22px; padding: clamp(24px, 3.6vw, 44px); max-width: 560px; box-shadow: 10px 12px 0 rgba(4,24,13,0.55); }
      .aus-kicker { font: 700 14px var(--barlow); letter-spacing: 0.2em; text-transform: uppercase; color: ${LIMA}; }
      .aus-h1 { font: 400 clamp(44px, 7vw, 84px)/0.96 var(--anton); text-transform: uppercase; letter-spacing: 0.005em; margin-top: 14px; text-shadow: 3px 4px 0 rgba(4,24,13,0.6); }
      .aus-h1 em { display: block; font-size: 1.12em; line-height: 0.95; margin-top: 0.06em; }
      .aus-hero-texto { font-size: clamp(15px, 1.35vw, 17px); line-height: 1.6; color: rgba(246,243,238,0.82); margin-top: 20px; max-width: 46ch; }
      .aus-hero-datos { display: flex; flex-wrap: wrap; gap: 8px 22px; margin-top: 22px; padding-top: 18px; border-top: 1px solid ${L}; font-size: 13px; color: rgba(246,243,238,0.7); }
      .aus-hero-datos b { font: 400 20px var(--anton); color: ${CREMA}; margin-right: 6px; letter-spacing: 0.01em; }

      /* ── Grilla ── */
      .aus-grid { max-width: 1180px; margin: clamp(20px, 3vw, 36px) auto 0; padding: 0 clamp(16px, 4vw, 40px); display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 36px; align-items: start; }
      .aus-col { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
      .aus-lateral { position: sticky; top: 86px; }
      .aus-resumen-inline { display: none; }

      /* ── Bloques ── */
      .aus-bloque { border: 1px solid ${L}; border-radius: 20px; background: #101F17; transition: border-color 240ms ease, box-shadow 320ms var(--salida), transform 320ms var(--salida); }
      .aus-bloque[data-on] { border-color: rgba(146,189,85,0.5); box-shadow: 8px 9px 0 ${PANEL}; transform: translate(-2px, -2px); }
      .aus-bloque-head { display: flex; gap: 18px; align-items: flex-start; padding: 24px 26px; cursor: pointer; }
      .aus-bloque-body { padding: 4px 26px 28px 88px; animation: ausUp 460ms var(--salida) both; }
      .aus-indice { font: 400 40px/1 var(--anton); color: rgba(246,243,238,0.22); width: 44px; flex-shrink: 0; transition: color 240ms ease; font-variant-numeric: tabular-nums; }
      .aus-bloque[data-on] .aus-indice { color: ${LIMA}; }
      .aus-h2 { font: 400 clamp(24px, 2.6vw, 32px)/1.05 var(--anton); text-transform: uppercase; letter-spacing: 0.01em; }
      .aus-h2 em { font-size: 1.16em; }
      .aus-bajada { font-size: 14px; line-height: 1.55; color: rgba(246,243,238,0.66); margin-top: 8px; max-width: 58ch; }
      .aus-desde { font: 700 15px var(--barlow); letter-spacing: 0.08em; text-transform: uppercase; color: ${VERDE}; margin-top: 10px; }
      .aus-etiqueta { font: 700 14px var(--barlow); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(246,243,238,0.6); margin-bottom: 12px; }
      .aus-aviso { font-size: 13px; color: #E9C46A; margin-top: 14px; }
      .aus-legal { font-size: 12px; color: rgba(246,243,238,0.5); margin-top: 12px; line-height: 1.5; }

      .aus-switch { flex-shrink: 0; width: 52px; height: 30px; border-radius: 99px; border: 1px solid rgba(246,243,238,0.25); background: rgba(246,243,238,0.08); position: relative; cursor: pointer; transition: background-color 220ms ease, border-color 220ms ease; }
      .aus-switch span { position: absolute; top: 3px; left: 3px; width: 22px; height: 22px; border-radius: 6px; background: ${CREMA}; transition: transform 320ms var(--salida), border-radius 320ms ease; }
      .aus-switch[aria-checked="true"] { background: ${VERDE}; border-color: ${VERDE}; }
      .aus-switch[aria-checked="true"] span { transform: translateX(22px) rotate(90deg); background: ${PANEL}; }
      .aus :is(button, input, select, textarea):focus-visible { outline: 2px solid ${LIMA}; outline-offset: 3px; }

      /* ── Programas ── */
      .aus-programas { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
      .aus-programa { position: relative; display: flex; align-items: center; gap: 14px; text-align: left; padding: 12px 40px 12px 12px; border-radius: 14px; border: 1px solid ${L}; background: rgba(246,243,238,0.035); color: ${CREMA}; cursor: pointer; font-family: inherit;
        transition: transform 260ms var(--salida), box-shadow 260ms var(--salida), border-color 200ms ease, background-color 200ms ease; animation: ausUp 600ms var(--salida) both; }
      .aus-programa:hover { border-color: rgba(146,189,85,0.55); transform: translate(-1px, -1px); box-shadow: 3px 3px 0 ${PANEL}; }
      .aus-programa:active { transform: translate(1px, 1px); box-shadow: none; }
      .aus-retrato { width: 58px; height: 58px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: ${PROFUNDO}; display: grid; place-items: center; }
      .aus-retrato img { width: 100%; height: 100%; object-fit: cover; filter: grayscale(1) contrast(1.05); transition: filter 320ms ease, transform 420ms var(--salida); }
      .aus-retrato b { font: 400 20px var(--anton); color: ${CREMA}; }
      .aus-programa-txt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .aus-programa-hora { font: 700 14px var(--barlow); letter-spacing: 0.08em; color: ${LIMA}; font-variant-numeric: tabular-nums; }
      .aus-programa strong { font: 400 19px/1.1 var(--anton); text-transform: uppercase; letter-spacing: 0.01em; }
      .aus-programa-host { font-size: 12px; color: rgba(246,243,238,0.6); }
      .aus-check { position: absolute; top: 12px; right: 12px; width: 22px; height: 22px; border-radius: 6px; border: 1px solid rgba(246,243,238,0.25); display: grid; place-items: center; font-size: 12px; font-weight: 800; color: transparent; transition: background-color 200ms ease, transform 320ms var(--salida); }
      .aus-programa[aria-pressed="true"] { border-color: ${LIMA}; background: rgba(82,184,112,0.16); transform: translate(-3px, -3px); box-shadow: 6px 6px 0 ${PROFUNDO}; }
      .aus-programa[aria-pressed="true"] img { filter: none; transform: scale(1.08); }
      .aus-programa[aria-pressed="true"] .aus-check { background: ${LIMA}; border-color: ${LIMA}; color: ${PANEL}; transform: scale(1.12); }

      /* ── Segmentos y packs ── */
      .aus-segmentos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
      .aus-segmentos-2 { grid-template-columns: repeat(2, 1fr); }
      .aus-segmento, .aus-pack { position: relative; border-radius: 14px; border: 1px solid ${L}; background: rgba(246,243,238,0.035); color: ${CREMA}; cursor: pointer; font-family: inherit;
        transition: transform 260ms var(--salida), box-shadow 260ms var(--salida), border-color 200ms ease, background-color 200ms ease; }
      .aus-segmento { display: grid; grid-template-columns: auto 1fr; align-items: baseline; column-gap: 8px; text-align: left; padding: 14px 16px; }
      .aus-segmento-txt { display: flex; flex-direction: column; gap: 4px; }
      .aus-seg-num { font: 400 38px/1 var(--anton); font-variant-numeric: tabular-nums; }
      .aus-seg-uni { font: 700 15px var(--barlow); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(246,243,238,0.7); }
      .aus-seg-titulo { font: 400 22px/1 var(--anton); text-transform: uppercase; }
      .aus-seg-precio { grid-column: 1 / -1; font-size: 13px; color: rgba(246,243,238,0.7); margin-top: 6px; font-variant-numeric: tabular-nums; }
      .aus-badge { position: absolute; top: -9px; right: 10px; font: 700 14px var(--barlow); letter-spacing: 0.04em; color: ${PANEL}; background: ${LIMA}; border-radius: 6px; padding: 2px 8px; }
      .aus-packs { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
      .aus-pack { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 14px 4px 12px; }
      .aus-pack strong { font: 400 30px/1 var(--anton); font-variant-numeric: tabular-nums; }
      .aus-pack span { font: 700 13px var(--barlow); letter-spacing: 0.1em; text-transform: uppercase; color: rgba(246,243,238,0.6); }
      .aus-pack em { font: 600 12px 'Open Sans', sans-serif; font-style: normal; color: ${VERDE}; margin-top: 6px; font-variant-numeric: tabular-nums; letter-spacing: 0; }
      :is(.aus-segmento, .aus-pack):hover { border-color: rgba(146,189,85,0.55); transform: translate(-1px, -1px); box-shadow: 3px 3px 0 ${PANEL}; }
      :is(.aus-segmento, .aus-pack):active { transform: translate(1px, 1px); box-shadow: none; }
      :is(.aus-segmento, .aus-pack)[aria-checked="true"] { border-color: ${LIMA}; background: rgba(82,184,112,0.16); transform: translate(-3px, -3px); box-shadow: 6px 6px 0 ${PROFUNDO}; }

      .aus-fila { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 16px 0; border-top: 1px solid ${L}; margin-top: 22px; font-size: 15px; }
      .aus-fila + .aus-fila { margin-top: 0; }
      .aus-bloque-body > .aus-fila:first-child { margin-top: 0; border-top: 0; padding-top: 4px; }
      .aus-fila small { display: block; font-size: 12px; color: rgba(246,243,238,0.55); margin-top: 3px; line-height: 1.45; }
      .aus-stepper { display: inline-flex; align-items: center; border: 1px solid rgba(246,243,238,0.2); border-radius: 12px; flex-shrink: 0; overflow: hidden; }
      .aus-stepper button { width: 42px; height: 42px; border: 0; background: transparent; color: ${CREMA}; font-size: 20px; cursor: pointer; transition: background-color 140ms ease; }
      .aus-stepper button:hover:not(:disabled) { background: rgba(146,189,85,0.22); }
      .aus-stepper button:disabled { opacity: 0.3; cursor: default; }
      .aus-stepper output { display: block; min-width: 46px; text-align: center; font: 400 24px/1 var(--anton); font-variant-numeric: tabular-nums; animation: ausGolpe 320ms var(--salida); }

      .aus-incluye { list-style: none; margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .aus-incluye li { display: flex; gap: 12px; align-items: flex-start; }
      .aus-incluye b { font: 400 34px/0.9 var(--anton); color: ${LIMA}; font-variant-numeric: tabular-nums; }
      .aus-incluye strong { display: block; font-size: 14px; font-weight: 700; }
      .aus-incluye small { display: block; font-size: 12px; color: rgba(246,243,238,0.6); margin-top: 2px; line-height: 1.45; }

      /* ── Ticket ── */
      .aus-ticket { border-radius: 22px; overflow: hidden; background: ${PANEL}; box-shadow: 9px 10px 0 rgba(4,24,13,0.6); }
      .aus-ticket-muro { position: relative; height: 138px; }
      .aus-ticket-muro-velo { position: absolute; inset: 0; background: linear-gradient(90deg, ${PANEL} 30%, rgba(10,61,35,0.55) 62%, rgba(10,61,35,0) 100%); }
      .aus-ticket-cifra { position: relative; padding: 20px 24px; }
      .aus-ticket-cifra p + p { display: flex; align-items: flex-end; gap: 10px; margin-top: 6px; }
      .aus-salidas { font: 400 68px/0.95 var(--anton); color: ${CREMA}; text-shadow: 3px 3px 0 rgba(4,24,13,0.55); }
      .aus-ticket-cifra p + p > span:last-child { font: 700 14px/1.15 var(--barlow); letter-spacing: 0.12em; text-transform: uppercase; color: rgba(246,243,238,0.85); padding-bottom: 8px; }
      .aus-ticket-cuerpo { padding: 20px 24px 24px; }

      .aus-dia { position: relative; }
      .aus-dia-pista { position: relative; height: 40px; }
      .aus-dia-prog { position: absolute; top: 0; bottom: 0; border-radius: 6px; background: rgba(246,243,238,0.07); box-shadow: inset 0 -4px 0 rgba(4,24,13,0.35); transition: background-color 320ms ease, transform 420ms var(--salida), box-shadow 320ms ease; }
      .aus-dia-prog[data-on] { background: ${PROFUNDO}; transform: translateY(-5px); box-shadow: inset 0 0 0 1.5px ${LIMA}, 0 5px 0 rgba(4,24,13,0.5); }
      .aus-dia-prog i, .aus-dia-tanda i, .aus-dia-leyenda i { position: absolute; width: 7px; height: 7px; margin-left: -3.5px; transform: rotate(45deg); animation: ausPop 420ms var(--salida) both; }
      .aus-dia-prog i { top: 50%; margin-top: -5px; }
      .aus-dia i[data-tipo="mencion"] { background: ${CREMA}; }
      .aus-dia i[data-tipo="frase"] { background: ${LIMA}; }
      .aus-dia-tanda { position: relative; height: 16px; margin-top: 6px; border-bottom: 1px solid ${L}; }
      .aus-dia-tanda i { top: 2px; background: ${LIMA}; }
      .aus-dia-horas { position: relative; height: 16px; margin-top: 4px; }
      .aus-dia-horas span { position: absolute; transform: translateX(-50%); font: 600 12px var(--barlow); letter-spacing: 0.06em; color: rgba(246,243,238,0.5); font-variant-numeric: tabular-nums; }
      .aus-dia-horas span:first-child { transform: none; } .aus-dia-horas span:last-child { transform: translateX(-100%); }
      .aus-dia-leyenda { display: flex; gap: 16px; margin-top: 8px; font-size: 12px; color: rgba(246,243,238,0.65); }
      .aus-dia-leyenda span { display: inline-flex; align-items: center; gap: 8px; }
      .aus-dia-leyenda i { position: static; margin: 0; animation: none; }

      .aus-nota { margin-top: 16px; padding: 12px 14px; border-radius: 10px; background: rgba(246,243,238,0.07); font-size: 13px; line-height: 1.5; color: rgba(246,243,238,0.9); animation: ausUp 420ms var(--salida) both; min-height: 44px; }
      .aus-lineas { list-style: none; display: grid; gap: 14px; margin-top: 18px; padding-bottom: 16px; border-bottom: 1px solid ${L}; }
      .aus-lineas li { animation: ausUp 420ms var(--salida) both; }
      .aus-lineas li > div { display: flex; justify-content: space-between; gap: 12px; align-items: baseline; font-size: 14px; }
      .aus-lineas strong { font-weight: 700; } .aus-lineas li > div span { font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap; }
      .aus-lineas p { font-size: 12px; color: rgba(246,243,238,0.6); line-height: 1.5; margin-top: 3px; font-variant-numeric: tabular-nums; }
      .aus-ahorro { display: inline-block; margin-top: 14px; padding: 4px 10px; border-radius: 6px; background: ${LIMA}; color: ${PANEL}; font: 700 15px var(--barlow); letter-spacing: 0.06em; text-transform: uppercase; animation: ausUp 420ms var(--salida) both; }
      .aus-totales { margin-top: 14px; display: grid; gap: 6px; font-size: 13px; color: rgba(246,243,238,0.7); }
      .aus-totales div { display: flex; justify-content: space-between; } .aus-totales dd { font-variant-numeric: tabular-nums; }
      .aus-total { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-top: 12px; }
      .aus-total > span:first-child { font: 700 15px var(--barlow); letter-spacing: 0.16em; text-transform: uppercase; color: rgba(246,243,238,0.8); }
      .aus-total > span:last-child { font: 400 44px/1 var(--anton); letter-spacing: 0.005em; }
      .aus-mensual { font-size: 12px; color: rgba(246,243,238,0.6); text-align: right; margin-top: 6px; font-variant-numeric: tabular-nums; }

      .aus-cta { border: 0; border-radius: 14px; padding: 16px 22px; background: ${LIMA}; color: ${PANEL}; font: 400 20px/1 var(--anton); text-transform: uppercase; letter-spacing: 0.04em; cursor: pointer; box-shadow: 0 6px 0 ${PROFUNDO};
        transition: transform 160ms var(--salida), box-shadow 160ms var(--salida), background-color 160ms ease; font-variant-numeric: tabular-nums; }
      .aus-cta:hover:not(:disabled) { background: #A6D062; transform: translateY(-2px); box-shadow: 0 8px 0 ${PROFUNDO}; }
      .aus-cta:active:not(:disabled) { transform: translateY(5px); box-shadow: 0 1px 0 ${PROFUNDO}; }
      .aus-cta:disabled { opacity: 0.4; cursor: default; }

      /* ── Formulario ── */
      .aus-form { scroll-margin-top: 90px; }
      .aus-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      .aus-campos label { display: flex; flex-direction: column; gap: 7px; font-size: 13px; font-weight: 600; color: rgba(246,243,238,0.8); }
      .aus-ancho { grid-column: 1 / -1; }
      .aus .aus-input { width: 100%; padding: 13px 14px; border-radius: 10px; border: 1px solid rgba(246,243,238,0.2); background: rgba(4,24,13,0.45); color: ${CREMA}; font: 400 16px 'Open Sans', sans-serif; transition: border-color 160ms ease; }
      .aus .aus-input::placeholder { color: rgba(246,243,238,0.4); }
      .aus select.aus-input option { background: #10241A; color: ${CREMA}; }
      .aus .aus-input[aria-invalid="true"] { border-color: #E9C46A !important; }

      .aus-barra, .aus-toast { display: none; }
      .aus-dia[data-mini] .aus-dia-pista { height: 16px; }
      .aus-dia[data-mini] .aus-dia-prog { border-radius: 4px; box-shadow: none; }
      .aus-dia[data-mini] .aus-dia-prog[data-on] { transform: translateY(-2px); box-shadow: inset 0 0 0 1.5px ${LIMA}; }
      .aus-dia[data-mini] .aus-dia-prog i { width: 5px; height: 5px; margin-top: -2.5px; margin-left: -2.5px; }
      .aus-dia[data-mini] .aus-dia-tanda { height: 10px; margin-top: 3px; border: 0; }
      .aus-dia[data-mini] .aus-dia-tanda i { width: 5px; height: 5px; top: 1px; }
      @keyframes ausToast { 0% { opacity: 0; transform: translateY(12px); } 10%, 82% { opacity: 1; transform: none; } 100% { opacity: 0; transform: translateY(6px); } }

      @media (max-width: 960px) {
        .aus-grid { grid-template-columns: 1fr; }
        .aus-lateral { display: none; }
        .aus-resumen-inline { display: block; margin-bottom: 24px; }
        .aus-resumen-inline .aus-ticket { box-shadow: none; border: 1px solid ${L}; }
        .aus { padding-bottom: 140px; }
        .aus-barra { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; display: block; padding: 10px 16px calc(12px + env(safe-area-inset-bottom)); background: ${PANEL}; border-top: 1px solid rgba(146,189,85,0.4); transform: translateY(110%); transition: transform 420ms var(--salida); overflow: hidden; }
        .aus-barra[data-on] { transform: none; }
        .aus-barra-flash { position: absolute; left: 0; right: 0; top: 0; height: 3px; background: ${LIMA}; transform-origin: left; animation: ausFlash 700ms var(--salida) both; }
        .aus-barra-fila { display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 6px; }
        .aus-toast { display: block; position: fixed; left: 12px; right: 12px; bottom: calc(118px + env(safe-area-inset-bottom)); z-index: 19; padding: 12px 14px; border-radius: 12px; background: ${CREMA}; color: ${PANEL}; font-size: 13px; font-weight: 600; line-height: 1.45; box-shadow: 4px 5px 0 rgba(4,24,13,0.6); pointer-events: none; animation: ausToast 3200ms var(--salida) both; }
        .aus-barra small { display: block; font: 700 12px var(--barlow); letter-spacing: 0.12em; text-transform: uppercase; color: rgba(246,243,238,0.7); }
        .aus-barra-total { font: 400 28px/1.1 var(--anton); }
        .aus-barra .aus-cta { padding: 13px 22px; font-size: 18px; }
      }
      @media (max-width: 640px) {
        .aus-hero-panel { box-shadow: 6px 7px 0 rgba(4,24,13,0.55); }
        .aus-bloque-head { padding: 20px 16px; gap: 12px; }
        .aus-bloque-body { padding: 0 16px 22px; }
        .aus-indice { font-size: 28px; width: 30px; }
        .aus-bloque[data-on] { box-shadow: 5px 6px 0 ${PANEL}; }
        .aus-programas { grid-template-columns: 1fr; }
        .aus-segmentos { grid-template-columns: 1fr; }
        .aus-segmentos-2 { grid-template-columns: 1fr 1fr; }
        .aus-packs { grid-template-columns: repeat(3, 1fr); }
        .aus-incluye { grid-template-columns: 1fr; }
        .aus-campos { grid-template-columns: 1fr; }
        .aus-fila { font-size: 14px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .aus *, .aus *::before { animation: none !important; transition: none !important; }
      }
    `}</style>
  );
}
