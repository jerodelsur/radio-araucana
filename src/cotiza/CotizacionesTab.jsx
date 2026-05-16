import React, { useCallback, useEffect, useState } from "react";
import { K } from "./Layout.jsx";
import { formatCLP } from "./tarifas.js";

const ESTADO_COLOR = {
  enviada: "#5b9be8",
  aceptada: "#52b870",
  rechazada: "#e87171",
  vencida: "rgba(255,255,255,0.4)",
};
const ESTADO_LABEL = {
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  vencida: "Vencida",
};

function fechaCorta(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "2-digit" });
}

export default function CotizacionesTab({ token }) {
  const [cotizaciones, setCotizaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [busqueda, setBusqueda] = useState("");
  const [busquedaActual, setBusquedaActual] = useState("");
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const [accionEnCurso, setAccionEnCurso] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError("");
    try {
      const params = new URLSearchParams({ estado: filtroEstado });
      if (busquedaActual) params.set("q", busquedaActual);
      const r = await fetch(`/api/cotiza/cotizaciones?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error || `Error ${r.status}`);
        setCotizaciones([]);
      } else {
        setCotizaciones(data.cotizaciones || []);
      }
    } catch (e) {
      setError(e?.message || "Error de red");
    } finally {
      setCargando(false);
    }
  }, [token, filtroEstado, busquedaActual]);

  useEffect(() => { cargar(); }, [cargar]);

  const buscar = (e) => {
    e?.preventDefault?.();
    setBusquedaActual(busqueda.trim());
  };

  const cambiarEstado = async (id, estado) => {
    setAccionEnCurso(id);
    try {
      const r = await fetch("/api/cotiza/cotizacion-estado", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, estado }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        alert("No se pudo cambiar el estado: " + (data.error || r.status));
      } else {
        cargar();
      }
    } catch (e) {
      alert("Error de red: " + (e?.message || "?"));
    } finally {
      setAccionEnCurso(null);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 20 }}>
        <div style={{ flex: "1 1 280px" }}>
          <label style={K({ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 })}>
            Buscar (número, cliente, empresa, email)
          </label>
          <form onSubmit={buscar} style={{ display: "flex", gap: 6 }}>
            <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: COT-2026-0001, Bertha, Tienda Sur…"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 6, padding: "10px 12px",
                color: "#fff", fontFamily: "'Open Sans', sans-serif",
                fontSize: 13, outline: "none",
              }} />
            <button type="submit"
              style={K({ background: "#52b870", color: "#0a3d23", border: "none", borderRadius: 6, padding: "10px 14px", fontWeight: 700, fontSize: 12, cursor: "pointer" })}>
              Buscar
            </button>
            {busquedaActual && (
              <button type="button" onClick={() => { setBusqueda(""); setBusquedaActual(""); }}
                style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "10px 14px", fontSize: 12, cursor: "pointer" })}>
                Limpiar
              </button>
            )}
          </form>
        </div>
        <div>
          <label style={K({ display: "block", fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4 })}>Filtro</label>
          <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 6, padding: "10px 12px",
              color: "#fff", fontFamily: "'Open Sans', sans-serif",
              fontSize: 13, outline: "none", minWidth: 140,
            }}>
            <option value="todas" style={{ background: "#191919" }}>Todas</option>
            <option value="enviada" style={{ background: "#191919" }}>Enviadas</option>
            <option value="aceptada" style={{ background: "#191919" }}>Aceptadas</option>
            <option value="rechazada" style={{ background: "#191919" }}>Rechazadas</option>
            <option value="vencida" style={{ background: "#191919" }}>Vencidas</option>
          </select>
        </div>
        <button type="button" onClick={cargar}
          style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "10px 14px", fontSize: 12, cursor: "pointer" })}>
          Actualizar
        </button>
      </div>

      {cargando && <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)" })}>Cargando…</p>}
      {error && <p style={K({ fontSize: 13, color: "#e87171" })}>Error: {error}</p>}

      {!cargando && !error && cotizaciones.length === 0 && (
        <div style={{ padding: 24, background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, textAlign: "center" }}>
          <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.4)" })}>
            {busquedaActual || filtroEstado !== "todas"
              ? "No hay cotizaciones con esos filtros."
              : "Aún no hay cotizaciones guardadas. Las que generes en /cotiza/interno aparecerán acá."}
          </p>
        </div>
      )}

      {!cargando && cotizaciones.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, overflow: "hidden",
        }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 720 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.03)" }}>
                  <Th>Número</Th>
                  <Th>Fecha</Th>
                  <Th>Cliente</Th>
                  <Th>Total</Th>
                  <Th>Vía</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <Td>
                        <button type="button" onClick={() => setDetalleAbierto(detalleAbierto === c.id ? null : c.id)}
                          style={K({ background: "transparent", color: "#52b870", border: "none", padding: 0, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "monospace" })}>
                          {c.numero}
                        </button>
                      </Td>
                      <Td>{fechaCorta(c.created_at)}</Td>
                      <Td>
                        <div style={K({ fontSize: 13, color: "#fff" })}>{c.cliente_nombre}</div>
                        {c.cliente_empresa && <div style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)" })}>{c.cliente_empresa}</div>}
                      </Td>
                      <Td><span style={K({ fontVariantNumeric: "tabular-nums", fontWeight: 600 })}>{formatCLP(c.total)}</span></Td>
                      <Td><span style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" })}>{c.enviada_via}</span></Td>
                      <Td>
                        <span style={K({
                          fontSize: 11, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.08em", padding: "3px 8px", borderRadius: 4,
                          background: `${ESTADO_COLOR[c.estado]}20`,
                          color: ESTADO_COLOR[c.estado],
                          border: `1px solid ${ESTADO_COLOR[c.estado]}50`,
                        })}>{ESTADO_LABEL[c.estado]}</span>
                      </Td>
                      <Td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {c.estado === "enviada" && (
                            <>
                              <BtnMini onClick={() => cambiarEstado(c.id, "aceptada")} disabled={accionEnCurso === c.id} color="#52b870">
                                ✓ Aceptada
                              </BtnMini>
                              <BtnMini onClick={() => cambiarEstado(c.id, "rechazada")} disabled={accionEnCurso === c.id} color="#e87171">
                                ✕ Rechazada
                              </BtnMini>
                            </>
                          )}
                          {(c.estado === "aceptada" || c.estado === "rechazada" || c.estado === "vencida") && (
                            <BtnMini onClick={() => cambiarEstado(c.id, "enviada")} disabled={accionEnCurso === c.id} color="rgba(255,255,255,0.4)">
                              Reabrir
                            </BtnMini>
                          )}
                        </div>
                      </Td>
                    </tr>
                    {detalleAbierto === c.id && (
                      <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                        <td colSpan={7} style={{ padding: 16 }}>
                          <DetalleCotizacion c={c} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function DetalleCotizacion({ c }) {
  const tieneB = Boolean(c.propuesta_b);
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: tieneB ? 20 : 0 }}>
        <div>
          <h4 style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 })}>Cliente</h4>
          <p style={K({ fontSize: 13, color: "#fff", marginBottom: 4 })}>{c.cliente_nombre}</p>
          {c.cliente_empresa && <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)" })}>{c.cliente_empresa}</p>}
          {c.cliente_telefono && (
            <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)" })}>
              📞 <a href={`https://wa.me/${c.cliente_telefono.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"
                style={{ color: "#52b870", textDecoration: "none" }}>{c.cliente_telefono}</a>
            </p>
          )}
          {c.cliente_email && (
            <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)" })}>
              ✉ <a href={`mailto:${c.cliente_email}`} style={{ color: "#52b870", textDecoration: "none" }}>{c.cliente_email}</a>
            </p>
          )}
        </div>

        <PropuestaDetalle titulo={tieneB ? "Propuesta A" : "Detalle"} propuesta={c} />

        {tieneB && <PropuestaDetalle titulo="Propuesta B" propuesta={c.propuesta_b} />}
      </div>
    </div>
  );
}

function PropuestaDetalle({ titulo, propuesta }) {
  if (!propuesta) return null;
  return (
    <div>
      <h4 style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 })}>{titulo}</h4>
      <ul style={K({ fontSize: 12, color: "rgba(255,255,255,0.7)", listStyle: "none", padding: 0, lineHeight: 1.6, marginBottom: 10 })}>
        {(propuesta.lineas || []).map((l, i) => (
          <li key={i} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span>{l.detalle}</span>
            <span style={{ fontVariantNumeric: "tabular-nums" }}>{formatCLP(l.subtotal)}</span>
          </li>
        ))}
      </ul>
      <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)" })}>Subtotal: {formatCLP(propuesta.subtotal)}</p>
      {propuesta.descuento_pyme > 0 && <p style={K({ fontSize: 12, color: "#52b870" })}>PYME: -{formatCLP(propuesta.descuento_pyme)}</p>}
      {propuesta.descuento_agencia > 0 && <p style={K({ fontSize: 12, color: "#52b870" })}>Agencia ({propuesta.agencia_tramo}): -{formatCLP(propuesta.descuento_agencia)}</p>}
      {propuesta.descuento_cupon > 0 && <p style={K({ fontSize: 12, color: "#52b870" })}>Cupón {propuesta.cupon_codigo}: -{formatCLP(propuesta.descuento_cupon)}</p>}
      <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.6)" })}>IVA: {formatCLP(propuesta.iva)}</p>
      <p style={K({ fontSize: 14, color: "#52b870", fontWeight: 700, marginTop: 6, fontVariantNumeric: "tabular-nums" })}>Total: {formatCLP(propuesta.total)}</p>
      {propuesta.comentarios && (
        <div style={{ marginTop: 10, padding: 8, background: "rgba(255,255,255,0.04)", borderRadius: 4 }}>
          <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.5)", fontStyle: "italic" })}>{propuesta.comentarios}</p>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th style={K({ textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" })}>{children}</th>;
}
function Td({ children }) {
  return <td style={{ padding: "12px 14px", fontFamily: "'Open Sans', sans-serif", fontSize: 13, color: "rgba(255,255,255,0.85)" }}>{children}</td>;
}
function BtnMini({ children, onClick, disabled, color }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      style={K({
        background: "transparent",
        color: color || "#fff",
        border: `1px solid ${color}50`,
        borderRadius: 4,
        padding: "4px 8px",
        fontSize: 11, fontWeight: 600,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.5 : 1,
      })}>
      {children}
    </button>
  );
}
