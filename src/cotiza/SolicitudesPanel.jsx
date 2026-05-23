import React, { useCallback, useEffect, useState } from "react";
import { K } from "./Layout.jsx";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 16,
};

function fechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

const TIPOS_PROMOCION_LABEL = {
  negocio: "Negocio o tienda local",
  servicio: "Servicio profesional",
  evento: "Evento puntual",
  oferta: "Oferta o promoción",
  campana: "Campaña institucional/política",
  otro: "Otro",
};

function tipoPromocionTexto(s) {
  if (!s?.tipo_promocion) return null;
  if (s.tipo_promocion === "otro" && s.tipo_promocion_otro) {
    return `Otro: ${s.tipo_promocion_otro}`;
  }
  return TIPOS_PROMOCION_LABEL[s.tipo_promocion] || s.tipo_promocion;
}

/**
 * Panel arriba del CotizadorInterno con las solicitudes públicas pendientes.
 * Cada solicitud se puede precargar (callback) o descartar.
 */
export default function SolicitudesPanel({ token, onPrecargar, onLogout, refreshKey = 0, solicitudActivaId }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [verHistorial, setVerHistorial] = useState(false);

  const cargar = useCallback(async (estado) => {
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`/api/cotiza/solicitudes?estado=${estado}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (r.status === 401) {
        setError("La clave no es válida o no tiene permisos para listar solicitudes. Usá 'Cerrar sesión' arriba si querés volver a intentar.");
        setSolicitudes([]);
        setCargando(false);
        return;
      }
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Error ${r.status}`);
        setSolicitudes([]);
      } else {
        setSolicitudes(data.solicitudes || []);
      }
    } catch (e) {
      setError(e?.message || "Error de red");
    } finally {
      setCargando(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    cargar(verHistorial ? "atendida" : "pendiente");
  }, [cargar, verHistorial, refreshKey]);

  const descartar = async (id) => {
    if (!confirm("¿Descartar esta solicitud? No se enviará cotización al cliente.")) return;
    try {
      await fetch("/api/cotiza/atender-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, estado: "descartada" }),
      });
      cargar(verHistorial ? "atendida" : "pendiente");
    } catch (e) {
      alert("No se pudo descartar: " + (e?.message || "error"));
    }
  };

  const reabrir = async (id) => {
    try {
      await fetch("/api/cotiza/atender-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, estado: "pendiente" }),
      });
      cargar(verHistorial ? "atendida" : "pendiente");
    } catch (e) {
      alert("No se pudo reabrir: " + (e?.message || "error"));
    }
  };

  return (
    <section style={{ padding: "20px 24px 0" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h2 style={SectionTitle}>
            {verHistorial ? "Solicitudes atendidas (últimas 100)" : "Solicitudes del público pendientes"}
            {!verHistorial && solicitudes.length > 0 && (
              <span style={{ color: "#52b870", marginLeft: 8 }}>· {solicitudes.length}</span>
            )}
          </h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={() => setVerHistorial((v) => !v)}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" })}>
              {verHistorial ? "← Pendientes" : "Historial →"}
            </button>
            <button type="button" onClick={() => cargar(verHistorial ? "atendida" : "pendiente")}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" })}>
              Actualizar
            </button>
          </div>
        </div>

        {cargando && <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)" })}>Cargando…</p>}
        {error && <p style={K({ fontSize: 13, color: "#e87171" })}>Error: {error}</p>}
        {!cargando && !error && solicitudes.length === 0 && (
          <div style={{
            padding: 20, background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10,
          }}>
            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.45)", textAlign: "center" })}>
              {verHistorial
                ? "Todavía no se ha cerrado ninguna solicitud."
                : "Sin solicitudes pendientes. Buen trabajo 🎉"}
            </p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 10 }}>
          {solicitudes.map((s) => {
            const activa = solicitudActivaId === s.id;
            const pedido = Array.isArray(s.pedido) ? s.pedido : [];
            return (
              <div key={s.id} style={{
                background: activa ? "rgba(82,184,112,0.1)" : "rgba(255,255,255,0.03)",
                border: activa ? "1px solid #52b870" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10, padding: 14,
                display: "flex", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                  <strong style={K({ fontSize: 14 })}>{s.cliente_nombre}</strong>
                  <span style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)" })}>{fechaCorta(s.created_at)}</span>
                </div>
                {s.cliente_empresa && (
                  <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.55)" })}>{s.cliente_empresa}</p>
                )}
                {tipoPromocionTexto(s) && (
                  <p style={K({ fontSize: 11, color: "rgba(82,184,112,0.85)", fontWeight: 600 })}>
                    Promociona: {tipoPromocionTexto(s)}
                  </p>
                )}

                {/* Detalle por formato: título + lo que pidió */}
                <div style={{
                  background: "rgba(82,184,112,0.04)",
                  border: "1px solid rgba(82,184,112,0.15)",
                  borderRadius: 6, padding: 10,
                  display: "flex", flexDirection: "column", gap: 8,
                }}>
                  {pedido.length === 0 && (
                    <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", fontStyle: "italic" })}>
                      Sin formatos especificados.
                    </p>
                  )}
                  {pedido.map((p, i) => (
                    <div key={i}>
                      <p style={K({ fontSize: 12, color: "#52b870", fontWeight: 600 })}>
                        {p.titulo}{p.duracion ? <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400 }}> · {p.duracion}</span> : null}
                      </p>
                      {p.necesidad && (
                        <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginTop: 2 })}>
                          {p.necesidad}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {s.comentarios && (
                  <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.45)", fontStyle: "italic", lineHeight: 1.4 })}>
                    "{s.comentarios.slice(0, 200)}{s.comentarios.length > 200 ? "…" : ""}"
                  </p>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                  {s.cliente_telefono && (
                    <a href={`https://wa.me/${s.cliente_telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                      style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "2px 0" })}>
                      📞 WhatsApp
                    </a>
                  )}
                  {s.cliente_email && (
                    <a href={`mailto:${s.cliente_email}`}
                      style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", padding: "2px 0" })}>
                      ✉ Email
                    </a>
                  )}
                </div>
                {s.cotizacion_total && (
                  <p style={K({ fontSize: 12, color: "#52b870", fontWeight: 600 })}>
                    Cotizada: ${s.cotizacion_total.toLocaleString("es-CL")}
                  </p>
                )}
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  {verHistorial ? (
                    <button type="button" onClick={() => reabrir(s.id)}
                      style={K({ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", flex: 1 })}>
                      Reabrir
                    </button>
                  ) : (
                    <>
                      <button type="button" onClick={() => onPrecargar(s)}
                        style={K({ background: "#52b870", color: "#0a3d23", border: "none", borderRadius: 6, padding: "6px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", flex: 1 })}>
                        Cotizar
                      </button>
                      <button type="button" onClick={() => descartar(s.id)}
                        style={K({ background: "transparent", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "6px 10px", fontSize: 11, cursor: "pointer" })}>
                        Descartar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
