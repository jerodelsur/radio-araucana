import React, { forwardRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth.jsx";
import { getSupabase } from "../lib/supabase.js";
import { formatPesos, mesLabel } from "../lib/format.js";
import { useFadeIn } from "../lib/hooks.js";

// ─── Icono por extensión de archivo ─────────────────────────────────────────
function FileIcon({ url }) {
  const ext = (url || "").split(".").pop().toLowerCase().split("?")[0];
  const isPdf = ext === "pdf" || url.includes("drive.google.com");
  const isXls = ["xlsx", "xls", "csv"].includes(ext);
  if (isPdf) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  if (isXls) return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125v-13.5A1.125 1.125 0 0 1 3.375 4.875h13.5A1.125 1.125 0 0 1 18 6v.75m0 0H6M18 6.75v11.625c0 .621-.504 1.125-1.125 1.125H6m12-12.75H6m0 0v12.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.112 2.13" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Tarjeta de documentos ────────────────────────────────────────────────────
function CardDocumentos({ documentos, isAdmin }) {
  const ref = useFadeIn(400);

  // Agrupar por categoría
  const grupos = documentos.reduce((acc, doc) => {
    const cat = doc.categoria || "General";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(doc);
    return acc;
  }, {});

  const categorias = Object.keys(grupos).sort();

  return (
    <Shell className="fade-up col-span-12 mt-2" ref={ref}>
      <div className="p-7 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Eyebrow>Documentos</Eyebrow>
          {isAdmin && (
            <Link to="/socios-rds/admin?tab=documentos"
              className="text-xs text-[#B91C1C] font-500 hover:underline">
              Gestionar
            </Link>
          )}
        </div>

        {documentos.length === 0 && (
          <p className="text-sm text-[#BDB5AD] italic">No hay documentos publicados aún.</p>
        )}

        <div className="flex flex-col gap-8">
          {categorias.map(cat => (
            <div key={cat}>
              <p className="text-[11px] font-700 uppercase tracking-[0.18em] text-[#9C8E85] mb-3">{cat}</p>
              <div className="grid md:grid-cols-2 gap-3">
                {grupos[cat].map(doc => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-4 p-4 rounded-2xl bg-[#F6F3EE] hover:bg-[#EDE9E2] active:scale-[0.99]"
                    style={{ transition: "background 200ms cubic-bezier(0.32,0.72,0,1), transform 150ms" }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-[#B91C1C] flex-shrink-0 shadow-sm ring-1 ring-black/5">
                      <FileIcon url={doc.url} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-600 text-[#18110C] leading-snug truncate">{doc.titulo}</p>
                      {doc.descripcion && (
                        <p className="text-xs text-[#9C8E85] mt-0.5 leading-snug line-clamp-2">{doc.descripcion}</p>
                      )}
                    </div>
                    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#9C8E85] group-hover:text-[#B91C1C] group-hover:bg-[#B91C1C]/5 shadow-sm ring-1 ring-black/5"
                      style={{ transition: "color 200ms, background 200ms, transform 250ms cubic-bezier(0.32,0.72,0,1)" }}>
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 group-hover:translate-y-px"
                        style={{ transition: "transform 250ms cubic-bezier(0.32,0.72,0,1)" }}>
                        <path d="M8 3v7M5 7l3 3 3-3M3 13h10" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
}

// ─── Componentes de tarjeta ──────────────────────────────────────────────────

// Shell usa forwardRef para que useFadeIn pueda acceder al DOM y agregar la clase "visible"
const Shell = forwardRef(function Shell({ children, className = "" }, ref) {
  return (
    <div ref={ref} className={`rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5 ${className}`}>
      <div
        className="h-full rounded-[calc(2rem-0.375rem)] bg-white overflow-hidden"
        style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}
      >
        {children}
      </div>
    </div>
  );
});

function Eyebrow({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium bg-[#F6F3EE] text-[#9C8E85]">
      {children}
    </span>
  );
}

function BigNumber({ value, positive, size = "xl" }) {
  const color = positive === undefined
    ? "text-[#18110C]"
    : positive ? "text-emerald-700" : "text-red-700";
  const sz = size === "2xl" ? "text-4xl md:text-5xl" : "text-3xl md:text-4xl";
  return (
    <span className={`${sz} font-700 tracking-tight tabular-nums ${color}`}>
      {value}
    </span>
  );
}

function DeltaBadge({ delta }) {
  if (delta == null) return null;
  const positive = delta >= 0;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium
      ${positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className={`w-3 h-3 ${positive ? "" : "rotate-180"}`}>
        <path d="M8 12V4M4 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

// ─── Tarjetas individuales ───────────────────────────────────────────────────

function CardIngresos({ reporte, prevReporte }) {
  const ref = useFadeIn(0);
  const delta = prevReporte?.ingresos
    ? ((reporte.ingresos - prevReporte.ingresos) / prevReporte.ingresos) * 100
    : null;
  return (
    <Shell className="fade-up col-span-12 md:col-span-7 row-span-1" ref={ref}>
      <div className="p-7 md:p-8 h-full flex flex-col justify-between min-h-[200px]">
        <div className="flex items-start justify-between">
          <Eyebrow>Ingresos del mes</Eyebrow>
          {delta != null && <DeltaBadge delta={delta} />}
        </div>
        <div className="mt-6">
          <BigNumber value={formatPesos(reporte.ingresos)} size="2xl" />
          <p className="text-sm text-[#9C8E85] mt-2">Facturación publicidad · {mesLabel(reporte.mes)}</p>
        </div>
      </div>
    </Shell>
  );
}

function CardResultado({ reporte }) {
  const ref = useFadeIn(80);
  const neto = reporte.ingresos - reporte.gastos_sueldos - reporte.gastos_honorarios - reporte.gastos_proveedores - reporte.gastos_otros;
  const positive = neto >= 0;
  return (
    <Shell className="fade-up col-span-12 md:col-span-5 row-span-1" ref={ref}>
      <div className={`p-7 md:p-8 h-full flex flex-col justify-between min-h-[200px]
        ${positive ? "bg-gradient-to-br from-white to-emerald-50/40" : "bg-gradient-to-br from-white to-red-50/40"}`}>
        <Eyebrow>Resultado neto</Eyebrow>
        <div className="mt-6">
          <BigNumber value={formatPesos(neto)} positive={positive} />
          <div className={`inline-flex items-center gap-1.5 mt-3 text-xs font-medium
            ${positive ? "text-emerald-600" : "text-red-600"}`}>
            <div className={`w-1.5 h-1.5 rounded-full ${positive ? "bg-emerald-500" : "bg-red-500"}`} />
            {positive ? "Resultado positivo" : "Resultado negativo"}
          </div>
        </div>
      </div>
    </Shell>
  );
}

function CardGastos({ reporte }) {
  const ref = useFadeIn(160);
  const total = reporte.gastos_sueldos + reporte.gastos_honorarios + reporte.gastos_proveedores + reporte.gastos_otros;
  const items = [
    { label: "Sueldos", value: reporte.gastos_sueldos },
    { label: "Honorarios", value: reporte.gastos_honorarios },
    { label: "Proveedores", value: reporte.gastos_proveedores },
    { label: "Otros", value: reporte.gastos_otros },
  ].filter(i => i.value > 0);

  return (
    <Shell className="fade-up col-span-12 md:col-span-5" ref={ref}>
      <div className="p-7 md:p-8 h-full flex flex-col min-h-[240px]">
        <Eyebrow>Gastos operacionales</Eyebrow>
        <div className="flex-1 mt-5 flex flex-col justify-between">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[#7D6E63]">{item.label}</span>
                <span className="text-sm font-500 text-[#18110C] tabular-nums">{formatPesos(item.value)}</span>
              </div>
            ))}
            {items.length === 0 && (
              <p className="text-sm text-[#BDB5AD]">Sin gastos registrados</p>
            )}
          </div>
          <div className="mt-4 pt-4 border-t border-[#EDE9E2] flex items-center justify-between">
            <span className="text-sm font-600 text-[#4A3F38]">Total egresos</span>
            <span className="text-base font-700 text-[#18110C] tabular-nums">{formatPesos(total)}</span>
          </div>
        </div>
      </div>
    </Shell>
  );
}

function CardSintonia({ reporte }) {
  const ref = useFadeIn(200);
  return (
    <Shell className="fade-up col-span-12 md:col-span-7" ref={ref}>
      <div className="p-7 md:p-8 h-full min-h-[200px]">
        <Eyebrow>Sintonía y audiencia</Eyebrow>
        {reporte.sintonia ? (
          <p className="mt-5 text-[#4A3F38] text-sm leading-relaxed whitespace-pre-line">
            {reporte.sintonia}
          </p>
        ) : (
          <p className="mt-5 text-sm text-[#BDB5AD] italic">Sin datos de sintonía para este mes.</p>
        )}
      </div>
    </Shell>
  );
}

function CardLogros({ reporte }) {
  const ref = useFadeIn(280);
  const logros = Array.isArray(reporte.logros) ? reporte.logros : [];
  return (
    <Shell className="fade-up col-span-12" ref={ref}>
      <div className="p-7 md:p-8">
        <div className="flex items-center justify-between mb-6">
          <Eyebrow>Logros del mes</Eyebrow>
          <span className="text-xs text-[#BDB5AD]">{logros.length} {logros.length === 1 ? "ítem" : "ítems"}</span>
        </div>
        {logros.length > 0 ? (
          <ul className="grid md:grid-cols-2 gap-3">
            {logros.map((l, i) => (
              <li key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#F6F3EE]">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-[#B91C1C]/10 flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 16 16" fill="none" stroke="#B91C1C" strokeWidth="1.5" className="w-3 h-3">
                    <path d="M3 8l3.5 3.5L13 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm text-[#4A3F38] leading-snug">{l}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[#BDB5AD] italic">Sin logros registrados para este período.</p>
        )}
      </div>
    </Shell>
  );
}

function CardNota({ reporte }) {
  const ref = useFadeIn(360);
  if (!reporte.nota_gerente) return null;
  return (
    <Shell className="fade-up col-span-12" ref={ref}>
      <div className="p-7 md:p-8">
        <Eyebrow>Nota del Gerente General</Eyebrow>
        <blockquote className="mt-6 border-l-2 border-[#B91C1C]/30 pl-5">
          <p className="text-[#4A3F38] text-sm leading-relaxed whitespace-pre-line italic">
            {reporte.nota_gerente}
          </p>
        </blockquote>
        <div className="mt-5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-xs font-700">
            JD
          </div>
          <div>
            <p className="text-xs font-600 text-[#18110C]">Jerónimo Díaz</p>
            <p className="text-[11px] text-[#9C8E85]">Gerente General · Radio Araucana</p>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ reportes, mesSel, onMes, isAdmin, onSignOut, perfil }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-[#DDD8CF]/50 bg-[#F6F3EE]/80"
      style={{ backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}>
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-[#B91C1C] flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5">
              <circle cx="8" cy="8" r="5.5" />
              <circle cx="8" cy="8" r="2" />
              <path d="M8 2V1M8 15v-1M2 8H1M15 8h-1" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-sm font-600 text-[#18110C] hidden sm:block">Radio Araucana</span>
          <span className="text-[#DDD8CF]">/</span>
          <span className="text-sm text-[#9C8E85]">Socios</span>
        </div>

        {/* Month selector */}
        {reportes.length > 0 && (
          <div className="flex-1 flex justify-center">
            <div className="relative">
              <select
                value={mesSel}
                onChange={e => onMes(e.target.value)}
                className="appearance-none rounded-full bg-white ring-1 ring-[#DDD8CF] px-4 pr-8 py-2 text-sm font-500 text-[#18110C] cursor-pointer outline-none
                  focus:ring-[#B91C1C]/40"
                style={{ transition: "box-shadow 200ms" }}
              >
                {reportes.map(r => (
                  <option key={r.mes} value={r.mes}>{mesLabel(r.mes)}</option>
                ))}
              </select>
              <svg viewBox="0 0 16 16" fill="none" stroke="#9C8E85" strokeWidth="1.5"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5">
                <path d="M4 6l4 4 4-4" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        )}

        {/* User menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="flex items-center gap-2 rounded-full bg-white ring-1 ring-[#DDD8CF] px-3 py-1.5 text-sm active:scale-95"
            style={{ transition: "transform 150ms" }}
          >
            <div className="w-6 h-6 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[10px] font-700">
              {perfil?.nombre?.charAt(0)?.toUpperCase() || "S"}
            </div>
            <span className="hidden sm:block text-[#4A3F38] text-xs font-500 max-w-[100px] truncate">
              {perfil?.nombre || "Socio"}
            </span>
            <svg viewBox="0 0 16 16" fill="none" stroke="#9C8E85" strokeWidth="1.5" className="w-3 h-3">
              <path d="M4 6l4 4 4-4" strokeLinecap="round" />
            </svg>
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-48 rounded-2xl bg-white ring-1 ring-black/5 overflow-hidden"
                style={{ boxShadow: "0 8px 32px rgba(26,15,10,0.12)" }}>
                {isAdmin && (
                  <Link
                    to="/socios-rds/admin"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3 text-sm text-[#4A3F38] hover:bg-[#F6F3EE] transition-colors"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                      <path d="M8 2l1.5 3 3.5.5-2.5 2.5.5 3.5L8 10l-3 1.5.5-3.5L3 5.5 6.5 5 8 2Z" strokeLinejoin="round" />
                    </svg>
                    Ingresar reporte
                  </Link>
                )}
                <button
                  onClick={() => { setMenuOpen(false); onSignOut(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-[#B91C1C] hover:bg-red-50 transition-colors border-t border-[#F0EDE6]"
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4">
                    <path d="M10 8H2m0 0 2.5-2.5M2 8l2.5 2.5M6 5V3.5A1.5 1.5 0 0 1 7.5 2h5A1.5 1.5 0 0 1 14 3.5v9A1.5 1.5 0 0 1 12.5 14h-5A1.5 1.5 0 0 1 6 12.5V11" strokeLinecap="round" />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

// ─── Dashboard principal ─────────────────────────────────────────────────────

export default function Dashboard() {
  const { perfil, isAdmin, signOut } = useAuth();
  const [reportes, setReportes] = useState([]);
  const [mesSel, setMesSel] = useState(null);
  const [reporte, setReporte] = useState(null);
  const [prevReporte, setPrevReporte] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState(null);
  const [documentos, setDocumentos] = useState([]);

  useEffect(() => {
    async function fetchAll() {
      const sb = getSupabase();
      const [reportesRes, docsRes] = await Promise.all([
        sb.from("socios_reportes")
          .select("mes, ingresos, gastos_sueldos, gastos_honorarios, gastos_proveedores, gastos_otros, sintonia, logros, nota_gerente, publicado")
          .order("mes", { ascending: false }),
        sb.from("socios_documentos")
          .select("id, titulo, descripcion, url, categoria, orden, mes")
          .eq("publicado", true)
          .order("orden", { ascending: true }),
      ]);
      if (reportesRes.error) { setErrorData(reportesRes.error.message); setLoadingData(false); return; }
      setReportes(reportesRes.data || []);
      if (reportesRes.data?.length) setMesSel(reportesRes.data[0].mes);
      setDocumentos(docsRes.data || []);
      setLoadingData(false);
    }
    fetchAll();
  }, []);

  useEffect(() => {
    if (!mesSel || !reportes.length) return;
    const idx = reportes.findIndex(r => r.mes === mesSel);
    setReporte(reportes[idx] ?? null);
    setPrevReporte(reportes[idx + 1] ?? null);
  }, [mesSel, reportes]);

  async function handleSignOut() {
    await signOut();
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

      <Header
        reportes={reportes}
        mesSel={mesSel}
        onMes={setMesSel}
        isAdmin={isAdmin}
        onSignOut={handleSignOut}
        perfil={perfil}
      />

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">

        {loadingData && (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-[#B91C1C]/20 border-t-[#B91C1C] animate-spin" />
            <p className="text-sm text-[#9C8E85]">Cargando reporte…</p>
          </div>
        )}

        {!loadingData && errorData && (
          <div className="rounded-2xl bg-red-50 ring-1 ring-red-200 p-6 text-sm text-red-700">
            No se pudo cargar el reporte: {errorData}
          </div>
        )}

        {!loadingData && !errorData && reportes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-[#EDE9E2] flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="#9C8E85" strokeWidth="1.5" className="w-6 h-6">
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-600 text-[#18110C]">Sin reportes publicados</p>
              <p className="text-sm text-[#9C8E85] mt-1">
                {isAdmin ? "Ingresa el primer reporte desde el panel de admin." : "El gerente aún no ha publicado reportes."}
              </p>
            </div>
            {isAdmin && (
              <Link to="/socios-rds/admin"
                className="mt-2 rounded-full bg-[#18110C] text-white text-sm px-5 py-2.5 font-medium active:scale-95"
                style={{ transition: "transform 150ms" }}
              >
                Ingresar reporte
              </Link>
            )}
          </div>
        )}

        {!loadingData && reporte && (
          <>
            {/* Período header */}
            <div className="mb-8 md:mb-10">
              <h2 className="text-2xl md:text-3xl font-700 text-[#18110C] tracking-tight">
                {mesLabel(reporte.mes)}
              </h2>
              <p className="text-sm text-[#9C8E85] mt-1">Informe ejecutivo de gestión · Radio Araucana FM</p>
              {isAdmin && !reporte.publicado && (
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Borrador — no visible para otros socios
                </span>
              )}
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-12 gap-4 md:gap-5">
              <CardIngresos reporte={reporte} prevReporte={prevReporte} />
              <CardResultado reporte={reporte} />
              <CardGastos reporte={reporte} />
              <CardSintonia reporte={reporte} />
              <CardLogros reporte={reporte} />
              <CardNota reporte={reporte} />
            </div>
          </>
        )}

        {/* Documentos — filtra globales + los del mes seleccionado */}
        {!loadingData && (documentos.length > 0 || isAdmin) && (() => {
          const docsFiltrados = documentos.filter(d => !d.mes || d.mes === mesSel);
          return (docsFiltrados.length > 0 || isAdmin) ? (
            <div className="mt-6 md:mt-8 grid grid-cols-12">
              <CardDocumentos documentos={docsFiltrados} isAdmin={isAdmin} />
            </div>
          ) : null;
        })()}
      </main>

      {/* Footer */}
      <footer className="max-w-6xl mx-auto px-4 md:px-8 py-8 mt-4 border-t border-[#DDD8CF]/50">
        <p className="text-xs text-[#BDB5AD]">
          © {new Date().getFullYear()} Radio Araucana · Información confidencial
        </p>
      </footer>
    </div>
  );
}
