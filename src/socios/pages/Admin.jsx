import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getSupabase } from "../lib/supabase.js";
import { currentMes, mesLabel } from "../lib/format.js";

function Field({ label, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">{label}</label>
      {hint && <p className="text-xs text-[#9C8E85] -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function Input({ type = "text", value, onChange, placeholder, ...props }) {
  return (
    <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 focus-within:ring-[#B91C1C]/40"
      style={{ transition: "box-shadow 200ms" }}>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none"
        {...props}
      />
    </div>
  );
}

function MoneyInput({ value, onChange, placeholder }) {
  return (
    <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 flex items-center gap-2 focus-within:ring-[#B91C1C]/40"
      style={{ transition: "box-shadow 200ms" }}>
      <span className="text-sm text-[#9C8E85] select-none">$</span>
      <input
        type="number"
        min="0"
        value={value}
        onChange={onChange}
        placeholder={placeholder || "0"}
        className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none tabular-nums"
      />
    </div>
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 focus-within:ring-[#B91C1C]/40"
      style={{ transition: "box-shadow 200ms" }}>
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none resize-none leading-relaxed"
      />
    </div>
  );
}

// ─── Sección Documentos ───────────────────────────────────────────────────────

const DOC_EMPTY = { titulo: "", descripcion: "", categoria: "Financiero", url: "", orden: 0, publicado: true };
const CATEGORIAS = ["Financiero", "Audiencia", "Legal", "Directorio", "Otro"];

function SeccionDocumentos() {
  const [docs, setDocs] = useState([]);
  const [form, setForm] = useState(DOC_EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const { data } = await sb.from("socios_documentos")
        .select("*").order("categoria").order("orden");
      setDocs(data || []);
    }
    load();
  }, []);

  function setF(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.titulo.trim() || !form.url.trim()) { setError("Título y URL son obligatorios."); return; }
    setError(""); setSaving(true);
    const sb = getSupabase();
    const { data, error: err } = await sb.from("socios_documentos")
      .insert({ ...form, orden: Number(form.orden) || 0 })
      .select().single();
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDocs(d => [...d, data]);
    setForm(DOC_EMPTY);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  async function handleDelete(id) {
    if (!confirm("¿Eliminar este documento?")) return;
    setDeleting(id);
    const sb = getSupabase();
    await sb.from("socios_documentos").delete().eq("id", id);
    setDocs(d => d.filter(x => x.id !== id));
    setDeleting(null);
  }

  async function togglePublicado(doc) {
    const sb = getSupabase();
    await sb.from("socios_documentos").update({ publicado: !doc.publicado }).eq("id", doc.id);
    setDocs(d => d.map(x => x.id === doc.id ? { ...x, publicado: !x.publicado } : x));
  }

  const grupos = docs.reduce((acc, d) => {
    const c = d.categoria || "General";
    if (!acc[c]) acc[c] = [];
    acc[c].push(d); return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {/* Lista existente */}
      {docs.length > 0 && (
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Documentos publicados</h2>
            <div className="flex flex-col gap-6">
              {Object.entries(grupos).map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[11px] font-700 uppercase tracking-[0.18em] text-[#BDB5AD] mb-2">{cat}</p>
                  <div className="flex flex-col gap-2">
                    {items.map(doc => (
                      <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F3EE]">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-500 text-[#18110C] truncate">{doc.titulo}</p>
                          {doc.descripcion && <p className="text-xs text-[#9C8E85] truncate">{doc.descripcion}</p>}
                        </div>
                        <button
                          onClick={() => togglePublicado(doc)}
                          className={`text-xs rounded-full px-2.5 py-1 font-medium transition-colors ${doc.publicado ? "bg-emerald-50 text-emerald-700" : "bg-[#EDE9E2] text-[#9C8E85]"}`}
                        >
                          {doc.publicado ? "Visible" : "Oculto"}
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          disabled={deleting === doc.id}
                          className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#9C8E85] hover:text-red-600 hover:bg-red-50 ring-1 ring-black/5 transition-colors"
                        >
                          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3 h-3">
                            <path d="M2 2l10 10M12 2L2 12" strokeLinecap="round" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Agregar nuevo */}
      <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
        <form onSubmit={handleAdd} className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
          style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
          <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Agregar documento</h2>
          {error && <div className="mb-4 rounded-xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">Título</label>
              <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3">
                <input value={form.titulo} onChange={setF("titulo")} placeholder="Ej: Balance 2025"
                  className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">Descripción <span className="normal-case font-400 text-[#9C8E85]">(opcional)</span></label>
              <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3">
                <input value={form.descripcion} onChange={setF("descripcion")} placeholder="Ej: Balance general auditado del ejercicio 2025"
                  className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">URL del documento</label>
              <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3">
                <input value={form.url} onChange={setF("url")} placeholder="https://drive.google.com/file/d/..."
                  type="url" className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none" />
              </div>
              <p className="text-xs text-[#9C8E85]">Pega el enlace de Google Drive (asegúrate de que tenga acceso "Cualquier persona con el enlace").</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">Categoría</label>
              <div className="relative">
                <select value={form.categoria} onChange={setF("categoria")}
                  className="w-full appearance-none rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 pr-8 py-3 text-sm text-[#18110C] outline-none">
                  {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
                </select>
                <svg viewBox="0 0 16 16" fill="none" stroke="#9C8E85" strokeWidth="1.5"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5">
                  <path d="M4 6l4 4 4-4" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-600 text-[#4A3F38] tracking-wide uppercase">Orden <span className="normal-case font-400 text-[#9C8E85]">(menor = primero)</span></label>
              <div className="rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3">
                <input value={form.orden} onChange={setF("orden")} type="number" min="0"
                  className="w-full bg-transparent text-sm text-[#18110C] outline-none tabular-nums" />
              </div>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <button type="submit" disabled={saving}
              className="group flex items-center gap-3 rounded-full bg-[#18110C] px-5 py-3 text-white text-sm font-500 active:scale-[0.98] disabled:opacity-50"
              style={{ transition: "transform 150ms" }}>
              <span>{saving ? "Guardando…" : "Agregar documento"}</span>
              {saved && <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5"><path d="M2 7l3.5 3.5L12 3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Form de reporte mensual ──────────────────────────────────────────────────

const EMPTY = {
  mes: currentMes(),
  ingresos: "",
  gastos_sueldos: "",
  gastos_honorarios: "",
  gastos_proveedores: "",
  gastos_otros: "",
  sintonia: "",
  logros: [],
  nota_gerente: "",
  publicado: false,
};

export default function Admin() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get("tab") === "documentos" ? "documentos" : "reporte");
  const [form, setForm] = useState(EMPTY);
  const [nuevoLogro, setNuevoLogro] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [mesesExistentes, setMesesExistentes] = useState([]);

  useEffect(() => {
    async function load() {
      const sb = getSupabase();
      const { data } = await sb
        .from("socios_reportes")
        .select("mes")
        .order("mes", { ascending: false });
      if (data) setMesesExistentes(data.map(r => r.mes));
    }
    load();
  }, []);

  async function loadMes(mes) {
    if (!mesesExistentes.includes(mes)) {
      setForm({ ...EMPTY, mes });
      return;
    }
    const sb = getSupabase();
    const { data } = await sb
      .from("socios_reportes")
      .select("*")
      .eq("mes", mes)
      .maybeSingle();
    if (data) {
      setForm({
        mes: data.mes,
        ingresos: data.ingresos ?? "",
        gastos_sueldos: data.gastos_sueldos ?? "",
        gastos_honorarios: data.gastos_honorarios ?? "",
        gastos_proveedores: data.gastos_proveedores ?? "",
        gastos_otros: data.gastos_otros ?? "",
        sintonia: data.sintonia ?? "",
        logros: Array.isArray(data.logros) ? data.logros : [],
        nota_gerente: data.nota_gerente ?? "",
        publicado: data.publicado ?? false,
      });
    }
  }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function setNum(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value === "" ? "" : Number(e.target.value) }));
  }

  function addLogro() {
    const t = nuevoLogro.trim();
    if (!t) return;
    setForm(f => ({ ...f, logros: [...f.logros, t] }));
    setNuevoLogro("");
  }

  function removeLogro(i) {
    setForm(f => ({ ...f, logros: f.logros.filter((_, idx) => idx !== i) }));
  }

  async function handleSave(publicar) {
    setError("");
    setSaving(true);
    const sb = getSupabase();
    const payload = {
      mes: form.mes,
      ingresos: Number(form.ingresos) || 0,
      gastos_sueldos: Number(form.gastos_sueldos) || 0,
      gastos_honorarios: Number(form.gastos_honorarios) || 0,
      gastos_proveedores: Number(form.gastos_proveedores) || 0,
      gastos_otros: Number(form.gastos_otros) || 0,
      sintonia: form.sintonia,
      logros: form.logros,
      nota_gerente: form.nota_gerente,
      publicado: publicar ?? form.publicado,
      updated_at: new Date().toISOString(),
    };
    const { error: err } = await sb
      .from("socios_reportes")
      .upsert(payload, { onConflict: "mes" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setForm(f => ({ ...f, publicado: payload.publicado }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (!mesesExistentes.includes(form.mes)) {
      setMesesExistentes(prev => [form.mes, ...prev].sort((a, b) => b.localeCompare(a)));
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F3EE]">

      {/* Grain */}
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#DDD8CF]/50 bg-[#F6F3EE]/80"
        style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/socios" className="text-sm text-[#9C8E85] hover:text-[#4A3F38] transition-colors flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                <path d="M10 12L6 8l4-4" strokeLinecap="round" />
              </svg>
              Dashboard
            </Link>
            <span className="text-[#DDD8CF]">/</span>
            <div className="flex items-center gap-1 rounded-full bg-[#F6F3EE] ring-1 ring-[#DDD8CF] p-1">
              {[["reporte", "Reporte"], ["documentos", "Documentos"]].map(([key, label]) => (
                <button key={key} onClick={() => setTab(key)}
                  className={`rounded-full px-3 py-1 text-xs font-600 transition-all ${tab === key ? "bg-white text-[#18110C] shadow-sm ring-1 ring-black/5" : "text-[#9C8E85] hover:text-[#4A3F38]"}`}
                  style={{ transition: "background 200ms, color 200ms" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {saved && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5">
                <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Guardado
            </span>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-8 py-10 md:py-16 flex flex-col gap-6">

        <div>
          <h1 className="text-2xl font-700 text-[#18110C] tracking-tight">
            {tab === "reporte" ? "Reporte mensual" : "Documentos"}
          </h1>
          <p className="text-sm text-[#9C8E85] mt-1">
            {tab === "reporte"
              ? "Completa los datos del período y publica cuando estés listo."
              : "Agrega documentos que los socios podrán descargar desde el dashboard."}
          </p>
        </div>

        {tab === "documentos" && <SeccionDocumentos />}
        {tab === "reporte" && <>

        {error && (
          <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* Período */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Período</h2>
            <Field label="Mes del reporte" hint="Formato YYYY-MM, ej: 2025-06">
              <div className="flex items-center gap-3">
                <Input
                  type="month"
                  value={form.mes}
                  onChange={e => { setForm(f => ({ ...f, mes: e.target.value })); loadMes(e.target.value); }}
                />
                {mesesExistentes.includes(form.mes) && (
                  <span className="text-xs text-amber-600 whitespace-nowrap">Editando existente</span>
                )}
              </div>
            </Field>
          </div>
        </div>

        {/* Financiero */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Financiero</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Ingresos (publicidad)">
                <MoneyInput value={form.ingresos} onChange={setNum("ingresos")} placeholder="12000000" />
              </Field>
              <Field label="Gastos sueldos">
                <MoneyInput value={form.gastos_sueldos} onChange={setNum("gastos_sueldos")} />
              </Field>
              <Field label="Gastos honorarios">
                <MoneyInput value={form.gastos_honorarios} onChange={setNum("gastos_honorarios")} />
              </Field>
              <Field label="Gastos proveedores">
                <MoneyInput value={form.gastos_proveedores} onChange={setNum("gastos_proveedores")} />
              </Field>
              <Field label="Otros gastos" hint="Arriendos, servicios básicos, etc.">
                <MoneyInput value={form.gastos_otros} onChange={setNum("gastos_otros")} />
              </Field>
            </div>

            {/* Preview resultado */}
            {(Number(form.ingresos) > 0 || Number(form.gastos_sueldos) > 0) && (() => {
              const neto = Number(form.ingresos || 0) - Number(form.gastos_sueldos || 0) - Number(form.gastos_honorarios || 0) - Number(form.gastos_proveedores || 0) - Number(form.gastos_otros || 0);
              const pos = neto >= 0;
              return (
                <div className={`mt-5 rounded-2xl px-5 py-4 ${pos ? "bg-emerald-50" : "bg-red-50"}`}>
                  <p className="text-xs font-600 uppercase tracking-wider text-[#9C8E85] mb-1">Resultado neto calculado</p>
                  <p className={`text-xl font-700 tabular-nums ${pos ? "text-emerald-700" : "text-red-700"}`}>
                    {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(neto)}
                  </p>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Sintonía */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Sintonía y audiencia</h2>
            <Field label="Descripción de sintonía" hint="Rating, oyentes estimados, posición en ranking, métricas de redes sociales, etc.">
              <Textarea
                value={form.sintonia}
                onChange={set("sintonia")}
                placeholder="Ej: Rating promedio del mes: 5.2 (CIE Informa). Posición Nº2 en Temuco entre radios FM. Instagram: 12.400 seguidores (+3% vs mes anterior)…"
                rows={4}
              />
            </Field>
          </div>
        </div>

        {/* Logros */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Logros del mes</h2>

            <div className="flex gap-2 mb-4">
              <div className="flex-1 rounded-xl bg-[#F6F3EE] ring-1 ring-[#DDD8CF] px-4 py-3 focus-within:ring-[#B91C1C]/40">
                <input
                  type="text"
                  value={nuevoLogro}
                  onChange={e => setNuevoLogro(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addLogro())}
                  placeholder="Ej: Quedamos aceptados en el Fondo de Medios 2025…"
                  className="w-full bg-transparent text-sm text-[#18110C] placeholder:text-[#BDB5AD] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={addLogro}
                className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#18110C] text-white flex items-center justify-center active:scale-95"
                style={{ transition: "transform 150ms" }}
              >
                <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-4 h-4">
                  <path d="M8 3v10M3 8h10" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {form.logros.length > 0 && (
              <ul className="flex flex-col gap-2">
                {form.logros.map((l, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F3EE] group">
                    <span className="w-4 h-4 rounded-full bg-[#B91C1C]/10 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 12 12" fill="none" stroke="#B91C1C" strokeWidth="1.5" className="w-2.5 h-2.5">
                        <path d="M2 6l2.5 2.5L10 3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="flex-1 text-sm text-[#4A3F38]">{l}</span>
                    <button
                      type="button"
                      onClick={() => removeLogro(i)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-[#EDE9E2] flex items-center justify-center transition-opacity"
                    >
                      <svg viewBox="0 0 12 12" fill="none" stroke="#9C8E85" strokeWidth="1.5" className="w-3 h-3">
                        <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round" />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Nota */}
        <div className="rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5">
          <div className="rounded-[calc(2rem-0.375rem)] bg-white p-6 md:p-8"
            style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
            <h2 className="text-xs font-700 uppercase tracking-[0.15em] text-[#9C8E85] mb-5">Nota del Gerente General</h2>
            <Field label="Mensaje a los socios" hint="Contexto, decisiones estratégicas, perspectivas del próximo mes.">
              <Textarea
                value={form.nota_gerente}
                onChange={set("nota_gerente")}
                placeholder="Estimados socios: El mes de junio estuvo marcado por…"
                rows={6}
              />
            </Field>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={saving}
            className="order-2 sm:order-1 rounded-full border border-[#DDD8CF] bg-white px-6 py-3 text-sm font-500 text-[#4A3F38] active:scale-95 disabled:opacity-50"
            style={{ transition: "transform 150ms" }}
          >
            Guardar borrador
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="group order-1 sm:order-2 flex items-center justify-between rounded-full bg-[#B91C1C] px-5 py-3.5 text-white text-sm font-500 active:scale-[0.98] disabled:opacity-50"
            style={{ transition: "transform 150ms" }}
          >
            <span>{saving ? "Guardando…" : "Publicar a socios"}</span>
            <span className="ml-4 w-7 h-7 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-px"
              style={{ transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)" }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.5" className="w-3 h-3">
                <path d="M2.5 7h9M8 3.5L11.5 7 8 10.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
        </>}

      </main>
    </div>
  );
}
