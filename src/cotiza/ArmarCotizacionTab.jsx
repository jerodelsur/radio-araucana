import React, { useCallback, useEffect, useState } from "react";
import { K } from "./Layout.jsx";
import { formatCLP } from "./tarifas.js";
import BloqueCotizacion from "./BloqueCotizacion.jsx";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 16,
};

function propuestaVacia() {
  return {
    selecciones: {},
    pymeActivo: false,
    agenciaTramo: "",
    cuponInput: "",
    cuponAplicado: null,
    cuponError: "",
    comentarios: "",
  };
}

/**
 * Tab "Armar cotización" del panel admin. Coordina cliente + 1 o 2 propuestas
 * (BloqueCotizacion) + acciones de envío. Si solicitudPrecargada viene, llena
 * el cliente y pre-selecciona formatos en la propuesta A.
 */
export default function ArmarCotizacionTab({
  tarifas,
  token,
  onLogout,
  solicitudPrecargada,
  onSolicitudAtendida,
}) {
  const [cliente, setCliente] = useState({ nombre: "", empresa: "", telefono: "", email: "" });
  const [propA, setPropA] = useState(propuestaVacia);
  const [propB, setPropB] = useState(null); // null si no se activó segunda propuesta
  const [datosA, setDatosA] = useState({ lineas: [], totales: null });
  const [datosB, setDatosB] = useState({ lineas: [], totales: null });
  const [feedback, setFeedback] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [solicitudActiva, setSolicitudActiva] = useState(null);

  const formatos = tarifas.formatos;
  const dPyme = tarifas.descuentosInternos?.pyme;
  const dAgencia = tarifas.descuentosInternos?.agencia;

  const updatePropA = useCallback((patch) => setPropA((s) => ({ ...s, ...patch })), []);
  const updatePropB = useCallback((patch) => setPropB((s) => (s ? { ...s, ...patch } : s)), []);

  const agregarSegundaPropuesta = () => setPropB(propuestaVacia());
  const quitarSegundaPropuesta = () => setPropB(null);

  const reset = (mantenerCliente = false) => {
    if (!mantenerCliente) setCliente({ nombre: "", empresa: "", telefono: "", email: "" });
    setPropA(propuestaVacia());
    setPropB(null);
    setSolicitudActiva(null);
    setFeedback(null);
  };

  const marcarSolicitudAtendida = useCallback(async (id, total) => {
    try {
      await fetch("/api/cotiza/atender-solicitud", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, estado: "atendida", cotizacionTotal: total }),
      });
      setSolicitudActiva(null);
      onSolicitudAtendida?.();
    } catch (e) {
      console.warn("No se pudo marcar atendida:", e?.message);
    }
  }, [token, onSolicitudAtendida]);

  const precargarSolicitud = useCallback((sol) => {
    setCliente({
      nombre: sol.cliente_nombre || "",
      empresa: sol.cliente_empresa || "",
      telefono: sol.cliente_telefono || "",
      email: sol.cliente_email || "",
    });
    const nuevasSel = {};
    (sol.pedido || []).forEach((p) => {
      const f = formatos.find((x) => x.id === p.formatoId);
      if (!f) return;
      if (f.horarios) {
        nuevasSel[f.id] = {
          horarioId: f.horarios[0].id,
          packId: f.horarios[0].packs[1]?.id || f.horarios[0].packs[0].id,
          meses: 1,
        };
      } else {
        nuevasSel[f.id] = { unidadId: f.unidades[0].id, cantidad: 1 };
      }
    });
    const necesidades = (sol.pedido || [])
      .filter((p) => p.necesidad)
      .map((p) => `${p.titulo}: ${p.necesidad}`)
      .join("\n");
    const partes = [];
    if (necesidades) partes.push("Lo que pidió el cliente:\n" + necesidades);
    if (sol.comentarios) partes.push("Comentarios: " + sol.comentarios);
    setPropA({ ...propuestaVacia(), selecciones: nuevasSel, comentarios: partes.join("\n\n") });
    setPropB(null);
    setSolicitudActiva(sol.id);
    setFeedback(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 50);
  }, [formatos]);

  useEffect(() => {
    if (solicitudPrecargada) precargarSolicitud(solicitudPrecargada);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solicitudPrecargada?.id]);

  const hayLineasA = (datosA.lineas || []).length > 0;
  const hayLineasB = propB && (datosB.lineas || []).length > 0;
  const hayAlgo = hayLineasA || hayLineasB;
  const propuestaBincompleta = propB && !hayLineasB;
  const clienteEmailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email.trim());
  const puedeEnviarEmail = hayAlgo && !propuestaBincompleta && clienteEmailValido;

  const propuestaPayload = (prop, datos) => {
    if (!datos.totales) return null;
    return {
      lineas: datos.lineas.map((l) => ({ detalle: l.detalle, subtotal: l.subtotal })),
      subtotal: datos.totales.subtotal,
      descuento_pyme: datos.totales.descPyme,
      descuento_agencia: datos.totales.descAgencia,
      descuento_cupon: datos.totales.descCupon,
      iva: datos.totales.iva,
      total: datos.totales.total,
      pyme_aplicado: Boolean(prop.pymeActivo),
      agencia_tramo: datos.totales.agenciaTramoInfo?.label || null,
      cupon_codigo: prop.cuponAplicado?.codigo || null,
      cupon_descripcion: prop.cuponAplicado?.descripcion || null,
      comentarios: (prop.comentarios || "").trim() || null,
      descPyme: datos.totales.descPyme ? { label: dPyme.label, porcentaje: dPyme.porcentaje, monto: datos.totales.descPyme } : null,
      descAgencia: datos.totales.descAgencia ? { label: datos.totales.agenciaTramoInfo.label, porcentaje: datos.totales.agenciaTramoInfo.porcentaje, monto: datos.totales.descAgencia } : null,
      cupon: prop.cuponAplicado ? { codigo: prop.cuponAplicado.codigo, descripcion: prop.cuponAplicado.descripcion || "", monto: datos.totales.descCupon } : null,
    };
  };

  const buildBody = (envViaa) => {
    const a = propuestaPayload(propA, datosA);
    const b = propB ? propuestaPayload(propB, datosB) : null;
    return {
      cliente: {
        nombre: cliente.nombre.trim() || "Cliente",
        empresa: cliente.empresa.trim(),
        telefono: cliente.telefono.trim(),
        email: cliente.email.trim(),
      },
      propuesta_a: a,
      propuesta_b: b,
      // Backward compat: muchos endpoints aún leen el formato plano de propuesta A
      ...a,
      iva: a?.iva,
      enviada_via: envViaa,
      enviada_a: envViaa === "whatsapp" ? cliente.telefono.trim() : cliente.email.trim(),
      solicitudId: solicitudActiva || null,
      solicitud_id: solicitudActiva || null,
    };
  };

  const enviarCliente = async () => {
    if (!puedeEnviarEmail || enviando) return;
    setFeedback(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/cotiza/enviar-cliente", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildBody("email")),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { onLogout(); return; }
        setFeedback({ ok: false, msg: data.message || data.error || `Error ${r.status}` });
      } else {
        const numero = data.cotizacion?.numero ? ` (${data.cotizacion.numero})` : "";
        setFeedback({ ok: true, msg: `Enviado a ${cliente.email.trim()}${numero}` });
        if (solicitudActiva) await marcarSolicitudAtendida(solicitudActiva, datosA.totales?.total || 0);
      }
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Error de red" });
    } finally {
      setEnviando(false);
    }
  };

  const guardarComoEnviada = async (via) => {
    if (!hayAlgo || propuestaBincompleta || enviando) return;
    setFeedback(null);
    setEnviando(true);
    try {
      const r = await fetch("/api/cotiza/guardar-cotizacion", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(buildBody(via)),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (r.status === 401) { onLogout(); return; }
        setFeedback({ ok: false, msg: data.error || `Error ${r.status}` });
      } else {
        const numero = data.cotizacion?.numero || "";
        setFeedback({ ok: true, msg: `Cotización ${numero} guardada como enviada por ${via === "whatsapp" ? "WhatsApp" : via}` });
        if (solicitudActiva) await marcarSolicitudAtendida(solicitudActiva, datosA.totales?.total || 0);
      }
    } catch (e) {
      setFeedback({ ok: false, msg: e?.message || "Error de red" });
    } finally {
      setEnviando(false);
    }
  };

  const copiar = async () => {
    if (!hayAlgo) return;
    setFeedback(null);
    try {
      await navigator.clipboard.writeText(textoCotizacion({ cliente, propA, datosA, propB, datosB, dPyme, ivaRate: tarifas.iva }));
      setFeedback({ ok: true, msg: "Copiado al portapapeles" });
    } catch (e) {
      setFeedback({ ok: false, msg: "No se pudo copiar: " + (e?.message || "error") });
    }
  };

  return (
    <>
      {solicitudActiva && (
        <section style={{ padding: "0 0 16px" }}>
          <div style={{
            background: "rgba(82,184,112,0.08)", border: "1px solid rgba(82,184,112,0.3)",
            borderRadius: 8, padding: "12px 16px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, flexWrap: "wrap",
          }}>
            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.85)" })}>
              <span style={{ color: "#52b870", fontWeight: 600 }}>● Cotizando solicitud del público.</span>
              {" "}Al enviar, se marca como atendida automáticamente.
            </p>
            <button type="button" onClick={() => reset(false)}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" })}>
              Descartar precarga
            </button>
          </div>
        </section>
      )}

      {/* Cliente compartido */}
      <section style={{ marginBottom: 24 }}>
        <h2 style={SectionTitle}>Cliente (opcional, requerido para enviar por email)</h2>
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: 16,
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}>
          <Field label="Nombre" value={cliente.nombre} onChange={(v) => setCliente((c) => ({ ...c, nombre: v }))} placeholder="Nombre del cliente" />
          <Field label="Empresa" value={cliente.empresa} onChange={(v) => setCliente((c) => ({ ...c, empresa: v }))} placeholder="Empresa o agrupación" />
          <Field label="Teléfono" value={cliente.telefono} onChange={(v) => setCliente((c) => ({ ...c, telefono: v }))} placeholder="+56 9 ..." type="tel" />
          <Field label="Email" value={cliente.email} onChange={(v) => setCliente((c) => ({ ...c, email: v }))} placeholder="cliente@correo.cl" type="email" />
        </div>
      </section>

      {/* Bloque A */}
      <BloqueCotizacion
        propuesta={propA} onChange={updatePropA} tarifas={tarifas}
        etiqueta={propB ? "Propuesta A" : null}
        onTotales={setDatosA}
      />

      {/* Bloque B (opcional) */}
      {propB && (
        <BloqueCotizacion
          propuesta={propB} onChange={updatePropB} tarifas={tarifas}
          etiqueta="Propuesta B" onQuitar={quitarSegundaPropuesta}
          onTotales={setDatosB}
        />
      )}

      {/* Botón agregar segunda propuesta */}
      {!propB && (
        <div style={{ marginTop: 12, marginBottom: 16, textAlign: "center" }}>
          <button type="button" onClick={agregarSegundaPropuesta}
            disabled={!hayLineasA}
            title={!hayLineasA ? "Primero configura al menos un formato en la propuesta principal" : ""}
            style={K({
              background: hayLineasA ? "rgba(82,184,112,0.15)" : "rgba(255,255,255,0.04)",
              color: hayLineasA ? "#52b870" : "rgba(255,255,255,0.3)",
              border: `1px dashed ${hayLineasA ? "rgba(82,184,112,0.5)" : "rgba(255,255,255,0.15)"}`,
              borderRadius: 8, padding: "12px 22px",
              fontWeight: 600, fontSize: 13,
              cursor: hayLineasA ? "pointer" : "not-allowed",
            })}>
            + Agregar segunda propuesta (Opción B)
          </button>
          {!hayLineasA && (
            <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 8, fontStyle: "italic" })}>
              Configura primero la propuesta principal para poder agregar una alternativa.
            </p>
          )}
        </div>
      )}

      {/* Acciones */}
      <section style={{ marginTop: 16, marginBottom: 16 }}>
        <div style={{
          display: "flex", flexWrap: "wrap", gap: 12,
          alignItems: "flex-end", justifyContent: "space-between",
          padding: 16, background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
        }}>
          <div>
            {datosA.totales && (
              <p style={K({ fontSize: 14, fontWeight: 600 })}>
                Propuesta {propB ? "A" : null} · {formatCLP(datosA.totales.total)}
              </p>
            )}
            {propB && datosB.totales && (
              <p style={K({ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)" })}>
                Propuesta B · {formatCLP(datosB.totales.total)}
              </p>
            )}
            {!hayAlgo && (
              <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)" })}>
                Selecciona al menos un formato para cotizar.
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={copiar} disabled={!hayAlgo || enviando}
              style={K({
                background: "#fff", color: "#0a3d23", border: "none", borderRadius: 6,
                padding: "12px 22px", fontWeight: 700, fontSize: 14,
                cursor: hayAlgo && !enviando ? "pointer" : "not-allowed",
                opacity: hayAlgo && !enviando ? 1 : 0.45,
              })}>
              Copiar al portapapeles
            </button>
            <button type="button" onClick={() => guardarComoEnviada("whatsapp")}
              disabled={!hayAlgo || propuestaBincompleta || enviando}
              title={!hayAlgo ? "Selecciona al menos un formato" : (propuestaBincompleta ? "Completa la Propuesta B o quítala" : "Registra la cotización como enviada por WhatsApp")}
              style={K({
                background: hayAlgo && !propuestaBincompleta && !enviando ? "rgba(37,211,102,0.95)" : "rgba(37,211,102,0.3)",
                color: "#0a3d23", border: "none", borderRadius: 6,
                padding: "12px 22px", fontWeight: 700, fontSize: 14,
                cursor: hayAlgo && !propuestaBincompleta && !enviando ? "pointer" : "not-allowed",
              })}>
              Marcar enviada por WhatsApp
            </button>
            <button type="button" onClick={enviarCliente}
              disabled={!puedeEnviarEmail || enviando}
              title={!clienteEmailValido ? "Necesita email del cliente válido" : (propuestaBincompleta ? "Completa la Propuesta B o quítala" : "")}
              style={K({
                background: puedeEnviarEmail && !enviando ? "#52b870" : "rgba(82,184,112,0.3)",
                color: "#0a3d23", border: "none", borderRadius: 6,
                padding: "12px 22px", fontWeight: 700, fontSize: 14,
                cursor: puedeEnviarEmail && !enviando ? "pointer" : "not-allowed",
              })}>
              {enviando ? "Enviando..." : "Enviar al cliente por email"}
            </button>
          </div>
        </div>
        {feedback && (
          <p style={K({
            fontSize: 13, marginTop: 12, textAlign: "right",
            color: feedback.ok ? "#52b870" : "#e87171",
          })}>
            {feedback.ok ? "✓ " : "✗ "}{feedback.msg}
          </p>
        )}
      </section>
    </>
  );
}

function textoCotizacion({ cliente, propA, datosA, propB, datosB, dPyme, ivaRate }) {
  const out = [];
  out.push("Radio Araucana 95.9 FM — Cotización publicidad");
  out.push("=".repeat(48));
  if (cliente.nombre.trim()) out.push(`Para: ${cliente.nombre.trim()}${cliente.empresa.trim() ? " · " + cliente.empresa.trim() : ""}`);
  out.push(`Fecha: ${new Date().toLocaleDateString("es-CL")}`);

  const pintarProp = (titulo, prop, datos) => {
    if (!datos.totales) return;
    if (titulo) {
      out.push("");
      out.push(`─── ${titulo} ───`);
    }
    out.push("");
    out.push("DETALLE:");
    datos.lineas.forEach((l) => out.push(`  • ${l.detalle} — ${formatCLP(l.subtotal)}`));
    out.push("");
    out.push(`Subtotal:        ${formatCLP(datos.totales.subtotal)}`);
    if (datos.totales.descPyme > 0) out.push(`${dPyme.label} (${dPyme.porcentaje}%): -${formatCLP(datos.totales.descPyme)}`);
    if (datos.totales.descAgencia > 0) out.push(`Precio Agencia · ${datos.totales.agenciaTramoInfo.label} (${datos.totales.agenciaTramoInfo.porcentaje}%): -${formatCLP(datos.totales.descAgencia)}`);
    if (datos.totales.descCupon > 0) out.push(`Cupón ${prop.cuponAplicado?.codigo}: -${formatCLP(datos.totales.descCupon)}`);
    out.push(`IVA (${Math.round(ivaRate * 100)}%):    ${formatCLP(datos.totales.iva)}`);
    out.push("");
    out.push(`TOTAL CON IVA:   ${formatCLP(datos.totales.total)}`);
    if ((prop.comentarios || "").trim()) {
      out.push("");
      out.push("Notas:");
      out.push(prop.comentarios.trim());
    }
  };

  pintarProp(propB ? "Propuesta A" : null, propA, datosA);
  if (propB) pintarProp("Propuesta B", propB, datosB);

  out.push("");
  out.push("Cotización referencial, vigente por 14 días desde la fecha de emisión.");
  out.push("Valores sujetos a corrección por errores involuntarios; en caso de discrepancia,");
  out.push("prevalecen las tarifas vigentes al cerrar el contrato.");
  out.push("Radio Araucana · cotizaciones@araucanayfrontera.cl · +56 9 9287 2087");
  return out.join("\n");
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
      {label}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{
          width: "100%", background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)", borderRadius: 6,
          padding: "10px 12px", color: "#fff", fontFamily: "'Open Sans', sans-serif",
          fontSize: 13, outline: "none",
        }} />
    </label>
  );
}
