import React, { useCallback, useEffect, useMemo, useState } from "react";
import { K } from "./Layout.jsx";
import {
  calcularLineas,
  formatCLP,
  validarCupon,
  aplicarCupon,
} from "./tarifas.js";
import SolicitudesPanel from "./SolicitudesPanel.jsx";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 16,
};

/**
 * Cotizador para uso interno del equipo comercial. Requiere ADMIN_PASSWORD.
 * Muestra precios completos y permite aplicar descuentos PYME y Precio Agencia
 * que NO están disponibles en el cotizador público.
 *
 * Acciones de salida:
 *   - Copiar texto formateado al portapapeles (para pegar manualmente).
 *   - Enviar email al cliente (requiere email) con la cotización ya armada.
 */
export default function CotizadorInterno({ tarifas, token, onLogout }) {
  const [selecciones, setSelecciones] = useState({});
  const [cliente, setCliente] = useState({ nombre: "", empresa: "", telefono: "", email: "" });
  const [comentarios, setComentarios] = useState("");

  const [pymeActivo, setPymeActivo] = useState(false);
  const [agenciaTramo, setAgenciaTramo] = useState("");

  const [cuponInput, setCuponInput] = useState("");
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [cuponError, setCuponError] = useState("");

  const [feedback, setFeedback] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const [solicitudActiva, setSolicitudActiva] = useState(null);
  const [refreshSolicitudes, setRefreshSolicitudes] = useState(0);

  const formatos = tarifas.formatos;
  const dPyme = tarifas.descuentosInternos?.pyme;
  const dAgencia = tarifas.descuentosInternos?.agencia;

  const toggleFormato = (id) => {
    setSelecciones((s) => {
      if (s[id]) { const next = { ...s }; delete next[id]; return next; }
      const f = formatos.find((x) => x.id === id);
      if (f.horarios) {
        return {
          ...s,
          [id]: {
            horarioId: f.horarios[0].id,
            packId: f.horarios[0].packs[1]?.id || f.horarios[0].packs[0].id,
            meses: 1,
          },
        };
      }
      return { ...s, [id]: { unidadId: f.unidades[0].id, cantidad: 1 } };
    });
  };
  const updateSeleccion = (id, patch) =>
    setSelecciones((s) => ({ ...s, [id]: { ...s[id], ...patch } }));

  const lineas = useMemo(() => calcularLineas(formatos, selecciones), [formatos, selecciones]);

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
    const descPyme = pymeActivo && dPyme?.porcentaje ? Math.round((subtotal * dPyme.porcentaje) / 100) : 0;
    let descAgencia = 0;
    let agenciaTramoInfo = null;
    if (agenciaTramo && dAgencia?.tramos) {
      const tramo = dAgencia.tramos.find((t) => t.id === agenciaTramo);
      if (tramo) {
        descAgencia = Math.round((subtotal * tramo.porcentaje) / 100);
        agenciaTramoInfo = tramo;
      }
    }
    const descCupon = aplicarCupon(subtotal, cuponAplicado);
    const totalDescuentos = descPyme + descAgencia + descCupon;
    const base = Math.max(0, subtotal - totalDescuentos);
    const iva = Math.round(base * tarifas.iva);
    const total = base + iva;
    return { subtotal, descPyme, descAgencia, descCupon, totalDescuentos, base, iva, total, agenciaTramoInfo };
  }, [lineas, pymeActivo, agenciaTramo, cuponAplicado, dPyme, dAgencia, tarifas.iva]);

  const aplicarCodigoCupon = () => {
    const { cupon, motivo } = validarCupon(cuponInput, tarifas.cupones);
    if (cupon) { setCuponAplicado(cupon); setCuponError(""); }
    else { setCuponAplicado(null); setCuponError(motivo || "Código no válido"); }
  };

  const hayLineas = lineas.length > 0;
  const clienteParaEmail = cliente.email.trim();
  const puedeEnviar = hayLineas && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clienteParaEmail);

  const generarTextoCotizacion = () => {
    const out = [];
    out.push("Radio Araucana 95.9 FM — Cotización publicidad");
    out.push("=".repeat(48));
    if (cliente.nombre.trim()) out.push(`Para: ${cliente.nombre.trim()}${cliente.empresa.trim() ? " · " + cliente.empresa.trim() : ""}`);
    out.push(`Fecha: ${new Date().toLocaleDateString("es-CL")}`);
    out.push("");
    out.push("DETALLE:");
    lineas.forEach((l) => out.push(`  • ${l.detalle} — ${formatCLP(l.subtotal)}`));
    out.push("");
    out.push(`Subtotal:        ${formatCLP(totales.subtotal)}`);
    if (totales.descPyme > 0) out.push(`${dPyme.label} (${dPyme.porcentaje}%): -${formatCLP(totales.descPyme)}`);
    if (totales.descAgencia > 0) out.push(`Precio Agencia · ${totales.agenciaTramoInfo.label} (${totales.agenciaTramoInfo.porcentaje}%): -${formatCLP(totales.descAgencia)}`);
    if (totales.descCupon > 0) out.push(`Cupón ${cuponAplicado.codigo}: -${formatCLP(totales.descCupon)}`);
    out.push(`IVA (${Math.round(tarifas.iva * 100)}%):    ${formatCLP(totales.iva)}`);
    out.push("");
    out.push(`TOTAL CON IVA:   ${formatCLP(totales.total)}`);
    if (comentarios.trim()) {
      out.push("");
      out.push("Notas:");
      out.push(comentarios.trim());
    }
    out.push("");
    out.push("Cotización referencial. Validez 30 días.");
    out.push("Radio Araucana · administracion@araucanayfrontera.cl · +56 9 9287 2087");
    return out.join("\n");
  };

  const copiar = async () => {
    if (!hayLineas) return;
    setFeedback(null);
    try {
      await navigator.clipboard.writeText(generarTextoCotizacion());
      setFeedback({ ok: true, msg: "Copiado al portapapeles" });
    } catch (e) {
      setFeedback({ ok: false, msg: "No se pudo copiar: " + (e?.message || "error") });
    }
  };

  const enviarCliente = async () => {
    if (!puedeEnviar || enviando) return;
    setFeedback(null);
    setEnviando(true);
    try {
      const payload = {
        cliente: {
          nombre: cliente.nombre.trim() || "Cliente",
          empresa: cliente.empresa.trim(),
          telefono: cliente.telefono.trim(),
          email: cliente.email.trim(),
        },
        lineas: lineas.map((l) => ({ detalle: l.detalle, subtotal: l.subtotal })),
        descPyme: totales.descPyme ? { label: dPyme.label, porcentaje: dPyme.porcentaje, monto: totales.descPyme } : null,
        descAgencia: totales.descAgencia ? { label: totales.agenciaTramoInfo.label, porcentaje: totales.agenciaTramoInfo.porcentaje, monto: totales.descAgencia } : null,
        cupon: cuponAplicado ? { codigo: cuponAplicado.codigo, descripcion: cuponAplicado.descripcion || "", monto: totales.descCupon } : null,
        subtotal: totales.subtotal,
        iva: totales.iva,
        total: totales.total,
        comentarios: comentarios.trim(),
      };
      const r = await fetch("/api/cotiza/enviar-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { onLogout(); return; }
        setFeedback({ ok: false, msg: data.message || data.error || `Error ${r.status}` });
      } else {
        setFeedback({ ok: true, msg: `Enviado a ${cliente.email.trim()}` });
        // Si esta cotización viene de una solicitud pública, marcarla atendida
        if (solicitudActiva) {
          await marcarSolicitudAtendida(solicitudActiva, totales.total);
        }
      }
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Error de red" });
    } finally {
      setEnviando(false);
    }
  };

  const marcarSolicitudAtendida = useCallback(async (id, total) => {
    try {
      await fetch("/api/cotiza/atender-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, estado: "atendida", cotizacionTotal: total }),
      });
      setSolicitudActiva(null);
      setRefreshSolicitudes((n) => n + 1);
    } catch (e) {
      console.warn("No se pudo marcar atendida:", e?.message);
    }
  }, [token]);

  const precargarSolicitud = useCallback((sol) => {
    setCliente({
      nombre: sol.cliente_nombre || "",
      empresa: sol.cliente_empresa || "",
      telefono: sol.cliente_telefono || "",
      email: sol.cliente_email || "",
    });

    // Pre-seleccionar formatos con defaults; el vendedor termina de configurar
    const nuevas = {};
    (sol.pedido || []).forEach((p) => {
      const f = formatos.find((x) => x.id === p.formatoId);
      if (!f) return;
      if (f.horarios) {
        nuevas[f.id] = {
          horarioId: f.horarios[0].id,
          packId: f.horarios[0].packs[1]?.id || f.horarios[0].packs[0].id,
          meses: 1,
        };
      } else {
        nuevas[f.id] = { unidadId: f.unidades[0].id, cantidad: 1 };
      }
    });
    setSelecciones(nuevas);

    // Concatenar comentarios y necesidades del cliente como referencia
    const necesidades = (sol.pedido || [])
      .filter((p) => p.necesidad)
      .map((p) => `${p.titulo}: ${p.necesidad}`)
      .join("\n");
    const partes = [];
    if (necesidades) partes.push("Lo que pidió el cliente:\n" + necesidades);
    if (sol.comentarios) partes.push("Comentarios: " + sol.comentarios);
    setComentarios(partes.join("\n\n"));

    setSolicitudActiva(sol.id);
    setFeedback(null);

    // Scroll al inicio del cotizador
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }, [formatos]);

  return (
    <>
      <section style={{ background: "rgba(82,184,112,0.06)", borderBottom: "1px solid rgba(82,184,112,0.15)", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <p style={K({ fontSize: 12, color: "rgba(255,255,255,0.7)" })}>
            <span style={{ color: "#52b870", fontWeight: 600 }}>HERRAMIENTA INTERNA</span>
            <span style={{ color: "rgba(255,255,255,0.4)" }}> · cotizador del equipo comercial</span>
          </p>
          <button type="button" onClick={onLogout}
            style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "none", fontSize: 12, cursor: "pointer", padding: 4, textDecoration: "underline" })}>
            Cerrar sesión
          </button>
        </div>
      </section>

      <SolicitudesPanel
        token={token}
        onLogout={onLogout}
        onPrecargar={precargarSolicitud}
        refreshKey={refreshSolicitudes}
        solicitudActivaId={solicitudActiva}
      />

      <section style={{ padding: "clamp(28px, 4vw, 40px) 24px 16px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h1 style={K({ fontSize: "clamp(24px, 3.5vw, 32px)", fontWeight: 700, lineHeight: 1.2, marginBottom: 8 })}>
            {solicitudActiva ? "Cotizando esta solicitud" : "Armar cotización"}
          </h1>
          <p style={K({ fontSize: 14, fontWeight: 300, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 })}>
            {solicitudActiva
              ? "Configura cada formato, ajusta descuentos si corresponden, y envía la cotización al cliente. La solicitud se marca como atendida automáticamente al enviar."
              : "Construye la cotización, aplica descuentos comerciales si corresponden, y copia el texto o envíalo directo al cliente."}
          </p>
          {solicitudActiva && (
            <button type="button" onClick={() => {
              setSolicitudActiva(null);
              setCliente({ nombre: "", empresa: "", telefono: "", email: "" });
              setSelecciones({});
              setComentarios("");
              setFeedback(null);
            }}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer", marginTop: 10 })}>
              ← Volver a la lista (descarta esta cotización en curso)
            </button>
          )}
        </div>
      </section>

      {/* Cliente */}
      <section style={{ padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={SectionTitle}>Cliente (opcional, requerido para enviar por email)</h2>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: 16,
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
          }}>
            <Field label="Nombre" value={cliente.nombre} onChange={(v) => setCliente((c) => ({ ...c, nombre: v }))} placeholder="Nombre del cliente" />
            <Field label="Empresa" value={cliente.empresa} onChange={(v) => setCliente((c) => ({ ...c, empresa: v }))} placeholder="Empresa o agrupación" />
            <Field label="Teléfono" value={cliente.telefono} onChange={(v) => setCliente((c) => ({ ...c, telefono: v }))} placeholder="+56 9 ..." type="tel" />
            <Field label="Email" value={cliente.email} onChange={(v) => setCliente((c) => ({ ...c, email: v }))} placeholder="cliente@correo.cl" type="email" />
          </div>
        </div>
      </section>

      {/* Formatos */}
      <section style={{ padding: "16px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <h2 style={SectionTitle}>Formatos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {formatos.map((f) => {
              const sel = Boolean(selecciones[f.id]);
              return (
                <button key={f.id} type="button" onClick={() => toggleFormato(f.id)} className="cot-card"
                  aria-pressed={sel}
                  style={{
                    textAlign: "left",
                    background: sel ? "rgba(82,184,112,0.08)" : "rgba(255,255,255,0.03)",
                    border: sel ? "1px solid #52b870" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10, padding: 14, cursor: "pointer",
                    color: "#fff", fontFamily: "'Open Sans', sans-serif",
                    transition: "all 180ms ease",
                  }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 22 }} aria-hidden>{f.icon}</span>
                    <span style={K({
                      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.1em", padding: "3px 7px", borderRadius: 3,
                      background: sel ? "#52b870" : "rgba(255,255,255,0.08)",
                      color: sel ? "#191919" : "rgba(255,255,255,0.6)",
                    })}>
                      {sel ? "✓" : f.duracion}
                    </span>
                  </div>
                  <strong style={K({ fontSize: 14, fontWeight: 700 })}>{f.titulo}</strong>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Configuración de líneas */}
      {hayLineas && (
        <section style={{ padding: "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={SectionTitle}>Configurar cada formato</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {formatos.filter((f) => selecciones[f.id]).map((f) => {
                const linea = lineas.find((l) => l.formato.id === f.id);
                return (
                  <ConfigLinea key={f.id} formato={f} seleccion={selecciones[f.id]} linea={linea}
                    onUpdate={(patch) => updateSeleccion(f.id, patch)}
                    onQuitar={() => toggleFormato(f.id)} />
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Descuentos comerciales internos */}
      {hayLineas && (dPyme || dAgencia) && (
        <section style={{ padding: "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={SectionTitle}>Descuentos comerciales (uso interno)</h2>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 16,
              display: "flex", flexDirection: "column", gap: 12,
            }}>
              {dPyme && (
                <label style={K({ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, cursor: "pointer" })}>
                  <input type="checkbox" checked={pymeActivo} onChange={(e) => setPymeActivo(e.target.checked)}
                    style={{ marginTop: 3, accentColor: "#52b870" }} />
                  <span>
                    <strong style={{ color: "#fff" }}>{dPyme.label}</strong> · {dPyme.porcentaje}% descuento
                    <br /><span style={K({ fontSize: 12, color: "rgba(255,255,255,0.5)" })}>{dPyme.descripcion}</span>
                  </span>
                </label>
              )}
              {dAgencia && (
                <div>
                  <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 })}>
                    <span>
                      <strong style={{ color: "#fff" }}>{dAgencia.label}</strong>
                      <br /><span style={K({ fontSize: 12, color: "rgba(255,255,255,0.5)" })}>{dAgencia.descripcion}</span>
                    </span>
                    <select value={agenciaTramo} onChange={(e) => setAgenciaTramo(e.target.value)}
                      style={inputStyle}>
                      <option value="" style={{ background: "#191919" }}>Sin precio agencia</option>
                      {dAgencia.tramos.map((t) => (
                        <option key={t.id} value={t.id} style={{ background: "#191919" }}>
                          {t.label} (-{t.porcentaje}%)
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Cupón */}
      {hayLineas && Array.isArray(tarifas.cupones) && tarifas.cupones.length > 0 && (
        <section style={{ padding: "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={SectionTitle}>Cupón / Promoción</h2>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <input type="text" value={cuponInput}
                onChange={(e) => { setCuponInput(e.target.value); setCuponError(""); }}
                placeholder="Ej: LaUnica1939"
                disabled={Boolean(cuponAplicado)}
                style={{ ...inputStyle, flex: "1 1 200px" }} />
              {cuponAplicado ? (
                <button type="button" onClick={() => { setCuponAplicado(null); setCuponInput(""); }}
                  style={K({ background: "rgba(255,255,255,0.06)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" })}>
                  Quitar
                </button>
              ) : (
                <button type="button" onClick={aplicarCodigoCupon}
                  style={K({ background: "#52b870", color: "#191919", border: "none", borderRadius: 6, padding: "10px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer" })}>
                  Aplicar
                </button>
              )}
            </div>
            {cuponError && <p style={K({ fontSize: 12, color: "#e87171", marginTop: 6 })}>{cuponError}</p>}
            {cuponAplicado && (
              <p style={K({ fontSize: 12, color: "#52b870", marginTop: 6 })}>
                {cuponAplicado.codigo} · {cuponAplicado.descripcion || `${cuponAplicado.tipo === "porcentaje" ? cuponAplicado.valor + "%" : formatCLP(cuponAplicado.valor)}`}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Notas internas */}
      {hayLineas && (
        <section style={{ padding: "16px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <h2 style={SectionTitle}>Notas (van en la cotización al cliente)</h2>
            <textarea rows={3} value={comentarios}
              onChange={(e) => setComentarios(e.target.value)}
              placeholder="Vigencia especial, condiciones, programación específica, etc."
              style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
          </div>
        </section>
      )}

      {/* Totales + acciones */}
      {hayLineas && (
        <section style={{ padding: "24px 24px 64px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: 20, marginBottom: 16,
            }}>
              {lineas.map((l, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                  <span style={K({ fontSize: 14, color: "rgba(255,255,255,0.8)" })}>{l.detalle}</span>
                  <strong style={K({ fontSize: 14, fontVariantNumeric: "tabular-nums" })}>{formatCLP(l.subtotal)}</strong>
                </div>
              ))}

              <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 12, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <Row label="Subtotal" value={formatCLP(totales.subtotal)} />
                {totales.descPyme > 0 && <Row label={`${dPyme.label} (-${dPyme.porcentaje}%)`} value={`-${formatCLP(totales.descPyme)}`} color="#52b870" />}
                {totales.descAgencia > 0 && <Row label={`Precio Agencia · ${totales.agenciaTramoInfo.label} (-${totales.agenciaTramoInfo.porcentaje}%)`} value={`-${formatCLP(totales.descAgencia)}`} color="#52b870" />}
                {totales.descCupon > 0 && <Row label={`Cupón ${cuponAplicado.codigo}`} value={`-${formatCLP(totales.descCupon)}`} color="#52b870" />}
                <Row label={`IVA (${Math.round(tarifas.iva * 100)}%)`} value={formatCLP(totales.iva)} muted />
              </div>

              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.12)",
                marginTop: 12, paddingTop: 12,
                display: "flex", justifyContent: "space-between", alignItems: "baseline",
              }}>
                <strong style={K({ fontSize: 16, fontWeight: 700 })}>Total con IVA</strong>
                <strong style={K({ fontSize: 24, fontWeight: 700, color: "#52b870", fontVariantNumeric: "tabular-nums" })}>
                  {formatCLP(totales.total)}
                </strong>
              </div>
            </div>

            <div style={{
              display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end",
            }}>
              <button type="button" onClick={copiar}
                style={K({
                  background: "#fff", color: "#0a3d23",
                  border: "none", borderRadius: 6,
                  padding: "12px 22px", fontWeight: 700, fontSize: 14,
                  cursor: "pointer", letterSpacing: "0.02em",
                })}>
                Copiar al portapapeles
              </button>
              <button type="button" onClick={enviarCliente}
                disabled={!puedeEnviar || enviando}
                title={!puedeEnviar ? "Necesita email del cliente válido" : ""}
                style={K({
                  background: puedeEnviar && !enviando ? "#52b870" : "rgba(82,184,112,0.3)",
                  color: "#0a3d23", border: "none", borderRadius: 6,
                  padding: "12px 22px", fontWeight: 700, fontSize: 14,
                  cursor: puedeEnviar && !enviando ? "pointer" : "not-allowed", letterSpacing: "0.02em",
                })}>
                {enviando ? "Enviando..." : "Enviar al cliente por email"}
              </button>
            </div>

            {feedback && (
              <p style={K({
                fontSize: 13, marginTop: 12, textAlign: "right",
                color: feedback.ok ? "#52b870" : "#e87171",
              })}>
                {feedback.ok ? "✓ " : "✗ "}{feedback.msg}
              </p>
            )}
          </div>
        </section>
      )}
    </>
  );
}

function ConfigLinea({ formato, seleccion, linea, onUpdate, onQuitar }) {
  const esFrase = Boolean(formato.horarios);
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: 14,
      display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 18 }}>{formato.icon}</span>
          <strong style={K({ fontSize: 14 })}>{formato.titulo}</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {linea && <strong style={K({ fontSize: 14, color: "#52b870", fontVariantNumeric: "tabular-nums" })}>{formatCLP(linea.subtotal)}</strong>}
          <button type="button" onClick={onQuitar}
            style={K({ background: "transparent", color: "rgba(255,255,255,0.4)", border: "none", fontSize: 11, cursor: "pointer" })}>
            Quitar ✕
          </button>
        </div>
      </div>
      {esFrase
        ? <FraseConfig formato={formato} seleccion={seleccion} onUpdate={onUpdate} />
        : <UnidadConfig formato={formato} seleccion={seleccion} onUpdate={onUpdate} />}
    </div>
  );
}

function FraseConfig({ formato, seleccion, onUpdate }) {
  const horario = formato.horarios.find((h) => h.id === seleccion.horarioId);
  const pack = horario?.packs.find((p) => p.id === seleccion.packId);
  const esPackMensual = pack && pack.id !== "suelta";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
      {formato.horarios.length > 1 && (
        <Select label="Horario" value={seleccion.horarioId}
          options={formato.horarios.map((h) => ({ value: h.id, label: h.label }))}
          onChange={(v) => {
            const nuevo = formato.horarios.find((h) => h.id === v);
            const existe = nuevo.packs.find((p) => p.id === seleccion.packId);
            onUpdate({ horarioId: v, packId: existe ? seleccion.packId : nuevo.packs[0].id });
          }} />
      )}
      <Select label="Pack" value={seleccion.packId}
        options={horario.packs.map((p) => ({ value: p.id, label: `${p.label} · ${formatCLP(p.precioUnitario)}${p.frases > 1 ? "/u" : ""}` }))}
        onChange={(v) => onUpdate({ packId: v })} />
      <NumField label={esPackMensual ? "Meses" : "Cantidad"} value={seleccion.meses} min={1}
        onChange={(v) => onUpdate({ meses: v })} />
    </div>
  );
}

function UnidadConfig({ formato, seleccion, onUpdate }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <Select label="Duración" value={seleccion.unidadId}
        options={formato.unidades.map((u) => ({ value: u.id, label: `${u.label} · ${formatCLP(u.precio)}` }))}
        onChange={(v) => onUpdate({ unidadId: v })} />
      <NumField label="Cantidad" value={seleccion.cantidad} min={1}
        onChange={(v) => onUpdate({ cantidad: v })} />
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </label>
  );
}
function Select({ label, value, options, onChange }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        {options.map((o) => <option key={o.value} value={o.value} style={{ background: "#191919" }}>{o.label}</option>)}
      </select>
    </label>
  );
}
function NumField({ label, value, min, onChange }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
      {label}
      <input type="number" inputMode="numeric" min={min} value={value}
        onChange={(e) => onChange(e.target.value === "" ? "" : Math.max(min ?? 0, Number(e.target.value)))}
        style={inputStyle} />
    </label>
  );
}
function Row({ label, value, muted, color }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
      <span style={K({ fontSize: 13, color: muted ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.8)" })}>{label}</span>
      <strong style={K({ fontSize: 14, color: color || "#fff", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" })}>{value}</strong>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6, padding: "10px 12px",
  color: "#fff", fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, outline: "none",
};
