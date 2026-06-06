// Archivo temporal solo para verificar el diseño en dev sin Supabase.
// NO se usa en producción — la ruta /socios-preview no existe en vercel.json.
import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { formatPesos, mesLabel } from "../lib/format.js";
import { useFadeIn } from "../lib/hooks.js";

const DEMO = {
  mes: "2025-06",
  ingresos: 14800000,
  gastos_sueldos: 5200000,
  gastos_honorarios: 1400000,
  gastos_proveedores: 1800000,
  gastos_otros: 620000,
  sintonia:
    "Rating promedio del mes: 5.8 puntos (CIE Informa). Posición Nº2 en Temuco entre radios FM.\n\nInstagram: 15.200 seguidores (+4.3% vs mayo). Spotify: 1.840 oyentes mensuales. Streaming web: 3.100 sesiones únicas.",
  logros: [
    "Aceptados en concurso Fondo de Medios del CNTV — primera postulación de la radio",
    "Renovación completa del Estudio 1: acústica, consola y monitores nuevos",
    "Instalación de streaming HD con tecnología Icecast2 en ambos estudios",
    "Incorporación de nueva locutora para franja tarde (14:00–18:00)",
    "Firma de contrato anual con Municipalidad de Temuco por avisos institucionales",
  ],
  nota_gerente:
    "Estimados socios:\n\nJunio marcó un punto de inflexión en la historia de nuestra radio. La adjudicación del Fondo de Medios, sumada al cierre del contrato con la Municipalidad, nos posiciona con mayor estabilidad para el segundo semestre.\n\nEl resultado financiero positivo de $5.780.000 refleja el trabajo del equipo y la confianza de nuestros avisadores. Para julio proyectamos mantener este ritmo e iniciar conversaciones con nuevos clientes regionales.\n\nGracias por su confianza.",
  publicado: true,
};

const PREV = { ingresos: 12100000 };

function Shell({ children, className = "" }) {
  return (
    <div className={`rounded-[2rem] bg-[#EDE9E2] p-1.5 ring-1 ring-black/5 ${className}`}>
      <div className="h-full rounded-[calc(2rem-0.375rem)] bg-white overflow-hidden"
        style={{ boxShadow: "inset 0 1px 1px rgba(255,255,255,0.9)" }}>
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }) {
  return (
    <span className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] font-medium bg-[#F6F3EE] text-[#9C8E85]">
      {children}
    </span>
  );
}

function DeltaBadge({ delta }) {
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

export default function DashboardPreview() {
  const r = DEMO;
  const neto = r.ingresos - r.gastos_sueldos - r.gastos_honorarios - r.gastos_proveedores - r.gastos_otros;
  const delta = ((r.ingresos - PREV.ingresos) / PREV.ingresos) * 100;

  const ref0 = useFadeIn(0);
  const ref1 = useFadeIn(80);
  const ref2 = useFadeIn(160);
  const ref3 = useFadeIn(200);
  const ref4 = useFadeIn(280);
  const ref5 = useFadeIn(360);

  return (
    <div className="min-h-[100dvh] bg-[#F6F3EE]">
      <div className="pointer-events-none fixed inset-0 z-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          opacity: 0.025,
        }}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[#DDD8CF]/50 bg-[#F6F3EE]/80"
        style={{ backdropFilter: "blur(16px)" }}>
        <div className="max-w-6xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#B91C1C] flex items-center justify-center shadow-sm">
              <svg viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" className="w-3.5 h-3.5">
                <circle cx="8" cy="8" r="5.5" /><circle cx="8" cy="8" r="2" />
                <path d="M8 2V1M8 15v-1M2 8H1M15 8h-1" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-600 text-[#18110C] hidden sm:block">Radio Araucana</span>
            <span className="text-[#DDD8CF]">/</span>
            <span className="text-sm text-[#9C8E85]">Socios</span>
          </div>

          <div className="flex-1 flex justify-center">
            <div className="relative">
              <select className="appearance-none rounded-full bg-white ring-1 ring-[#DDD8CF] px-4 pr-8 py-2 text-sm font-500 text-[#18110C] outline-none">
                <option>Junio 2025</option>
                <option>Mayo 2025</option>
              </select>
              <svg viewBox="0 0 16 16" fill="none" stroke="#9C8E85" strokeWidth="1.5"
                className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5">
                <path d="M4 6l4 4 4-4" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-full bg-white ring-1 ring-[#DDD8CF] px-3 py-1.5">
            <div className="w-6 h-6 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-[10px] font-700">J</div>
            <span className="text-xs font-500 text-[#4A3F38] hidden sm:block">Jerónimo Díaz</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-16">
        <div className="mb-8 md:mb-10">
          <h2 className="text-2xl md:text-3xl font-700 text-[#18110C] tracking-tight">
            {mesLabel(r.mes)}
          </h2>
          <p className="text-sm text-[#9C8E85] mt-1">Informe ejecutivo de gestión · Radio Araucana FM</p>
        </div>

        <div className="grid grid-cols-12 gap-4 md:gap-5">

          {/* Ingresos */}
          <Shell className="fade-up col-span-12 md:col-span-7" ref={ref0}>
            <div className="p-7 md:p-8 flex flex-col justify-between min-h-[200px]">
              <div className="flex items-start justify-between">
                <Eyebrow>Ingresos del mes</Eyebrow>
                <DeltaBadge delta={delta} />
              </div>
              <div className="mt-6">
                <span className="text-4xl md:text-5xl font-700 tracking-tight tabular-nums text-[#18110C]">
                  {formatPesos(r.ingresos)}
                </span>
                <p className="text-sm text-[#9C8E85] mt-2">Facturación publicidad · {mesLabel(r.mes)}</p>
              </div>
            </div>
          </Shell>

          {/* Resultado */}
          <Shell className="fade-up col-span-12 md:col-span-5" ref={ref1}>
            <div className="p-7 md:p-8 flex flex-col justify-between min-h-[200px] bg-gradient-to-br from-white to-emerald-50/40">
              <Eyebrow>Resultado neto</Eyebrow>
              <div className="mt-6">
                <span className="text-3xl md:text-4xl font-700 tracking-tight tabular-nums text-emerald-700">
                  {formatPesos(neto)}
                </span>
                <div className="inline-flex items-center gap-1.5 mt-3 text-xs font-medium text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Resultado positivo
                </div>
              </div>
            </div>
          </Shell>

          {/* Gastos */}
          <Shell className="fade-up col-span-12 md:col-span-5" ref={ref2}>
            <div className="p-7 md:p-8 flex flex-col min-h-[240px]">
              <Eyebrow>Gastos operacionales</Eyebrow>
              <div className="flex-1 mt-5 flex flex-col justify-between">
                <div className="space-y-3">
                  {[
                    { label: "Sueldos", value: r.gastos_sueldos },
                    { label: "Honorarios", value: r.gastos_honorarios },
                    { label: "Proveedores", value: r.gastos_proveedores },
                    { label: "Otros", value: r.gastos_otros },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span className="text-sm text-[#7D6E63]">{item.label}</span>
                      <span className="text-sm font-500 text-[#18110C] tabular-nums">{formatPesos(item.value)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-[#EDE9E2] flex items-center justify-between">
                  <span className="text-sm font-600 text-[#4A3F38]">Total egresos</span>
                  <span className="text-base font-700 text-[#18110C] tabular-nums">
                    {formatPesos(r.gastos_sueldos + r.gastos_honorarios + r.gastos_proveedores + r.gastos_otros)}
                  </span>
                </div>
              </div>
            </div>
          </Shell>

          {/* Sintonía */}
          <Shell className="fade-up col-span-12 md:col-span-7" ref={ref3}>
            <div className="p-7 md:p-8 min-h-[200px]">
              <Eyebrow>Sintonía y audiencia</Eyebrow>
              <p className="mt-5 text-[#4A3F38] text-sm leading-relaxed whitespace-pre-line">{r.sintonia}</p>
            </div>
          </Shell>

          {/* Logros */}
          <Shell className="fade-up col-span-12" ref={ref4}>
            <div className="p-7 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <Eyebrow>Logros del mes</Eyebrow>
                <span className="text-xs text-[#BDB5AD]">{r.logros.length} ítems</span>
              </div>
              <ul className="grid md:grid-cols-2 gap-3">
                {r.logros.map((l, i) => (
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
            </div>
          </Shell>

          {/* Nota gerente */}
          <Shell className="fade-up col-span-12" ref={ref5}>
            <div className="p-7 md:p-8">
              <Eyebrow>Nota del Gerente General</Eyebrow>
              <blockquote className="mt-6 border-l-2 border-[#B91C1C]/30 pl-5">
                <p className="text-[#4A3F38] text-sm leading-relaxed whitespace-pre-line italic">{r.nota_gerente}</p>
              </blockquote>
              <div className="mt-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#B91C1C] flex items-center justify-center text-white text-xs font-700">JD</div>
                <div>
                  <p className="text-xs font-600 text-[#18110C]">Jerónimo Díaz</p>
                  <p className="text-[11px] text-[#9C8E85]">Gerente General · Radio Araucana</p>
                </div>
              </div>
            </div>
          </Shell>

        </div>
      </main>

      <footer className="max-w-6xl mx-auto px-4 md:px-8 py-8 mt-4 border-t border-[#DDD8CF]/50">
        <p className="text-xs text-[#BDB5AD]">© 2025 Radio Araucana · Información confidencial</p>
      </footer>
    </div>
  );
}
