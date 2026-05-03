import React, { useState, useEffect, createContext, useContext } from "react";
import { Menu, X, Play, Pause, Volume2, VolumeX, Share2 } from "lucide-react";
import defaultContent from "./src/content/site.json";

/* ─── Editable content ────────────────────────────────────────────────────── */
const SiteContentContext = createContext(defaultContent);
const useSiteContent = () => useContext(SiteContentContext);

/* ─── Brand palette (Radio La Frontera) ───────────────────────────────────── */
const F = {
  green:     "#4EA552",
  greenMid:  "#56AF57",
  lime:      "#92BD55",
  yellow:    "#D0DA51",
  bgDeep:    "#0d2410",
  bgMid:     "#13321a",
  bgSoft:    "#1a3a1e",
  cream:     "#f6f5ee",
  ink:       "#0a1f0d",
};

/* ─── Social SVGs ─────────────────────────────────────────────────────────── */
const SvgInstagram = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
const SvgYoutube  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const SvgFacebook = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;

const SOC_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/araucanaradio", Icon: SvgInstagram },
  { label: "YouTube",   href: "https://www.youtube.com/@araucanafm",      Icon: SvgYoutube  },
  { label: "Facebook",  href: "https://www.facebook.com/share/1aK6itN6zP/?mibextid=wwXIfr", Icon: SvgFacebook },
];

/* ─── Global Styles ───────────────────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Montserrat', sans-serif; background: ${F.bgDeep}; overscroll-behavior-y: none; }
    html { scroll-behavior: smooth; background: ${F.bgDeep}; overscroll-behavior-y: none; }
    section[id], footer[id] { scroll-margin-top: 80px; }

    @keyframes livePulse  { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }
    @keyframes waveform   { from { transform: scaleY(0.25); } to { transform: scaleY(1); } }
    @keyframes fadeInUp   { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes signalRing { 0% { transform: scale(0.4); opacity: 0.7; } 100% { transform: scale(2.6); opacity: 0; } }

    .live-dot      { animation: livePulse 1.5s ease-in-out infinite; }
    .wave-bar      { animation: waveform 0.8s ease-in-out alternate infinite; transform-origin: bottom; }

    .fiu-0 { animation: fadeInUp 0.6s ease forwards 0s;    opacity: 0; }
    .fiu-1 { animation: fadeInUp 0.6s ease forwards 0.15s; opacity: 0; }
    .fiu-2 { animation: fadeInUp 0.6s ease forwards 0.3s;  opacity: 0; }
    .fiu-3 { animation: fadeInUp 0.6s ease forwards 0.45s; opacity: 0; }
    .fiu-4 { animation: fadeInUp 0.6s ease forwards 0.6s;  opacity: 0; }

    .prog-card  { transition: transform 200ms ease, border-color 200ms ease; }
    .prog-card:hover { transform: scale(1.02); border-color: ${F.lime} !important; }

    .cta-btn   { transition: background 150ms ease, color 150ms ease, transform 120ms ease; }
    .cta-btn:hover { background: ${F.lime} !important; color: ${F.ink} !important; transform: translateY(-1px); }

    .ghost-btn { transition: background 150ms ease, color 150ms ease; }
    .ghost-btn:hover { background: ${F.lime} !important; color: ${F.ink} !important; }

    .nav-link { transition: color 150ms ease; }
    .nav-link:hover { color: ${F.lime} !important; }

    .footer-link { transition: color 150ms ease; }
    .footer-link:hover { color: ${F.lime} !important; }

    .social-icon-btn { transition: background 200ms ease, border-color 200ms ease; }
    .social-icon-btn:hover { background: ${F.green} !important; border-color: ${F.green} !important; }

    ::-webkit-scrollbar { height: 4px; }
    ::-webkit-scrollbar-track { background: ${F.bgDeep}; }
    ::-webkit-scrollbar-thumb { background: ${F.green}; border-radius: 2px; }
  `}</style>
);

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const K = (style) => ({ fontFamily: "'Montserrat', sans-serif", ...style });

const Waveform = ({ color = F.lime, height = 24 }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
    {[0, 0.1, 0.2, 0.3, 0.4].map((d, i) => (
      <div key={i} className="wave-bar"
        style={{ width: 4, height, background: color, borderRadius: 2, animationDelay: `${d}s` }} />
    ))}
  </div>
);

/* ─── Navbar ──────────────────────────────────────────────────────────────── */
const NAV_LINKS = [
  { label: "Inicio",          href: "#inicio" },
  { label: "Programación",    href: "#programacion" },
  { label: "Historia",        href: "#historia" },
  { label: "Contacto",        href: "#contacto" },
  { label: "Radio Araucana",  href: "/" },
];

function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav style={{ background: F.bgDeep, height: 64, position: "sticky", top: 0, zIndex: 1000, borderBottom: `1px solid ${F.bgSoft}` }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", height: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px" }}>
        <a href="#inicio" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
          <img src="/frontera-logo-white.svg" alt="Radio La Frontera" style={{ height: 38, width: "auto", display: "block" }} />
        </a>

        <div className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="nav-link"
              style={K({ fontWeight: 500, fontSize: 14, color: "#fff", textDecoration: "none" })}>
              {l.label}
            </a>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className="live-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: F.lime }} />
            <span style={K({ fontWeight: 700, fontSize: 13, color: F.lime, textTransform: "uppercase", letterSpacing: "0.1em" })}>EN VIVO</span>
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden"
            style={{ background: "none", border: "none", cursor: "pointer", color: "#fff" }}>
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden" style={{ background: F.bgDeep, borderTop: `1px solid ${F.bgSoft}`, padding: "8px 24px 16px" }}>
          {NAV_LINKS.map((l) => (
            <a key={l.label} href={l.href} onClick={() => setOpen(false)}
              style={K({ display: "block", fontWeight: 500, fontSize: 16, color: "#fff", textDecoration: "none", padding: "12px 0", borderBottom: `1px solid ${F.bgSoft}` })}>
              {l.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}

/* ─── Hero ────────────────────────────────────────────────────────────────── */
function Hero({ playing, toggle }) {
  const { frontera } = useSiteContent();
  return (
    <section id="inicio" style={{
      background: `linear-gradient(160deg, ${F.bgDeep} 0%, ${F.bgMid} 60%, ${F.ink} 100%)`,
      padding: "clamp(60px, 8vw, 120px) 24px",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(208,218,81,0.04) 0px, rgba(208,218,81,0.04) 1px, transparent 1px, transparent 28px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div className="fiu-0" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div className="live-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: F.lime }} />
              <span style={K({ fontWeight: 600, fontSize: 12, color: F.lime, textTransform: "uppercase", letterSpacing: "0.14em" })}>
                TRANSMITIENDO EN VIVO · 1110 AM
              </span>
            </div>

            <div className="fiu-1">
              <img src="/frontera-logo.svg" alt="Radio La Frontera — La Primera del Sur de Chile"
                style={{ width: "100%", maxWidth: 460, height: "auto", display: "block" }} />
            </div>

            <p className="fiu-2" style={K({ fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.65, maxWidth: 460 })}>
              {frontera?.intro}
            </p>

            <div className="fiu-3" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button className="cta-btn" onClick={toggle} style={K({
                background: playing ? F.lime : "transparent",
                color: playing ? F.ink : F.lime,
                fontWeight: 700, fontSize: 15, padding: "16px 28px", borderRadius: 3,
                border: `2px solid ${F.lime}`, cursor: "pointer",
                letterSpacing: "0.05em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 10,
              })}>
                {playing ? <Pause size={16} /> : <Play size={16} fill={playing ? F.ink : F.lime} />}
                {playing ? "En vivo — pausar" : "Escuchar 1110 AM"}
              </button>
            </div>
          </div>

          <div className="fiu-4" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "relative", width: "min(440px, 100%)", aspectRatio: "1/1", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {[0, 0.6, 1.2].map((delay, i) => (
                <div key={i} style={{
                  position: "absolute", inset: 0, borderRadius: "50%",
                  border: `1px solid rgba(146,189,85,0.5)`,
                  animation: `signalRing 2.8s ease-out ${delay}s infinite`,
                  pointerEvents: "none",
                }} />
              ))}
              <div style={{
                position: "relative",
                width: "78%", aspectRatio: "1/1", borderRadius: "50%",
                overflow: "hidden",
                border: `3px solid ${F.lime}`,
                boxShadow: `0 0 60px rgba(146,189,85,0.35)`,
              }}>
                <img
                  src="/frontera-familia-radio.jpg"
                  alt="Familia chilena escuchando Radio La Frontera 1110 AM en Temuco"
                  loading="eager"
                  decoding="async"
                  style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

/* ─── Schedule ────────────────────────────────────────────────────────────── */
const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function getCurrentProgram(programs) {
  const parts = new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    weekday: "short", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const h = Number(parts.find(p => p.type === "hour").value);
  const m = Number(parts.find(p => p.type === "minute").value);
  const cur = h * 60 + m;
  const dayMap = { dom: 0, lun: 1, mar: 2, mié: 3, mie: 3, jue: 4, vie: 5, sáb: 6, sab: 6 };
  const wkRaw = (parts.find(p => p.type === "weekday")?.value || "").toLowerCase().replace(/\.$/, "");
  const today = dayMap[wkRaw] ?? new Date().getDay();
  return (programs || []).findIndex(p => {
    const days = p.days || [1, 2, 3, 4, 5];
    return days.includes(today) && cur >= toMinutes(p.start) && cur < toMinutes(p.end);
  });
}

function ProgramSchedule() {
  const { frontera } = useSiteContent();
  const PROGRAMS = frontera?.programs || [];
  const [activeIdx, setActiveIdx] = useState(() => getCurrentProgram(PROGRAMS));

  React.useEffect(() => {
    setActiveIdx(getCurrentProgram(PROGRAMS));
    const id = setInterval(() => setActiveIdx(getCurrentProgram(PROGRAMS)), 60_000);
    return () => clearInterval(id);
  }, [PROGRAMS]);

  return (
    <section id="programacion" style={{ background: F.cream, padding: "72px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ borderLeft: `4px solid ${F.green}`, paddingLeft: 14, marginBottom: 36 }}>
          <p style={K({ fontWeight: 600, fontSize: 12, color: F.green, textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 })}>1110 AM</p>
          <h2 style={K({ fontWeight: 800, fontSize: "clamp(26px, 3.5vw, 36px)", color: F.ink, letterSpacing: "0.01em" })}>
            Programación de hoy
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {PROGRAMS.map((p, i) => {
            const active = i === activeIdx;
            return (
              <article key={i} className="prog-card" style={{
                padding: "20px 22px", borderRadius: 6,
                border: active ? `2px solid ${F.green}` : `1px solid #d9d6c4`,
                background: active ? F.green : "#fff",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 16, flexWrap: "wrap", marginBottom: 8 }}>
                  <h3 style={K({ fontWeight: 800, fontSize: 19, color: active ? "#fff" : F.ink, lineHeight: 1.25, margin: 0 })}>{p.name}</h3>
                  {active && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                      <span style={K({ fontWeight: 700, fontSize: 11, color: "#fff", letterSpacing: "0.1em", textTransform: "uppercase" })}>En vivo</span>
                    </span>
                  )}
                </div>
                <p style={K({ fontWeight: 700, fontSize: 12, color: active ? "rgba(255,255,255,0.95)" : F.green, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 })}>
                  {p.host} · {p.start} a {p.end} hrs.
                </p>
                {p.description && (
                  <p style={K({ fontWeight: 400, fontSize: 14, color: active ? "rgba(255,255,255,0.88)" : "#4b5563", lineHeight: 1.6 })}>
                    {p.description}
                  </p>
                )}
              </article>
            );
          })}
        </div>

        {activeIdx === -1 && (
          <p style={K({ fontWeight: 400, fontSize: 14, color: "#6b7280", marginTop: 20, fontStyle: "italic" })}>
            Fuera de los horarios destacados suena nuestra programación musical continua.
          </p>
        )}
      </div>
    </section>
  );
}

/* ─── History ─────────────────────────────────────────────────────────────── */
function History() {
  const { frontera } = useSiteContent();
  const paragraphs = frontera?.history || [];
  const photo = frontera?.foundingPhoto;
  const photoCaption = frontera?.foundingPhotoCaption;

  return (
    <section id="historia" style={{ background: F.bgDeep, padding: "80px 24px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(146,189,85,0.04) 0px, rgba(146,189,85,0.04) 1px, transparent 1px, transparent 32px)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 880, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
          <span style={K({ fontWeight: 900, fontSize: "clamp(48px, 7vw, 84px)", color: F.yellow, letterSpacing: "-0.02em", lineHeight: 1 })}>1939</span>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, ${F.lime}, transparent)` }} />
        </div>

        <h2 style={K({ fontWeight: 800, fontSize: "clamp(24px, 3.5vw, 38px)", color: "#fff", lineHeight: 1.15, marginBottom: 32 })}>
          Más de <span style={{ color: F.lime }}>85 años</span> en el aire del sur de Chile
        </h2>

        {photo && (
          <figure style={{ margin: "0 0 28px 24px", padding: 0, float: "right", width: "min(280px, 38%)", clear: "right" }}>
            <div style={{ borderRadius: 4, overflow: "hidden", border: `1px solid rgba(146,189,85,0.2)`, boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
              <img
                src={photo}
                alt="Inauguración de Radio La Frontera, octubre de 1939, con Simón y Daniel De Mayo y el equipo fundador"
                style={{ display: "block", width: "100%", height: "auto", filter: "sepia(0.1) contrast(1.04)" }}
              />
            </div>
            <figcaption style={K({ fontWeight: 400, fontSize: 11.5, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, marginTop: 8, fontStyle: "italic" })}>
              {photoCaption}
            </figcaption>
          </figure>
        )}

        {paragraphs.map((p, i) => (
          <p key={i} style={K({ fontWeight: 300, fontSize: 16, color: "rgba(255,255,255,0.72)", lineHeight: 1.75, marginBottom: 20 })}>
            {p}
          </p>
        ))}

        <div style={{ clear: "both", marginTop: 32, padding: "18px 22px", borderLeft: `3px solid ${F.lime}`, background: "rgba(146,189,85,0.06)", borderRadius: "0 4px 4px 0" }}>
          <p style={K({ fontWeight: 600, fontSize: 14, color: F.lime, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 4 })}>La Primera del Sur de Chile</p>
          <p style={K({ fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)" })}>
            Hoy parte del Grupo Radios Araucana y La Frontera.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
const FOOTER_COTIZA_MSG = "Hola, me gustaría cotizar una pauta publicitaria en Radio La Frontera 1110 AM. ¿Podrían enviarme información de tarifas y formatos disponibles?";

function Footer() {
  const { settings: SETTINGS } = useSiteContent();
  return (
    <footer id="contacto" style={{ background: F.ink, padding: "64px 24px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">

          <div>
            <div style={{ marginBottom: 20 }}>
              <img src="/frontera-logo-white.svg" alt="Radio La Frontera" style={{ height: 56, width: "auto", display: "block" }} />
            </div>
            <p style={K({ fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8, lineHeight: 1.6 })}>
              Radio La Frontera 1110 AM<br />Pionera en las comunicaciones del Sur de Chile.
            </p>
            <p style={K({ fontWeight: 600, fontSize: 13, color: F.lime, marginBottom: 24 })}>Desde 1939 · Más de 85 años en el aire</p>

            <div style={{ marginBottom: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <p style={K({ fontWeight: 400, fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.1em" })}>Parte del grupo</p>
              <a href="/" style={K({ display: "inline-block", fontWeight: 700, fontSize: 16, color: "#fff", textDecoration: "none" })}>
                Radio Araucana 95.9 FM →
              </a>
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 24 }}>
              {SOC_LINKS.map(({ label, href, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer me"
                  aria-label={`Radio La Frontera en ${label}`}
                  className="social-icon-btn"
                  style={{ width: 36, height: 36, borderRadius: "50%", border: `1px solid rgba(146,189,85,0.5)`, background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", textDecoration: "none" }}>
                  <Icon />
                </a>
              ))}
            </div>

            <p style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 })}>{SETTINGS.address}</p>
            <a href={`mailto:${SETTINGS.contactEmail}`} style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 4, textDecoration: "none" })}>✉ {SETTINGS.contactEmail}</a>
          </div>

          <div>
            <h4 style={K({ fontWeight: 500, fontSize: 13, color: "#fff", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 14 })}>Navegación</h4>
            <a href="#inicio" className="footer-link" style={K({ display: "block", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: 10 })}>Inicio</a>
            <a href="#programacion" className="footer-link" style={K({ display: "block", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: 10 })}>Programación</a>
            <a href="#historia" className="footer-link" style={K({ display: "block", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: 10 })}>Historia</a>
            <a href="/" className="footer-link" style={K({ display: "block", fontWeight: 300, fontSize: 14, color: "rgba(255,255,255,0.6)", textDecoration: "none", marginBottom: 24 })}>Radio Araucana 95.9 FM</a>

            <div style={{ borderTop: `1px solid ${F.bgSoft}`, paddingTop: 16 }}>
              <p style={K({ fontWeight: 600, fontSize: 13, color: F.lime, marginBottom: 12 })}>Para contratar publicidad:</p>
              <p style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 4 })}>📞 {SETTINGS.adminPhone}</p>
              <a href={`mailto:${SETTINGS.adminEmail}`} style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 4, textDecoration: "none" })}>✉ {SETTINGS.adminEmail}</a>
              <p style={K({ fontWeight: 300, fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 0 })}>🕘 {SETTINGS.adminHours}</p>
              <a
                href={`https://wa.me/${SETTINGS.whatsappNumber}?text=${encodeURIComponent(FOOTER_COTIZA_MSG)}`}
                target="_blank" rel="noreferrer"
                className="ghost-btn"
                style={K({ display: "inline-block", marginTop: 14, padding: "10px 18px", border: `2px solid ${F.lime}`, color: F.lime, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em", textDecoration: "none", borderRadius: 3 })}>
                Cotiza tu publicidad
              </a>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${F.bgSoft}`, padding: "20px 0", textAlign: "center" }}>
          <p style={K({ fontWeight: 300, fontSize: 12, color: "rgba(255,255,255,0.4)" })}>
            © 2026 Radios Araucana y La Frontera · Caupolicán 110, Temuco · Todos los derechos reservados
          </p>
        </div>
      </div>
    </footer>
  );
}

/* ─── WhatsApp Widget ─────────────────────────────────────────────────────── */
const SvgWhatsApp = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

function WhatsAppWidget() {
  const { settings } = useSiteContent();
  const WA_NUMBER = settings.whatsappNumber;
  const msg = "Hola Radio La Frontera, tengo una consulta y me gustaría que me ayuden.";
  const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

  return (
    <a href={url} target="_blank" rel="noreferrer"
      aria-label="Chatea por WhatsApp con Radio La Frontera"
      style={{
        position: "fixed", bottom: 88, right: 20, zIndex: 9997,
        width: 56, height: 56, borderRadius: "50%",
        background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", boxShadow: "0 4px 18px rgba(37,211,102,0.35)",
        textDecoration: "none",
      }}>
      <SvgWhatsApp size={28} />
    </a>
  );
}

/* ─── Floating Player ─────────────────────────────────────────────────────── */
function FloatingPlayer({ playing, toggle }) {
  const [muted, setMuted] = useState(false);

  const toggleMute = () => {
    const audio = document.querySelector("audio");
    if (audio) audio.muted = !muted;
    setMuted(!muted);
  };

  const share = () => {
    const text = `Escucha Radio La Frontera 1110 AM en vivo: https://radioaraucana.cl/frontera`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noreferrer");
  };

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: F.bgDeep, borderTop: `2px solid ${F.green}`,
      height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px"
    }}>
      <div className="hidden sm:flex" style={{ alignItems: "center", gap: 12 }}>
        <img src="/frontera-logo-white.svg" alt="Radio La Frontera" style={{ height: 36, width: "auto", display: "block" }} />
        <div>
          <p style={K({ fontWeight: 700, fontSize: 13, color: "#fff", lineHeight: 1.2 })}>Radio La Frontera 1110 AM</p>
          <p style={K({ fontWeight: 600, fontSize: 10, color: F.lime, letterSpacing: "0.06em", textTransform: "uppercase" })}>
            {playing ? "En vivo" : "Pausado"}
          </p>
        </div>
      </div>

      <div className="flex sm:hidden" style={{ alignItems: "center", gap: 8 }}>
        <span style={K({ fontWeight: 700, fontSize: 13, color: "#fff" })}>1110 AM</span>
        <span style={K({ fontWeight: 300, fontSize: 10, color: F.lime })}>{playing ? "En vivo" : "Pausado"}</span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Waveform color={playing ? F.lime : "#374151"} height={20} />
        <button onClick={toggle}
          style={{ width: 44, height: 44, borderRadius: "50%", border: `2px solid ${F.lime}`, background: playing ? F.lime : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          {playing ? <Pause size={18} color={F.ink} /> : <Play size={18} color={F.lime} fill={F.lime} />}
        </button>
        <Waveform color={playing ? F.lime : "#374151"} height={20} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={toggleMute}
          style={{ background: "none", border: "none", cursor: "pointer", color: muted ? "#6b7280" : "#fff", display: "flex", alignItems: "center", padding: 6 }}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>
        <Share2 size={20} color="#fff" style={{ cursor: "pointer" }} onClick={share} />
      </div>
    </div>
  );
}

/* ─── App ─────────────────────────────────────────────────────────────────── */
function AppInner() {
  const { settings } = useSiteContent();
  const STREAM = settings.streamFrontera;

  const [playing, setPlaying] = useState(false);
  const audioRef = React.useRef(null);

  const toggle = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    audio.src = STREAM;
    audio.load();
    const p = audio.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
    setPlaying(true);
  };

  return (
    <>
      <audio ref={audioRef} preload="none" />
      <GlobalStyles />
      <Navbar />
      <main style={{ paddingBottom: 64 }}>
        <Hero playing={playing} toggle={toggle} />
        <ProgramSchedule />
        <History />
        <Footer />
      </main>
      <FloatingPlayer playing={playing} toggle={toggle} />
      <WhatsAppWidget />
    </>
  );
}

export default function FronteraApp() {
  const [content, setContent] = useState(defaultContent);

  useEffect(() => {
    let alive = true;
    fetch("/api/content", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (alive && data && typeof data === "object" && data.settings) setContent(data);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  return (
    <SiteContentContext.Provider value={content}>
      <AppInner />
    </SiteContentContext.Provider>
  );
}
