import React, { useMemo } from "react";
import { K } from "./Layout.jsx";
import {
  calcularLineas,
  formatCLP,
  validarCupon,
  aplicarCupon,
} from "./tarifas.js";

const SectionTitle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, fontWeight: 600,
  color: "rgba(255,255,255,0.5)",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  marginBottom: 16,
};

/**
 * Bloque editable de una propuesta de cotización (formatos + descuentos +
 * cupón + comentarios + totales). Se usa una o dos veces dentro de
 * ArmarCotizacionTab según si el equipo quiere mandar Opción A + Opción B.
 *
 * Props:
 *   - propuesta: { selecciones, pymeActivo, agenciaTramo, cuponInput,
 *     cuponAplicado, cuponError, comentarios }
 *   - onChange: (patch) => void  — merge superficial del estado de la propuesta
 *   - tarifas: el catálogo completo
 *   - etiqueta: texto opcional (ej "Propuesta A") para mostrar arriba
 *   - onQuitar: callback opcional. Si está, muestra botón "Quitar propuesta"
 *
 * Devuelve también los totales calculados a través del callback `onTotales` así
 * el padre puede mostrarlos en la barra de acción / armar el payload.
 */
export default function BloqueCotizacion({
  propuesta,
  onChange,
  tarifas,
  etiqueta,
  onQuitar,
  onTotales,
}) {
  const formatos = tarifas.formatos;
  const dPyme = tarifas.descuentosInternos?.pyme;
  const dAgencia = tarifas.descuentosInternos?.agencia;

  const lineas = useMemo(() => calcularLineas(formatos, propuesta.selecciones || {}), [formatos, propuesta.selecciones]);

  const totales = useMemo(() => {
    const subtotal = lineas.reduce((s, l) => s + l.subtotal, 0);
    const descPyme = propuesta.pymeActivo && dPyme?.porcentaje
      ? Math.round((subtotal * dPyme.porcentaje) / 100) : 0;
    let descAgencia = 0;
    let agenciaTramoInfo = null;
    if (propuesta.agenciaTramo && dAgencia?.tramos) {
      const tramo = dAgencia.tramos.find((t) => t.id === propuesta.agenciaTramo);
      if (tramo) {
        descAgencia = Math.round((subtotal * tramo.porcentaje) / 100);
        agenciaTramoInfo = tramo;
      }
    }
    const descCupon = aplicarCupon(subtotal, propuesta.cuponAplicado);
    const totalDescuentos = descPyme + descAgencia + descCupon;
    const base = Math.max(0, subtotal - totalDescuentos);
    const iva = Math.round(base * tarifas.iva);
    const total = base + iva;
    return { subtotal, descPyme, descAgencia, descCupon, totalDescuentos, base, iva, total, agenciaTramoInfo };
  }, [lineas, propuesta.pymeActivo, propuesta.agenciaTramo, propuesta.cuponAplicado, dPyme, dAgencia, tarifas.iva]);

  // Notificar al padre los datos derivados
  React.useEffect(() => {
    onTotales?.({ lineas, totales });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineas, totales]);

  const toggleFormato = (id) => {
    const s = propuesta.selecciones || {};
    if (s[id]) {
      const next = { ...s };
      delete next[id];
      onChange({ selecciones: next });
      return;
    }
    const f = formatos.find((x) => x.id === id);
    const nueva = f.horarios
      ? { horarioId: f.horarios[0].id, packId: f.horarios[0].packs[1]?.id || f.horarios[0].packs[0].id, meses: 1 }
      : { unidadId: f.unidades[0].id, cantidad: 1, despacho: false };
    onChange({ selecciones: { ...s, [id]: nueva } });
  };
  const updateSeleccion = (id, patch) => {
    onChange({ selecciones: { ...(propuesta.selecciones || {}), [id]: { ...(propuesta.selecciones || {})[id], ...patch } } });
  };

  const aplicarCodigoCupon = () => {
    const { cupon, motivo } = validarCupon(propuesta.cuponInput || "", tarifas.cupones);
    if (cupon) onChange({ cuponAplicado: cupon, cuponError: "" });
    else onChange({ cuponAplicado: null, cuponError: motivo || "Código no válido" });
  };
  const quitarCupon = () => onChange({ cuponAplicado: null, cuponInput: "", cuponError: "" });

  const hayLineas = lineas.length > 0;
  const selecciones = propuesta.selecciones || {};
  const cuponInput = propuesta.cuponInput || "";
  const cuponAplicado = propuesta.cuponAplicado;
  const cuponError = propuesta.cuponError || "";
  const comentarios = propuesta.comentarios || "";

  return (
    <div style={etiqueta ? bloqueEtiquetadoStyle : null}>
      {etiqueta && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
          <h3 style={K({ fontSize: 16, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 8 })}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 26, height: 26, borderRadius: "50%",
              background: "#52b870", color: "#0a3d23",
              fontSize: 13, fontWeight: 800,
            }}>{etiqueta.slice(-1)}</span>
            {etiqueta}
            {hayLineas && (
              <span style={K({ fontSize: 14, color: "#52b870", fontWeight: 600 })}>
                · {formatCLP(totales.total)}
              </span>
            )}
          </h3>
          {onQuitar && (
            <button type="button" onClick={onQuitar}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 12px", fontSize: 12, cursor: "pointer" })}>
              Quitar esta propuesta
            </button>
          )}
        </div>
      )}

      {/* Formatos */}
      <section style={{ marginBottom: 16 }}>
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
      </section>

      {/* Config */}
      {hayLineas && (
        <section style={{ marginBottom: 16 }}>
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
        </section>
      )}

      {/* Descuentos comerciales */}
      {hayLineas && (dPyme || dAgencia) && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={SectionTitle}>Descuentos comerciales</h2>
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, padding: 16,
            display: "flex", flexDirection: "column", gap: 12,
          }}>
            {dPyme && (
              <label style={K({ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 14, cursor: "pointer" })}>
                <input type="checkbox" checked={Boolean(propuesta.pymeActivo)}
                  onChange={(e) => onChange({ pymeActivo: e.target.checked })}
                  style={{ marginTop: 3, accentColor: "#52b870" }} />
                <span>
                  <strong style={{ color: "#fff" }}>{dPyme.label}</strong> · {dPyme.porcentaje}% descuento
                  <br /><span style={K({ fontSize: 12, color: "rgba(255,255,255,0.5)" })}>{dPyme.descripcion}</span>
                </span>
              </label>
            )}
            {dAgencia && (
              <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 14 })}>
                <span>
                  <strong style={{ color: "#fff" }}>{dAgencia.label}</strong>
                  <br /><span style={K({ fontSize: 12, color: "rgba(255,255,255,0.5)" })}>{dAgencia.descripcion}</span>
                </span>
                <select value={propuesta.agenciaTramo || ""} onChange={(e) => onChange({ agenciaTramo: e.target.value })}
                  style={inputStyle}>
                  <option value="" style={{ background: "#191919" }}>Sin precio agencia</option>
                  {dAgencia.tramos.map((t) => (
                    <option key={t.id} value={t.id} style={{ background: "#191919" }}>
                      {t.label} (-{t.porcentaje}%)
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>
      )}

      {/* Cupón */}
      {hayLineas && Array.isArray(tarifas.cupones) && tarifas.cupones.length > 0 && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={SectionTitle}>Cupón / Promoción</h2>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input type="text" value={cuponInput}
              onChange={(e) => onChange({ cuponInput: e.target.value, cuponError: "" })}
              placeholder="Ej: LaUnica1939" disabled={Boolean(cuponAplicado)}
              style={{ ...inputStyle, flex: "1 1 200px" }} />
            {cuponAplicado ? (
              <button type="button" onClick={quitarCupon}
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
        </section>
      )}

      {/* Notas */}
      {hayLineas && (
        <section style={{ marginBottom: 16 }}>
          <h2 style={SectionTitle}>Notas de esta propuesta (van al cliente)</h2>
          <textarea rows={3} value={comentarios}
            onChange={(e) => onChange({ comentarios: e.target.value })}
            placeholder="Vigencia especial, condiciones, programación, qué diferencia esta propuesta…"
            style={{ ...inputStyle, resize: "vertical", minHeight: 70 }} />
        </section>
      )}

      {/* Totales */}
      {hayLineas && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: 16,
        }}>
          {lineas.map((l, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
              <span style={K({ fontSize: 13, color: "rgba(255,255,255,0.8)" })}>{l.detalle}</span>
              <strong style={K({ fontSize: 13, fontVariantNumeric: "tabular-nums" })}>{formatCLP(l.subtotal)}</strong>
            </div>
          ))}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 10, paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
            <Row label="Subtotal" value={formatCLP(totales.subtotal)} />
            {totales.descPyme > 0 && <Row label={`${dPyme.label} (-${dPyme.porcentaje}%)`} value={`-${formatCLP(totales.descPyme)}`} color="#52b870" />}
            {totales.descAgencia > 0 && <Row label={`Agencia · ${totales.agenciaTramoInfo.label} (-${totales.agenciaTramoInfo.porcentaje}%)`} value={`-${formatCLP(totales.descAgencia)}`} color="#52b870" />}
            {totales.descCupon > 0 && <Row label={`Cupón ${cuponAplicado.codigo}`} value={`-${formatCLP(totales.descCupon)}`} color="#52b870" />}
            <Row label={`IVA (${Math.round(tarifas.iva * 100)}%)`} value={formatCLP(totales.iva)} muted />
          </div>

          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.12)",
            marginTop: 10, paddingTop: 10,
            display: "flex", justifyContent: "space-between", alignItems: "baseline",
          }}>
            <strong style={K({ fontSize: 15, fontWeight: 700 })}>Total con IVA</strong>
            <strong style={K({ fontSize: 22, fontWeight: 700, color: "#52b870", fontVariantNumeric: "tabular-nums" })}>
              {formatCLP(totales.total)}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
}

const bloqueEtiquetadoStyle = {
  background: "rgba(82,184,112,0.02)",
  border: "1px solid rgba(82,184,112,0.15)",
  borderRadius: 10, padding: 20, marginBottom: 16,
};

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
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <Select label="Duración" value={seleccion.unidadId}
          options={formato.unidades.map((u) => ({ value: u.id, label: `${u.label} · ${formatCLP(u.precio)}` }))}
          onChange={(v) => onUpdate({ unidadId: v })} />
        <NumField label="Cantidad" value={seleccion.cantidad} min={1}
          onChange={(v) => onUpdate({ cantidad: v })} />
      </div>
      {formato.permiteDespacho && (
        <CheckOption
          checked={Boolean(seleccion.despacho)}
          onChange={(v) => onUpdate({ despacho: v })}
          label={formato.despachoLabel || "Despacho en terreno (+50%)"}
          hint={formato.despachoDescripcion || "Realizada fuera de los estudios. Se aplica el recargo sobre el valor base."}
        />
      )}
    </div>
  );
}

function CheckOption({ checked, onChange, label, hint }) {
  return (
    <label style={K({
      display: "flex", alignItems: "flex-start", gap: 10,
      padding: "10px 12px",
      background: checked ? "rgba(82,184,112,0.08)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${checked ? "rgba(82,184,112,0.35)" : "rgba(255,255,255,0.08)"}`,
      borderRadius: 6, cursor: "pointer", fontSize: 12,
    })}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)}
        style={{ marginTop: 2, accentColor: "#52b870", cursor: "pointer" }} />
      <span style={{ flex: 1 }}>
        <span style={K({ display: "block", color: "rgba(255,255,255,0.85)", fontWeight: 600, marginBottom: 2 })}>{label}</span>
        {hint && <span style={K({ display: "block", color: "rgba(255,255,255,0.5)", fontSize: 11, lineHeight: 1.4 })}>{hint}</span>}
      </span>
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
      <strong style={K({ fontSize: 13, color: color || "#fff", whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" })}>{value}</strong>
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
