import React, { forwardRef, useEffect, useRef, useState } from "react";
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
                      style={{ transition: "color 200ms, background 200ms" }}>
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

// ─── Tabla de detalle expandible ─────────────────────────────────────────────

const clpFmt2 = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const fmt2 = (n) => clpFmt2.format(n || 0);

const TIPO_LABEL = { F33: "Factura con IVA", F34: "Factura exenta", "NC61": "Nota de crédito" };
const TIPO_COLOR = { F33: "text-[#4A3F38]", F34: "text-amber-700", "NC61": "text-red-600" };

function TablaVentas({ filas }) {
  if (!filas?.length) return <p className="text-sm text-[#BDB5AD] italic px-1">Sin detalle disponible. Sube el Libro de Ventas para verlo.</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#EDE9E2]">
            <th className="text-left py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Fecha</th>
            <th className="text-left py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Cliente</th>
            <th className="text-right py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Neto</th>
            <th className="text-right py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide hidden sm:table-cell">IVA</th>
            <th className="text-right py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={i} className={i % 2 === 0 ? "" : "bg-[#F6F3EE]/60"}>
              <td className="py-2 px-1 text-[#9C8E85] whitespace-nowrap">{f.fecha}</td>
              <td className="py-2 px-1 text-[#4A3F38] max-w-[180px] truncate">{f.razon}</td>
              <td className="py-2 px-1 text-right tabular-nums text-[#18110C]">{fmt2(f.neto)}</td>
              <td className="py-2 px-1 text-right tabular-nums text-[#9C8E85] hidden sm:table-cell">{fmt2(f.iva)}</td>
              <td className="py-2 px-1 text-right tabular-nums font-500 text-[#18110C]">{fmt2(f.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#DDD8CF]">
            <td colSpan={2} className="py-2 px-1 font-600 text-[#4A3F38]">Total ({filas.length} facturas)</td>
            <td className="py-2 px-1 text-right tabular-nums font-700 text-[#18110C]">
              {fmt2(filas.reduce((s, f) => s + f.neto, 0))}
            </td>
            <td className="hidden sm:table-cell" />
            <td className="py-2 px-1 text-right tabular-nums font-700 text-[#18110C]">
              {fmt2(filas.reduce((s, f) => s + f.total, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function TablaCompras({ filas }) {
  if (!filas?.length) return <p className="text-sm text-[#BDB5AD] italic px-1">Sin detalle disponible. Sube el Libro de Compras para verlo.</p>;
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#EDE9E2]">
            <th className="text-left py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Fecha</th>
            <th className="text-left py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Proveedor</th>
            <th className="text-left py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide hidden sm:table-cell">Tipo</th>
            <th className="text-right py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Monto</th>
            <th className="text-right py-2 px-1 font-600 text-[#9C8E85] uppercase tracking-wide">Total</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => {
            const monto = f.neto > 0 ? f.neto : f.exento;
            const isNC = f.tipo === "NC61";
            return (
              <tr key={i} className={i % 2 === 0 ? "" : "bg-[#F6F3EE]/60"}>
                <td className="py-2 px-1 text-[#9C8E85] whitespace-nowrap">{f.fecha}</td>
                <td className="py-2 px-1 text-[#4A3F38] max-w-[160px] truncate">{f.razon}</td>
                <td className={`py-2 px-1 hidden sm:table-cell ${TIPO_COLOR[f.tipo] || "text-[#4A3F38]"}`}>
                  {TIPO_LABEL[f.tipo] || f.tipo}
                </td>
                <td className={`py-2 px-1 text-right tabular-nums ${isNC ? "text-red-600" : "text-[#18110C]"}`}>
                  {isNC ? `−${fmt2(monto)}` : fmt2(monto)}
                </td>
                <td className={`py-2 px-1 text-right tabular-nums font-500 ${isNC ? "text-red-600" : "text-[#18110C]"}`}>
                  {isNC ? `−${fmt2(f.total)}` : fmt2(f.total)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-[#DDD8CF]">
            <td colSpan={3} className="py-2 px-1 font-600 text-[#4A3F38]">Total ({filas.length} documentos)</td>
            <td colSpan={2} className="py-2 px-1 text-right tabular-nums font-700 text-[#18110C]">
              {fmt2(filas.reduce((s, f) => {
                const m = f.neto > 0 ? f.neto : f.exento;
                return s + m * f.signo;
              }, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
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

const MIX_RUBROS = [
  { key: "arriendo",    label: "Arriendo programas",      color: "#B91C1C" },
  { key: "agencias",    label: "Publicidad agencias",     color: "#D97706" },
  { key: "no_agencias", label: "Publicidad no agencias",  color: "#0284C7" },
  { key: "extractos_am",label: "Extractos AM",            color: "#7C3AED" },
  { key: "otros",       label: "Otros",                   color: "#9C8E85" },
];

function CardMixIngresos({ reporte }) {
  const ref = useFadeIn(40);
  const mix = reporte.mix_ingresos;
  if (!mix) return null;

  const total = MIX_RUBROS.reduce((s, r) => s + (mix[r.key] || 0), 0);
  if (total === 0) return null;

  return (
    <Shell className="fade-up col-span-12 md:col-span-5" ref={ref}>
      <div className="p-7 md:p-8 flex flex-col gap-5">
        <div>
          <Eyebrow>Mix de ingresos</Eyebrow>
          <p className="text-[10px] text-[#BDB5AD] mt-1 uppercase tracking-[0.14em]">Composición por rubro · % del total</p>
        </div>
        <div className="flex flex-col gap-3">
          {MIX_RUBROS.map(({ key, label, color }) => {
            const val = mix[key] || 0;
            if (val === 0) return null;
            const pct = (val / total) * 100;
            return (
              <div key={key} className="flex flex-col gap-1">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-[#4A3F38]">{label}</span>
                  <span className="text-xs font-600 tabular-nums text-[#18110C]">{pct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#EDE9E2] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-[#BDB5AD] -mt-1">{formatPesos(total)} distribuidos</p>
      </div>
    </Shell>
  );
}

// ─── Tarjetas individuales ───────────────────────────────────────────────────

function CardFacturacion({ reporte, prevReporte }) {
  const ref = useFadeIn(0);
  const [detalle, setDetalle] = useState(false);
  const delta = prevReporte?.ingresos
    ? ((reporte.ingresos - prevReporte.ingresos) / prevReporte.ingresos) * 100
    : null;
  const totalConIVA = reporte.ingresos + (reporte.facturacion_iva || 0);

  return (
    <Shell className="fade-up col-span-12 md:col-span-7" ref={ref}>
      <div className="p-7 md:p-8 flex flex-col gap-4 min-h-[200px]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Eyebrow>Facturación del mes (neto)</Eyebrow>
            <p className="text-[10px] text-[#BDB5AD] mt-1 uppercase tracking-[0.14em]">Ventas devengadas s/IVA · Libro de ventas</p>
          </div>
          {delta != null && <DeltaBadge delta={delta} />}
        </div>
        <div>
          <BigNumber value={formatPesos(reporte.ingresos)} size="2xl" />
          {reporte.facturacion_iva > 0 && (
            <p className="text-sm text-[#9C8E85] mt-2">
              Total c/IVA:{" "}
              <span className="font-600 text-[#4A3F38] tabular-nums">{formatPesos(totalConIVA)}</span>
              <span className="ml-2 text-xs text-[#BDB5AD]">(incl. IVA {formatPesos(reporte.facturacion_iva)})</span>
            </p>
          )}
        </div>
        <button onClick={() => setDetalle(v => !v)}
          className="self-start flex items-center gap-1.5 text-xs font-500 text-[#B91C1C] hover:text-[#7F1D1D] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`w-3.5 h-3.5 transition-transform duration-200 ${detalle ? "rotate-180" : ""}`}>
            <path d="M2 4l5 5 5-5" strokeLinecap="round" />
          </svg>
          {detalle ? "Ocultar detalle" : "Ver detalle por cliente"}
          {reporte.detalle_ventas?.length ? ` (${reporte.detalle_ventas.length} facturas)` : ""}
        </button>
        {detalle && (
          <div className="border-t border-[#EDE9E2] pt-4">
            <TablaVentas filas={reporte.detalle_ventas} />
          </div>
        )}
      </div>
    </Shell>
  );
}

function CardCaja({ reporte }) {
  const ref = useFadeIn(80);
  const caja = reporte.ingresos_caja || 0;
  const iva = reporte.facturacion_iva || 0;
  const diff = caja > 0 ? caja - reporte.ingresos : null;
  const cajaDisponible = caja > 0 && iva > 0 ? caja - iva : null;

  return (
    <Shell className="fade-up col-span-12 md:col-span-5" ref={ref}>
      <div className="p-7 md:p-8 min-h-[180px] flex flex-col gap-4">
        <div>
          <Eyebrow>Ingresos efectivos (caja)</Eyebrow>
          <p className="text-[10px] text-[#BDB5AD] mt-1 uppercase tracking-[0.14em]">Abonos reales · Cartola bancaria</p>
        </div>
        {caja > 0 ? (
          <>
            <BigNumber value={formatPesos(caja)} />
            {diff !== null && (
              <div className={`rounded-2xl px-4 py-3 text-xs leading-snug
                ${Math.abs(diff) < 500000 ? "bg-emerald-50 text-emerald-700"
                  : diff < 0 ? "bg-amber-50 text-amber-700"
                  : "bg-sky-50 text-sky-700"}`}>
                {diff > 0
                  ? `+${formatPesos(diff)} sobre facturación — incluye cobros de períodos anteriores.`
                  : diff < 0
                  ? `${formatPesos(diff)} bajo facturación — hay facturas pendientes de cobro.`
                  : "Coincide con la facturación del período."}
              </div>
            )}
            {cajaDisponible !== null && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-snug text-amber-800 flex flex-col gap-1">
                <div className="flex justify-between">
                  <span>IVA a declarar (débito fiscal)</span>
                  <span className="font-600 tabular-nums">−{formatPesos(iva)}</span>
                </div>
                <div className="flex justify-between border-t border-amber-200/60 pt-1 mt-0.5">
                  <span className="font-600">Caja disponible real</span>
                  <span className="font-600 tabular-nums">{formatPesos(cajaDisponible)}</span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-3">
            <div>
              <p className="text-sm text-[#BDB5AD] italic">Sin registrar este mes.</p>
              <p className="text-xs text-[#BDB5AD] mt-1.5">
                Ingresa el monto desde el panel admin → Reporte → Ingresos efectivos (caja).
              </p>
            </div>
            {iva > 0 && (
              <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                <span className="font-600">IVA a declarar estimado: </span>
                <span className="tabular-nums">{formatPesos(iva)}</span>
                <span className="text-amber-600 block mt-0.5">Registra la caja para ver la disponibilidad real.</span>
              </div>
            )}
          </div>
        )}
      </div>
    </Shell>
  );
}

function CardResultado({ reporte }) {
  const ref = useFadeIn(160);
  const egresos = reporte.gastos_sueldos + reporte.gastos_honorarios + reporte.gastos_proveedores + reporte.gastos_otros;
  const resultado = reporte.ingresos - egresos;
  const positive = resultado >= 0;
  return (
    <Shell className="fade-up col-span-12 md:col-span-7" ref={ref}>
      <div className={`p-7 md:p-8 flex flex-col gap-4 min-h-[200px]
        ${positive ? "bg-gradient-to-br from-white to-emerald-50/30" : "bg-gradient-to-br from-white to-red-50/30"}`}>
        <div>
          <Eyebrow>Resultado operacional</Eyebrow>
          <p className="text-[10px] text-[#BDB5AD] mt-1 uppercase tracking-[0.14em]">Devengado · Facturación neta − Egresos</p>
        </div>
        <BigNumber value={formatPesos(resultado)} positive={positive} />
        {/* Fórmula explícita */}
        <div className="rounded-2xl bg-[#F6F3EE] px-4 py-3 text-xs font-mono leading-relaxed text-[#9C8E85]">
          <span className="text-[#4A3F38]">{formatPesos(reporte.ingresos)}</span>
          <span className="mx-2 text-[#BDB5AD]">−</span>
          <span className="text-[#4A3F38]">{formatPesos(egresos)}</span>
          <span className="mx-2 text-[#BDB5AD]">=</span>
          <span className={`font-700 ${positive ? "text-emerald-700" : "text-red-700"}`}>{formatPesos(resultado)}</span>
        </div>
        <div className={`inline-flex items-center gap-1.5 text-xs font-medium ${positive ? "text-emerald-600" : "text-red-600"}`}>
          <div className={`w-1.5 h-1.5 rounded-full ${positive ? "bg-emerald-500" : "bg-red-500"}`} />
          {positive ? "Resultado positivo" : "Resultado negativo"}
        </div>
      </div>
    </Shell>
  );
}

function CardGastos({ reporte }) {
  const ref = useFadeIn(240);
  const [detalle, setDetalle] = useState(false);
  const total = reporte.gastos_sueldos + reporte.gastos_honorarios + reporte.gastos_proveedores + reporte.gastos_otros;
  const items = [
    { label: "Sueldos", value: reporte.gastos_sueldos },
    { label: "Honorarios", value: reporte.gastos_honorarios },
    { label: "Proveedores", value: reporte.gastos_proveedores },
    { label: "Otros", value: reporte.gastos_otros },
  ].filter(i => i.value > 0);

  return (
    <Shell className="fade-up col-span-12 md:col-span-5" ref={ref}>
      <div className="p-7 md:p-8 flex flex-col gap-4 min-h-[240px]">
        <div>
          <Eyebrow>Egresos operacionales</Eyebrow>
          <p className="text-[10px] text-[#BDB5AD] mt-1 uppercase tracking-[0.14em]">Gastos pagados en el período</p>
        </div>
        <div className="flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            {items.map(item => (
              <div key={item.label} className="flex items-center justify-between">
                <span className="text-sm text-[#7D6E63]">{item.label}</span>
                <span className="text-sm font-500 text-[#18110C] tabular-nums">{formatPesos(item.value)}</span>
              </div>
            ))}
            {items.length === 0 && <p className="text-sm text-[#BDB5AD]">Sin gastos registrados</p>}
          </div>
          <div className="mt-4 pt-4 border-t border-[#EDE9E2] flex items-center justify-between">
            <span className="text-sm font-600 text-[#4A3F38]">Total egresos</span>
            <span className="text-base font-700 text-[#18110C] tabular-nums">{formatPesos(total)}</span>
          </div>
        </div>
        <button onClick={() => setDetalle(v => !v)}
          className="self-start flex items-center gap-1.5 text-xs font-500 text-[#B91C1C] hover:text-[#7F1D1D] transition-colors">
          <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            className={`w-3.5 h-3.5 transition-transform duration-200 ${detalle ? "rotate-180" : ""}`}>
            <path d="M2 4l5 5 5-5" strokeLinecap="round" />
          </svg>
          {detalle ? "Ocultar detalle" : "Ver libro de compras"}
          {reporte.detalle_compras?.length ? ` (${reporte.detalle_compras.length} documentos)` : ""}
        </button>
        {detalle && (
          <div className="border-t border-[#EDE9E2] pt-4">
            <TablaCompras filas={reporte.detalle_compras} />
          </div>
        )}
      </div>
    </Shell>
  );
}

function NotaMetodologica() {
  return (
    <div className="col-span-12 mt-1">
      <div className="flex items-start gap-2.5 rounded-2xl bg-[#F6F3EE] px-5 py-4">
        <svg viewBox="0 0 16 16" fill="none" stroke="#9C8E85" strokeWidth="1.5" className="w-4 h-4 flex-shrink-0 mt-0.5">
          <circle cx="8" cy="8" r="6.5" />
          <path d="M8 7v4M8 5.5v.5" strokeLinecap="round" />
        </svg>
        <p className="text-[11px] text-[#9C8E85] leading-relaxed">
          <strong className="font-600 text-[#7D6E63]">Base contable de este informe:</strong>{" "}
          <strong className="font-500">Facturación</strong> = base devengada (Libro de Ventas SII, monto neto s/IVA) —
          refleja lo que se cobró en el período, con o sin pago recibido.{" "}
          <strong className="font-500">Caja</strong> = base efectiva (abonos reales en cuenta corriente según cartola bancaria) —
          incluye cobros de facturas de meses anteriores y excluye facturas impagas.{" "}
          <strong className="font-500">Resultado operacional</strong> = base devengada
          (Facturación neta − Egresos operacionales).
        </p>
      </div>
    </div>
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
          .select("mes, ingresos, facturacion_iva, ingresos_caja, gastos_sueldos, gastos_honorarios, gastos_proveedores, gastos_otros, sintonia, logros, nota_gerente, detalle_ventas, detalle_compras, publicado, mix_ingresos")
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
              <CardFacturacion reporte={reporte} prevReporte={prevReporte} />
              <CardMixIngresos reporte={reporte} />
              <CardResultado reporte={reporte} />
              <CardGastos reporte={reporte} />
              <CardCaja reporte={reporte} />
              <CardSintonia reporte={reporte} />
              <CardLogros reporte={reporte} />
              <CardNota reporte={reporte} />
              <NotaMetodologica />
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
