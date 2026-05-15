import React, { useEffect, useState } from "react";
import { K } from "./Layout.jsx";
import { formatCLP, TARIFAS_DEFAULT } from "./tarifas.js";
import LoginAdmin from "./LoginAdmin.jsx";

const STORAGE_KEY = "cotiza_admin_token";

export default function Admin() {
  const [token, setToken] = useState(() => sessionStorage.getItem(STORAGE_KEY) || "");
  const [autenticado, setAutenticado] = useState(() => Boolean(sessionStorage.getItem(STORAGE_KEY)));
  const [tarifas, setTarifas] = useState(null);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [resultadoGuardar, setResultadoGuardar] = useState(null);

  useEffect(() => {
    if (!autenticado) return;
    fetch("/api/cotiza/tarifas", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setTarifas(data))
      .catch((e) => setErrorCarga(e?.message || String(e)));
  }, [autenticado]);

  const intentarLogin = (t) => {
    sessionStorage.setItem(STORAGE_KEY, t);
    setToken(t);
    setAutenticado(true);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setToken("");
    setAutenticado(false);
    setTarifas(null);
  };

  const guardar = async () => {
    setGuardando(true);
    setResultadoGuardar(null);
    try {
      const r = await fetch("/api/cotiza/save-tarifas", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(tarifas),
      });
      const data = await r.json();
      if (!r.ok) {
        setResultadoGuardar({ ok: false, msg: data.error || "Error al guardar" });
        if (r.status === 401) logout();
      } else {
        setResultadoGuardar({ ok: true, msg: `Guardado · ${data.savedAt}` });
      }
    } catch (e) {
      setResultadoGuardar({ ok: false, msg: e?.message || String(e) });
    } finally {
      setGuardando(false);
    }
  };

  const resetADefault = () => {
    if (!confirm("¿Restablecer a los precios bundled? Esto reemplaza los precios actuales del editor (no se guarda hasta que presiones Guardar).")) return;
    setTarifas(structuredClone(TARIFAS_DEFAULT));
  };

  if (!autenticado) {
    return <LoginAdmin titulo="Editor de tarifas" descripcion="Ingresa la contraseña de administración para editar los precios del cotizador." onLogin={intentarLogin} />;
  }

  if (!tarifas) {
    return <p style={{ padding: 80, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
      {errorCarga ? `Error: ${errorCarga}` : "Cargando…"}
    </p>;
  }

  const updateFormato = (idx, patch) => {
    setTarifas((t) => ({
      ...t,
      formatos: t.formatos.map((f, i) => (i === idx ? { ...f, ...patch } : f)),
    }));
  };
  const updatePackPrecio = (formatoIdx, horarioIdx, packIdx, valor) => {
    setTarifas((t) => ({
      ...t,
      formatos: t.formatos.map((f, i) => {
        if (i !== formatoIdx) return f;
        return {
          ...f,
          horarios: f.horarios.map((h, j) => {
            if (j !== horarioIdx) return h;
            return {
              ...h,
              packs: h.packs.map((p, k) => k === packIdx ? { ...p, precioUnitario: Math.max(0, Number(valor) || 0) } : p),
            };
          }),
        };
      }),
    }));
  };
  const updateUnidadPrecio = (formatoIdx, unidadIdx, valor) => {
    setTarifas((t) => ({
      ...t,
      formatos: t.formatos.map((f, i) => {
        if (i !== formatoIdx) return f;
        return {
          ...f,
          unidades: f.unidades.map((u, j) => j === unidadIdx ? { ...u, precio: Math.max(0, Number(valor) || 0) } : u),
        };
      }),
    }));
  };

  const updateCupon = (idx, patch) => {
    setTarifas((t) => ({
      ...t,
      cupones: t.cupones.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  };
  const addCupon = () => {
    setTarifas((t) => ({
      ...t,
      cupones: [...(t.cupones || []), {
        codigo: generarCodigoAraucana(),
        tipo: "porcentaje", valor: 10,
        descripcion: "", expiraEn: "", maxUsos: null, usosActuales: 0, activo: true,
      }],
    }));
  };
  const regenerarCodigo = (idx) => {
    updateCupon(idx, { codigo: generarCodigoAraucana() });
  };
  const removeCupon = (idx) => {
    setTarifas((t) => ({ ...t, cupones: t.cupones.filter((_, i) => i !== idx) }));
  };

  return (
    <section style={{ padding: "32px 24px 64px" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <h1 style={K({ fontSize: 24, fontWeight: 700, marginBottom: 4 })}>Editor de tarifas</h1>
            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)" })}>
              Actualizado: {tarifas.actualizado || "—"}
            </p>
          </div>
          <button type="button" onClick={logout}
            style={K({ background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, padding: "8px 14px", fontSize: 12, cursor: "pointer" })}>
            Cerrar sesión
          </button>
        </div>

        {/* IVA */}
        <div style={cardStyle}>
          <h2 style={subtitleStyle}>Configuración general</h2>
          <label style={K({ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, color: "rgba(255,255,255,0.55)", maxWidth: 200 })}>
            IVA (decimal, ej: 0.19)
            <input type="number" step="0.01" min="0" max="1" value={tarifas.iva}
              onChange={(e) => setTarifas((t) => ({ ...t, iva: Number(e.target.value) }))}
              style={inputStyle} />
          </label>
        </div>

        {/* Formatos */}
        {tarifas.formatos.map((f, fIdx) => (
          <div key={f.id} style={cardStyle}>
            <h2 style={subtitleStyle}>
              <span style={{ fontSize: 18, marginRight: 8 }}>{f.icon}</span>
              {f.titulo} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 400, fontSize: 13 }}>· {f.duracion}</span>
            </h2>

            {f.horarios && f.horarios.map((h, hIdx) => (
              <div key={h.id} style={{ marginTop: 16 }}>
                <p style={K({ fontSize: 13, fontWeight: 600, color: "#52b870", marginBottom: 10 })}>{h.label}</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {h.packs.map((p, pIdx) => (
                    <label key={p.id}
                      style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
                      {p.label}
                      <input type="number" min="0" step="100" value={p.precioUnitario}
                        onChange={(e) => updatePackPrecio(fIdx, hIdx, pIdx, e.target.value)}
                        style={inputStyle} />
                      <span style={K({ fontSize: 10, color: "rgba(255,255,255,0.4)" })}>
                        ${p.precioUnitario.toLocaleString("es-CL")} {p.frases > 1 ? `· total ${formatCLP(p.precioUnitario * p.frases)}` : "/u"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {f.unidades && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10, marginTop: 12 }}>
                {f.unidades.map((u, uIdx) => (
                  <label key={u.id}
                    style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
                    {u.label}
                    <input type="number" min="0" step="1000" value={u.precio}
                      onChange={(e) => updateUnidadPrecio(fIdx, uIdx, e.target.value)}
                      style={inputStyle} />
                  </label>
                ))}
              </div>
            )}

            <label style={K({ display: "block", marginTop: 14, fontSize: 11, color: "rgba(255,255,255,0.45)" })}>
              Descripción (visible para el cliente)
              <textarea rows={2} value={f.descripcion}
                onChange={(e) => updateFormato(fIdx, { descripcion: e.target.value })}
                style={{ ...inputStyle, marginTop: 4, resize: "vertical" }} />
            </label>
          </div>
        ))}

        {/* Cupones */}
        <div style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={subtitleStyle}>Cupones de descuento</h2>
            <button type="button" onClick={addCupon}
              style={K({ background: "rgba(82,184,112,0.15)", color: "#52b870", border: "1px solid rgba(82,184,112,0.4)", borderRadius: 6, padding: "6px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" })}>
              + Agregar cupón
            </button>
          </div>
          {(!tarifas.cupones || tarifas.cupones.length === 0) ? (
            <p style={K({ fontSize: 13, color: "rgba(255,255,255,0.5)", fontStyle: "italic" })}>
              Sin cupones activos. Agrega uno para ofrecer promociones temporales.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {tarifas.cupones.map((c, i) => {
                const usosRestantes = Number.isFinite(c.maxUsos) && c.maxUsos > 0
                  ? Math.max(0, c.maxUsos - (Number(c.usosActuales) || 0))
                  : null;
                return (
                  <div key={i} style={{
                    padding: 14,
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 8,
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 0.7fr 0.7fr 1.5fr auto", gap: 8, alignItems: "end" }}>
                      <Cell label="Código">
                        <div style={{ display: "flex", gap: 6 }}>
                          <input value={c.codigo} placeholder="LaUnica1939"
                            onChange={(e) => updateCupon(i, { codigo: e.target.value })}
                            style={{ ...inputStyle, flex: 1 }} />
                          <button type="button" onClick={() => regenerarCodigo(i)}
                            title="Generar código aleatorio"
                            style={K({
                              background: "rgba(82,184,112,0.15)", color: "#52b870",
                              border: "1px solid rgba(82,184,112,0.4)",
                              borderRadius: 6, padding: "0 10px", fontSize: 14,
                              cursor: "pointer", flexShrink: 0,
                            })}>
                            🎲
                          </button>
                        </div>
                      </Cell>
                      <Cell label="Tipo">
                        <select value={c.tipo}
                          onChange={(e) => updateCupon(i, { tipo: e.target.value })}
                          style={inputStyle}>
                          <option value="porcentaje" style={{ background: "#191919" }}>Porcentaje</option>
                          <option value="monto" style={{ background: "#191919" }}>Monto CLP</option>
                        </select>
                      </Cell>
                      <Cell label={c.tipo === "porcentaje" ? "% Off" : "$ Off"}>
                        <input type="number" min="0" value={c.valor}
                          onChange={(e) => updateCupon(i, { valor: Number(e.target.value) || 0 })}
                          style={inputStyle} />
                      </Cell>
                      <Cell label="Descripción">
                        <input value={c.descripcion || ""} placeholder="Descuento de invierno"
                          onChange={(e) => updateCupon(i, { descripcion: e.target.value })}
                          style={inputStyle} />
                      </Cell>
                      <button type="button" onClick={() => removeCupon(i)}
                        style={K({ background: "transparent", color: "#e87171", border: "1px solid rgba(232,113,113,0.4)", borderRadius: 6, padding: "10px 12px", fontSize: 12, cursor: "pointer" })}>
                        Eliminar
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 10 }}>
                      <Cell label="Expira (opcional)">
                        <input type="date" value={c.expiraEn ? String(c.expiraEn).slice(0, 10) : ""}
                          onChange={(e) => updateCupon(i, { expiraEn: e.target.value || "" })}
                          style={inputStyle} />
                      </Cell>
                      <Cell label="Máx. usos (vacío = ilimitado)">
                        <input type="number" min="0" value={c.maxUsos ?? ""}
                          placeholder="Ej: 1, 10, 50…"
                          onChange={(e) => updateCupon(i, { maxUsos: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) })}
                          style={inputStyle} />
                      </Cell>
                      <Cell label="Estado">
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 0", fontSize: 12 }}>
                          <label style={{ display: "flex", alignItems: "center", gap: 4, color: "rgba(255,255,255,0.6)" }}>
                            <input type="checkbox" checked={c.activo !== false}
                              onChange={(e) => updateCupon(i, { activo: e.target.checked })}
                              style={{ accentColor: "#52b870" }} />
                            Activo
                          </label>
                          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>
                            {usosRestantes !== null ? `· ${usosRestantes}/${c.maxUsos} disponibles` : ""}
                          </span>
                        </div>
                      </Cell>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky save bar */}
        <div style={{
          position: "sticky", bottom: 16,
          background: "rgba(25,25,25,0.96)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(82,184,112,0.3)",
          borderRadius: 10, padding: 14,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, flexWrap: "wrap",
          boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
        }}>
          <div>
            <p style={K({ fontSize: 13, color: "#fff", fontWeight: 600 })}>
              {resultadoGuardar ? (
                <span style={{ color: resultadoGuardar.ok ? "#52b870" : "#e87171" }}>{resultadoGuardar.msg}</span>
              ) : "Cambios sin guardar"}
            </p>
            <p style={K({ fontSize: 11, color: "rgba(255,255,255,0.4)" })}>
              Los precios se aplican apenas guardes. Afectan a quien entre a /cotiza después de esto.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" onClick={resetADefault}
              style={K({ background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "10px 16px", fontWeight: 600, fontSize: 13, cursor: "pointer" })}>
              Restablecer
            </button>
            <button type="button" onClick={guardar} disabled={guardando}
              style={K({
                background: "#52b870", color: "#0a3d23",
                border: "none", borderRadius: 6, padding: "10px 20px",
                fontWeight: 700, fontSize: 13,
                cursor: guardando ? "wait" : "pointer", opacity: guardando ? 0.6 : 1,
              })}>
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Cell({ label, children }) {
  return (
    <label style={K({ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, color: "rgba(255,255,255,0.55)" })}>
      {label}
      {children}
    </label>
  );
}

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10, padding: 20, marginBottom: 20,
};

const subtitleStyle = {
  fontFamily: "'Open Sans', sans-serif",
  fontSize: 15, fontWeight: 600,
  marginBottom: 6, color: "#fff",
};

/* ─── Generador de códigos Araucana-flavor ────────────────────────────────── */
const PREFIJOS_CUPON = [
  "LaUnica",       // La única radio histórica
  "LaHistorica",   // 65+ años en el aire
  "LaPionera",     // Primera FM de Chile, 1960
  "La959",         // 95.9 FM
  "Araucana",      // Marca
  "AlAire",        // Estar al aire
  "Cerro",         // Cerro Ñielol
  "Niielol",       // (intencional, fonético amigable)
];

function generarCodigoAraucana() {
  const pref = PREFIJOS_CUPON[Math.floor(Math.random() * PREFIJOS_CUPON.length)];
  const numero = Math.floor(1000 + Math.random() * 9000); // 1000-9999
  return `${pref}${numero}`;
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 6, padding: "10px 12px",
  color: "#fff", fontFamily: "'Open Sans', sans-serif",
  fontSize: 13, outline: "none",
};
