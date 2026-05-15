import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { K } from "./Layout.jsx";
import LoginAdmin from "./LoginAdmin.jsx";
import ArmarCotizacionTab from "./ArmarCotizacionTab.jsx";
import SolicitudesPanel from "./SolicitudesPanel.jsx";
import CotizacionesTab from "./CotizacionesTab.jsx";
import TarifasTab from "./TarifasTab.jsx";

const STORAGE_KEY = "cotiza_admin_token";

const TABS = [
  { id: "armar", label: "Armar cotización" },
  { id: "solicitudes", label: "Solicitudes" },
  { id: "cotizaciones", label: "Cotizaciones" },
  { id: "tarifas", label: "Tarifas y cupones" },
];

/**
 * Panel único de administración del cotizador. Login con ADMIN_PASSWORD y
 * adentro tabs: armar cotización, solicitudes públicas pendientes, historial
 * de cotizaciones y editor de tarifas/cupones.
 *
 * Cuando el usuario hace click "Cotizar" en la tab Solicitudes, se cambia
 * automáticamente a la tab "Armar cotización" con los datos precargados.
 */
export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();

  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [autenticado, setAutenticado] = useState(() => Boolean(sessionStorage.getItem(STORAGE_KEY)));
  const [tarifas, setTarifas] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [solicitudPrecargada, setSolicitudPrecargada] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Determinar tab activa desde ?tab=... (default: armar)
  const params = new URLSearchParams(location.search);
  const tabFromUrl = params.get("tab");
  const tab = TABS.find((t) => t.id === tabFromUrl) ? tabFromUrl : "armar";

  const setTab = (id) => {
    const next = new URLSearchParams(location.search);
    next.set("tab", id);
    navigate({ pathname: location.pathname, search: next.toString() }, { replace: true });
  };

  useEffect(() => {
    if (!autenticado) return;
    fetch("/api/cotiza/tarifas", { cache: "no-store" })
      .then((r) => r.json())
      .then(setTarifas)
      .catch((e) => setErrorCarga(e?.message || String(e)));
  }, [autenticado]);

  const onLogin = (t) => {
    sessionStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setAutenticado(true);
  };
  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken("");
    setAutenticado(false);
    setTarifas(null);
    setSolicitudPrecargada(null);
  };

  const handlePrecargarSolicitud = (sol) => {
    setSolicitudPrecargada(sol);
    setTab("armar");
  };

  if (!autenticado) {
    return (
      <LoginAdmin
        titulo="Administración del cotizador"
        descripcion="Cotizaciones, solicitudes, tarifas y cupones. Requiere clave de administración."
        onLogin={onLogin}
      />
    );
  }

  if (!tarifas) {
    return (
      <p style={{ padding: 80, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
        {errorCarga ? `Error: ${errorCarga}` : "Cargando…"}
      </p>
    );
  }

  return (
    <section style={{ padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h1 style={K({ fontSize: 24, fontWeight: 700, marginBottom: 4 })}>Administración del cotizador</h1>
            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)" })}>
              Radio Araucana 95.9 FM · Publicidad
            </p>
          </div>
          <button type="button" onClick={logout}
            style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 14px", fontSize: 12, cursor: "pointer" })}>
            Cerrar sesión
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 24, flexWrap: "wrap" }}>
          {TABS.map((t) => (
            <button key={t.id} type="button" onClick={() => setTab(t.id)}
              style={K({
                background: "transparent",
                color: tab === t.id ? "#fff" : "rgba(255,255,255,0.5)",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #52b870" : "2px solid transparent",
                padding: "10px 16px", fontSize: 13, fontWeight: 600,
                cursor: "pointer", marginBottom: -1,
              })}>
              {t.label}
            </button>
          ))}
        </div>

        {tab === "armar" && (
          <ArmarCotizacionTab
            tarifas={tarifas}
            token={token}
            onLogout={logout}
            solicitudPrecargada={solicitudPrecargada}
            onSolicitudAtendida={() => {
              setSolicitudPrecargada(null);
              setRefreshKey((n) => n + 1);
            }}
          />
        )}

        {tab === "solicitudes" && (
          <SolicitudesPanel
            token={token}
            onLogout={logout}
            onPrecargar={handlePrecargarSolicitud}
            refreshKey={refreshKey}
            solicitudActivaId={solicitudPrecargada?.id}
          />
        )}

        {tab === "cotizaciones" && <CotizacionesTab token={token} />}

        {tab === "tarifas" && <TarifasTab tarifas={tarifas} token={token} onLogout={logout} />}
      </div>
    </section>
  );
}
