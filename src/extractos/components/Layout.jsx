import React from "react";
import { Link, useLocation } from "react-router-dom";
import { T, FONTS, S } from "../theme.js";
import { SpinnerStyles } from "./ui.jsx";
import { useSettings } from "../lib/settings-store.js";

/* ─── Estilos globales del módulo ─────────────────────────────────────────── */
export function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { background: ${T.cream}; }
      body {
        font-family: ${FONTS.body};
        background: ${T.cream};
        color: ${T.ink};
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        line-height: 1.5;
      }
      a { color: inherit; }
      ::selection { background: rgba(78,165,82,0.25); }
      .display { font-family: ${FONTS.display}; font-weight: 500; letter-spacing: -0.01em; }
      .mono { font-family: ${FONTS.mono}; }
      .bookman { font-family: ${FONTS.bookman}; line-height: 1; }
      @keyframes extractos-fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    `}</style>
  );
}

/* ─── Header ──────────────────────────────────────────────────────────────── */
function Header({ adminMode }) {
  return (
    <header
      style={{
        background: T.greenDark,
        color: T.cream,
        padding: "14px 20px",
        borderBottom: `1px solid ${T.greenSoft}`,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <a
          href="/frontera"
          style={{ display: "inline-flex", alignItems: "center", gap: 14, textDecoration: "none" }}
          aria-label="Volver al sitio de Radio La Frontera"
        >
          <img
            src="/frontera-logo-white.svg"
            alt="Radio La Frontera 1110 AM"
            width="160"
            height="40"
            style={{ height: 34, width: "auto", display: "block" }}
          />
          <span
            style={{
              fontFamily: FONTS.display,
              fontSize: 16,
              color: T.cream,
              fontWeight: 500,
              borderLeft: `1px solid rgba(246,245,238,0.25)`,
              paddingLeft: 14,
              opacity: 0.92,
            }}
          >
            Extractos legales
          </span>
        </a>
        <nav style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 13 }}>
          {adminMode ? (
            <>
              <Link to="/admin" style={{ color: T.cream, textDecoration: "none", opacity: 0.9 }}>Dashboard</Link>
              <Link to="/admin/configuracion" style={{ color: T.cream, textDecoration: "none", opacity: 0.9 }}>Configuración</Link>
            </>
          ) : (
            <a href="/frontera" style={{ color: T.cream, textDecoration: "none", opacity: 0.9 }}>← Volver al sitio</a>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ─── Footer ──────────────────────────────────────────────────────────────── */
function Footer() {
  const settings = useSettings();
  const adminEmail = settings.radio_email_administration || "extractos@araucanayfrontera.cl";
  const mobile = settings.radio_phone_mobile || "+56 9 4239 0216";
  const legalName = settings.radio_legal_name || "";
  const legalRut = settings.radio_legal_rut || "";
  const address = settings.radio_address || "Caupolicán 110, Of. 2003, Piso 20, Temuco";
  return (
    <footer
      style={{
        background: T.greenDark,
        color: T.cream,
        padding: "28px 20px",
        marginTop: 48,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
          fontSize: 13,
          lineHeight: 1.6,
        }}
      >
        <div>
          <div className="display" style={{ fontSize: 18, marginBottom: 8 }}>
            Radio La Frontera<br />AM 1110
          </div>
          <div style={{ opacity: 0.75 }}>{address}</div>
          {legalName && (
            <div style={{ opacity: 0.5, fontSize: 11, marginTop: 8 }}>
              {legalName}{legalRut && ` · ${legalRut}`}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>Contacto</div>
          <div style={{ opacity: 0.75 }}>
            <a href={`mailto:${adminEmail}`} style={{ color: T.cream }}>{adminEmail}</a>
            <br />
            Móvil: {mobile}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.9 }}>Servicios</div>
          <div style={{ opacity: 0.75 }}>
            Difusión radial DGA<br />
            DIA al SEIA<br />
            Avisos administrativos
          </div>
        </div>
      </div>
      <div
        style={{
          maxWidth: 1180,
          margin: "20px auto 0",
          paddingTop: 16,
          borderTop: `1px solid rgba(246,245,238,0.15)`,
          fontSize: 12,
          opacity: 0.6,
          textAlign: "center",
        }}
      >
        © {new Date().getFullYear()} Radio La Frontera AM 1110 · Todos los derechos reservados
      </div>
    </footer>
  );
}

/* ─── Layout wrapper ──────────────────────────────────────────────────────── */
export default function Layout({ children }) {
  const location = useLocation();
  const adminMode = location.pathname.startsWith("/admin");
  return (
    <>
      <GlobalStyles />
      <SpinnerStyles />
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: T.cream }}>
        <Header adminMode={adminMode} />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
      </div>
    </>
  );
}
