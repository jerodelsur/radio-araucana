import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { GlobalStyles, Header, FooterMini } from "./Layout.jsx";
import Identificacion from "./Identificacion.jsx";
import Solicitud from "./Solicitud.jsx";
import Confirmacion from "./Confirmacion.jsx";
import Admin from "./Admin.jsx";
import { TARIFAS_DEFAULT } from "./tarifas.js";
import { AuthProvider } from "../extractos/lib/auth.jsx";

const STORAGE_CLIENTE = "cotiza_cliente";
const SESSION_ENVIADO = "cotiza_enviado";

export default function CotizaApp() {
  return (
    <BrowserRouter basename="/cotiza">
      <div style={{ background: "#191919", color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <GlobalStyles />
        <Header />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/admin" element={<AuthProvider><Admin /></AuthProvider>} />
            {/* Compatibilidad: /interno fue la URL del cotizador de equipo;
                ahora está unificado dentro de /admin como tab "Armar cotización". */}
            <Route path="/interno" element={<Navigate to="/admin?tab=armar" replace />} />
            {/* Splat (/*) para que las rutas anidadas de FlujoPublico
                (/, /gracias) sean alcanzables. Sin esto, /gracias caía
                en un catch-all y volvía a / sin mostrar la confirmación. */}
            <Route path="/*" element={<FlujoPublico />} />
          </Routes>
        </div>
        <FooterMini />
      </div>
    </BrowserRouter>
  );
}

/* ─── Flujo público: identificación → solicitud → confirmación ─────────────── */
function FlujoPublico() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_CLIENTE) || "null"); } catch { return null; }
  });
  const [tarifas, setTarifas] = useState(null);
  // Persistimos `enviado` en sessionStorage para que si la persona refresca
  // estando en /gracias, la confirmación siga visible. Se borra al cerrar
  // la pestaña (a diferencia de localStorage).
  const [enviado, setEnviado] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(SESSION_ENVIADO) || "null"); } catch { return null; }
  });
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/cotiza/tarifas", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then((d) => { if (!cancelled) setTarifas(d); })
      .catch(() => { if (!cancelled) setTarifas(TARIFAS_DEFAULT); });
    return () => { cancelled = true; };
  }, []);

  const guardarCliente = (datos) => {
    setCliente(datos);
    try { localStorage.setItem(STORAGE_CLIENTE, JSON.stringify(datos)); } catch { /* ignore */ }
  };
  const limpiarCliente = () => {
    setCliente(null);
    try { localStorage.removeItem(STORAGE_CLIENTE); } catch { /* ignore */ }
  };

  const enviar = async (payload) => {
    setEnviando(true);
    setErrorEnvio("");
    try {
      const r = await fetch("/api/cotiza/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setErrorEnvio(data.message || data.error || `Error ${r.status}.`);
        setEnviando(false);
        return;
      }
      const datosEnviado = { cliente: payload.cliente };
      setEnviado(datosEnviado);
      try { sessionStorage.setItem(SESSION_ENVIADO, JSON.stringify(datosEnviado)); } catch { /* ignore */ }
      navigate("/gracias");
    } catch (e) {
      setErrorEnvio("No pudimos enviar tu solicitud. Revisa tu conexión o escríbenos a cotizaciones@araucanayfrontera.cl.");
    } finally {
      setEnviando(false);
    }
  };

  if (!tarifas) {
    return <div style={{ padding: 80, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>Cargando…</div>;
  }

  const nuevaCotizacion = () => {
    // Limpiar el "enviado" en memoria y sessionStorage al iniciar una nueva
    // cotización, así no queda colgando la confirmación anterior si el usuario
    // vuelve a /gracias.
    setEnviado(null);
    try { sessionStorage.removeItem(SESSION_ENVIADO); } catch { /* ignore */ }
    navigate("/");
  };

  return (
    <Routes>
      <Route path="/" element={
        cliente
          ? <Solicitud tarifas={tarifas} cliente={cliente}
              onVolver={limpiarCliente}
              onEnviar={enviar} enviando={enviando} errorEnvio={errorEnvio} />
          : <Identificacion valorInicial={cliente} onContinuar={guardarCliente} />
      } />
      <Route path="/gracias" element={
        enviado
          ? <Confirmacion cliente={enviado.cliente} onNueva={nuevaCotizacion} />
          : <Navigate to="/" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
