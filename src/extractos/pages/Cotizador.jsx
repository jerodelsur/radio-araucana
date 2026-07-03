import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { T, FONTS } from "../theme.js";
import { Card, Field, Input, Textarea, Select, Button, Badge } from "../components/ui.jsx";
import { calculatePriceCLP, exceedsMaxLines, formatCLP, DEFAULT_TARIFF } from "../lib/pricing.js";
import { useSettings } from "../lib/settings-store.js";
import { createLineMeter, LINE_COUNTER_FONT_STACK, LINE_COUNTER_WIDTH_CM } from "../lib/line-counter.js";
import { MANDATORY_TITLE, withMandatoryTitle } from "../lib/extract-text.js";
import { listUpcomingSlots, formatLongDateCL } from "../lib/broadcast-date.js";
import { isValidRUT, formatRUT } from "../lib/chilean/rut.js";
import { searchComunas, findComunaExacta } from "../lib/chilean/regiones.js";

/* ─── Tipos de trámite ────────────────────────────────────────────────────── */
const PROCEDURE_TYPES = [
  { value: "dga_subterraneas", label: "DGA — aguas subterráneas" },
  { value: "dga_superficiales", label: "DGA — aguas superficiales" },
  { value: "dia_seia", label: "DIA al SEIA" },
  { value: "otro", label: "Otro trámite administrativo" },
];

const GENDER_OPTIONS = [
  { value: "ambos", label: "Sr./Sra." },
  { value: "sr", label: "Sr." },
  { value: "sra", label: "Sra." },
];

const MAX_EXTRACTS = 20;

/* ─── Esquema zod ─────────────────────────────────────────────────────────── */
const extractSchema = z.object({
  extractText: z.string().trim().min(10, "El texto del extracto es muy corto").max(50000, "Máximo 50.000 caracteres"),
  procedureType: z.enum(["dga_subterraneas", "dga_superficiales", "dia_seia", "otro"]),
  comuna: z.string().trim().min(2, "Indica la comuna"),
  provincia: z.string().trim().min(2, "Indica la provincia"),
  region: z.string().trim().min(2, "Indica la región"),
  publicationDay: z.union([z.literal(1), z.literal(15)]),
  publicationMonth: z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido"),
});

const orderSchema = z.object({
  extracts: z.array(extractSchema).min(1).max(MAX_EXTRACTS),
  clientName: z.string().trim().min(2, "Tu nombre completo"),
  clientRUT: z.string().refine(isValidRUT, "RUT inválido"),
  clientEmail: z.string().email("Email inválido"),
  clientPhone: z
    .string()
    .trim()
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Teléfono incompleto"),
  clientOrganization: z.string().trim().max(120, "Máximo 120 caracteres").optional().or(z.literal("")),
  gender: z.enum(["ambos", "sr", "sra"]),
  billingLegalName: z.string().trim().min(2, "Razón social obligatoria").max(200, "Máximo 200 caracteres"),
  billingRUT: z.string().refine(isValidRUT, "RUT de empresa inválido"),
  billingAddress: z.string().trim().min(2, "Domicilio comercial obligatorio").max(300, "Máximo 300 caracteres"),
  billingGiro: z.string().trim().min(2, "Giro obligatorio").max(120, "Máximo 120 caracteres"),
  billingEmail: z.string().email("Email de facturación inválido"),
});

/* ─── Estado del formulario ───────────────────────────────────────────────── */
let extractIdCounter = 0;
function newExtractDraft() {
  extractIdCounter += 1;
  return {
    id: `ex-${Date.now().toString(36)}-${extractIdCounter}`,
    extractText: "",
    procedureType: "dga_subterraneas",
    comuna: "",
    provincia: "",
    region: "",
    comunaInputDirty: false,
    publicationSlotIndex: 0,
  };
}

const initialState = {
  extracts: [newExtractDraft()],
  clientName: "",
  clientRUT: "",
  clientEmail: "",
  clientPhone: "",
  clientOrganization: "",
  gender: "ambos",
  billingLegalName: "",
  billingRUT: "",
  billingAddress: "",
  billingGiro: "",
  billingEmail: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "set":
      return { ...state, [action.field]: action.value };
    case "setRUT":
      return { ...state, [action.field]: action.value };
    case "addExtract": {
      if (state.extracts.length >= MAX_EXTRACTS) return state;
      return { ...state, extracts: [...state.extracts, newExtractDraft()] };
    }
    case "removeExtract": {
      if (state.extracts.length <= 1) return state;
      return { ...state, extracts: state.extracts.filter((e) => e.id !== action.id) };
    }
    case "setExtractField": {
      return {
        ...state,
        extracts: state.extracts.map((e) =>
          e.id === action.id ? { ...e, [action.field]: action.value } : e
        ),
      };
    }
    case "setExtractComuna": {
      const match = findComunaExacta(action.value);
      return {
        ...state,
        extracts: state.extracts.map((e) => {
          if (e.id !== action.id) return e;
          return {
            ...e,
            comuna: action.value,
            comunaInputDirty: true,
            provincia: match ? match.provincia : e.provincia,
            region: match ? match.region : e.region,
          };
        }),
      };
    }
    default:
      return state;
  }
}

/* ─── Página principal ────────────────────────────────────────────────────── */
export default function Cotizador() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) meta.setAttribute("content", "index, follow, max-image-preview:large");
  }, []);

  const navigate = useNavigate();
  const settings = useSettings();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitState, setSubmitState] = useState({ status: "idle", message: null });

  const upcomingSlots = useMemo(() => listUpcomingSlots(new Date(), 12), []);

  // Un único line-meter compartido entre extractos (es un nodo DOM oculto).
  const meterRef = useRef(null);
  useEffect(() => {
    meterRef.current = createLineMeter();
    return () => meterRef.current?.dispose();
  }, []);

  const tariff = settings.tariff_table ?? DEFAULT_TARIFF;
  const maxLines = Number(tariff?.maxLines) || DEFAULT_TARIFF.maxLines;

  // Per extracto: { composedText, lineCount, priceCLP, overLimit, slot }.
  const [extractMetrics, setExtractMetrics] = useState({});
  useEffect(() => {
    if (!meterRef.current) return;
    const next = {};
    for (const ex of state.extracts) {
      const composedText = withMandatoryTitle(ex.extractText);
      const lineCount = meterRef.current.measure(composedText);
      const overLimit = exceedsMaxLines(lineCount, tariff);
      const priceCLP = lineCount > 0 && !overLimit ? calculatePriceCLP(lineCount, tariff) : 0;
      const slot = upcomingSlots[ex.publicationSlotIndex] ?? upcomingSlots[0];
      next[ex.id] = { composedText, lineCount, overLimit, priceCLP, slot };
    }
    setExtractMetrics(next);
  }, [state.extracts, upcomingSlots, tariff]);

  const totalCLP = state.extracts.reduce((sum, ex) => sum + (extractMetrics[ex.id]?.priceCLP || 0), 0);
  const anyOverLimit = state.extracts.some((ex) => extractMetrics[ex.id]?.overLimit);
  const allHaveText = state.extracts.every((ex) => (extractMetrics[ex.id]?.lineCount || 0) > 0);

  // Snapshot para validación + submit.
  const formSnapshot = useMemo(() => {
    return {
      extracts: state.extracts.map((ex) => {
        const m = extractMetrics[ex.id];
        const slot = m?.slot;
        return {
          extractText: m?.composedText ?? "",
          procedureType: ex.procedureType,
          comuna: ex.comuna,
          provincia: ex.provincia,
          region: ex.region,
          publicationDay: slot?.day,
          publicationMonth: slot?.monthYear,
        };
      }),
      clientName: state.clientName,
      clientRUT: state.clientRUT,
      clientEmail: state.clientEmail,
      clientPhone: state.clientPhone,
      clientOrganization: state.clientOrganization,
      gender: state.gender,
      billingLegalName: state.billingLegalName,
      billingRUT: state.billingRUT,
      billingAddress: state.billingAddress,
      billingGiro: state.billingGiro,
      billingEmail: state.billingEmail,
    };
  }, [state, extractMetrics]);

  const validation = useMemo(() => {
    const result = orderSchema.safeParse(formSnapshot);
    if (result.success) return { ok: true, errors: {}, extractErrors: [] };
    const errors = {};
    const extractErrors = state.extracts.map(() => ({}));
    for (const issue of result.error.issues) {
      const [first, indexOrKey, key] = issue.path;
      if (first === "extracts" && typeof indexOrKey === "number") {
        if (!extractErrors[indexOrKey][key]) extractErrors[indexOrKey][key] = issue.message;
      } else if (first && !errors[first]) {
        errors[first] = issue.message;
      }
    }
    return { ok: false, errors, extractErrors };
  }, [formSnapshot, state.extracts]);

  const showErrors = submitAttempted;
  const e = (field) => (showErrors ? validation.errors[field] : undefined);
  const exErr = (index, field) =>
    showErrors ? validation.extractErrors[index]?.[field] : undefined;

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitAttempted(true);
    if (anyOverLimit) {
      setSubmitState({
        status: "blocked",
        message:
          `Para extractos que superan las ${maxLines} líneas hay que escribir a ` +
          "extractos@araucanayfrontera.cl — se cotiza como cápsula.",
      });
      return;
    }
    if (!validation.ok) {
      requestAnimationFrame(() => {
        // Foco al primer error visible.
        const firstExtractErrorIdx = validation.extractErrors.findIndex((e) => Object.keys(e).length > 0);
        if (firstExtractErrorIdx >= 0) {
          const firstField = Object.keys(validation.extractErrors[firstExtractErrorIdx])[0];
          const el = document.querySelector(`[data-field="${firstField}"][data-extract-idx="${firstExtractErrorIdx}"]`);
          if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          const firstField = Object.keys(validation.errors)[0];
          const el = firstField ? document.querySelector(`[data-field="${firstField}"]`) : null;
          if (el?.scrollIntoView) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      });
      return;
    }
    setSubmitState({ status: "submitting", message: null });
    try {
      const r = await fetch("/api/extractos/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formSnapshot),
        // Sin esto, un backend colgado deja al cliente en "Enviando…" sin fin.
        signal: AbortSignal.timeout(20000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.orderNumber) {
        navigate(`/orden/${encodeURIComponent(data.orderNumber)}`);
        return;
      }
      if (r.status === 503) {
        setSubmitState({
          status: "blocked",
          message:
            data.message ??
            "Estamos terminando de configurar el sistema. Por ahora escríbenos a extractos@araucanayfrontera.cl con tu cotización y te respondemos.",
        });
        return;
      }
      if (r.status === 400 && Array.isArray(data.issues)) {
        setSubmitState({
          status: "error",
          message: data.issues.map((i) => `• ${i.message}`).join("\n") || "Datos inválidos.",
        });
        return;
      }
      setSubmitState({
        status: "error",
        message:
          data.message ||
          "No pudimos procesar tu solicitud en este momento. Intenta de nuevo o escríbenos a extractos@araucanayfrontera.cl.",
      });
    } catch {
      setSubmitState({
        status: "error",
        message:
          "No pudimos conectar con el servidor. Puede ser tu conexión o una falla temporal del sistema. " +
          "Intenta de nuevo en unos minutos o escríbenos a extractos@araucanayfrontera.cl.",
      });
    }
  }

  return (
    <div style={{ animation: "extractos-fadeUp 0.5s ease-out" }}>
      <Hero />
      <style>{`
        .cotizador-form {
          max-width: 1180px;
          margin: 0 auto;
          padding: 28px 20px 60px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
          gap: 28px;
          align-items: start;
        }
        .cotizador-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        @media (max-width: 900px) {
          .cotizador-form { grid-template-columns: 1fr; gap: 22px; }
          .resumen-sticky { position: static !important; top: auto !important; }
        }
        @media (max-width: 540px) {
          .cotizador-grid-2 { grid-template-columns: 1fr; gap: 0; }
        }
      `}</style>
      <form className="cotizador-form" onSubmit={handleSubmit}>
        <div style={{ display: "flex", flexDirection: "column", gap: 22, minWidth: 0 }} className="cotizador-cols">
          <StepBlock number={1} title={`Extractos a difundir (${state.extracts.length}/${MAX_EXTRACTS})`}>
            <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
              Puedes incluir hasta {MAX_EXTRACTS} extractos en una sola cotización.
              Pagas y facturas todo junto; recibes <strong>un certificado por
              cada extracto</strong> según su fecha de difusión.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {state.extracts.map((ex, idx) => (
                <ExtractCard
                  key={ex.id}
                  extract={ex}
                  index={idx}
                  total={state.extracts.length}
                  metrics={extractMetrics[ex.id]}
                  upcomingSlots={upcomingSlots}
                  maxLines={maxLines}
                  errors={showErrors ? validation.extractErrors[idx] : {}}
                  onChange={(field, value) =>
                    dispatch({ type: "setExtractField", id: ex.id, field, value })
                  }
                  onChangeComuna={(value) =>
                    dispatch({ type: "setExtractComuna", id: ex.id, value })
                  }
                  onRemove={
                    state.extracts.length > 1
                      ? () => dispatch({ type: "removeExtract", id: ex.id })
                      : null
                  }
                />
              ))}
            </div>

            <div style={{ marginTop: 18 }}>
              <Button
                type="button"
                variant="secondary"
                disabled={state.extracts.length >= MAX_EXTRACTS}
                onClick={() => dispatch({ type: "addExtract" })}
              >
                + Agregar otro extracto
              </Button>
              {state.extracts.length >= MAX_EXTRACTS && (
                <p style={{ fontSize: 12, color: T.inkSoft, marginTop: 8, lineHeight: 1.5 }}>
                  Máximo {MAX_EXTRACTS} extractos por cotización. Si necesitas más, envía una nueva solicitud.
                </p>
              )}
            </div>
          </StepBlock>

          <StepBlock number={2} title="Tus datos">
            <Field label="Nombre completo" required htmlFor="clientName" error={e("clientName")}>
              <Input
                id="clientName"
                data-field="clientName"
                placeholder="Tal como aparece en tu cédula"
                value={state.clientName}
                invalid={!!e("clientName")}
                onChange={(ev) => dispatch({ type: "set", field: "clientName", value: ev.target.value })}
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="RUT" required htmlFor="clientRUT" error={e("clientRUT")}>
                <Input
                  id="clientRUT"
                  data-field="clientRUT"
                  placeholder="12.345.678-9"
                  value={state.clientRUT}
                  invalid={!!e("clientRUT")}
                  onChange={(ev) => dispatch({ type: "setRUT", field: "clientRUT", value: ev.target.value })}
                  onBlur={(ev) => {
                    if (isValidRUT(ev.target.value)) {
                      dispatch({ type: "setRUT", field: "clientRUT", value: formatRUT(ev.target.value) });
                    }
                  }}
                />
              </Field>
              <Field label="Tratamiento" htmlFor="gender" hint="Aparecerá en los certificados.">
                <Select
                  id="gender"
                  data-field="gender"
                  value={state.gender}
                  onChange={(ev) => dispatch({ type: "set", field: "gender", value: ev.target.value })}
                >
                  {GENDER_OPTIONS.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Field label="Email" required htmlFor="clientEmail" error={e("clientEmail")} hint="Acá te llegan los certificados.">
                <Input
                  id="clientEmail"
                  data-field="clientEmail"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="tu@email.cl"
                  value={state.clientEmail}
                  invalid={!!e("clientEmail")}
                  onChange={(ev) => dispatch({ type: "set", field: "clientEmail", value: ev.target.value })}
                />
              </Field>
              <Field label="Teléfono" required htmlFor="clientPhone" error={e("clientPhone")}>
                <Input
                  id="clientPhone"
                  data-field="clientPhone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="+56 9 1234 5678"
                  value={state.clientPhone}
                  invalid={!!e("clientPhone")}
                  onChange={(ev) => dispatch({ type: "set", field: "clientPhone", value: ev.target.value })}
                />
              </Field>
            </div>
            <Field label="Organización (opcional)" htmlFor="clientOrganization" error={e("clientOrganization")}>
              <Input
                id="clientOrganization"
                data-field="clientOrganization"
                placeholder="Estudio jurídico, agrícola, empresa…"
                value={state.clientOrganization}
                onChange={(ev) => dispatch({ type: "set", field: "clientOrganization", value: ev.target.value })}
              />
            </Field>
          </StepBlock>

          <StepBlock number={3} title="Facturación">
            <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
              Toda difusión radial se factura. Indica los datos de la empresa o persona a nombre de quien va la factura.
              {state.extracts.length > 1 && (
                <> Aunque incluyas varios extractos, recibes <strong>una sola factura</strong> por el total.</>
              )}
            </p>
            <Field label="Razón social" required htmlFor="billingLegalName" error={e("billingLegalName")}>
              <Input
                id="billingLegalName"
                data-field="billingLegalName"
                placeholder="Ej. Inmobiliaria e Inversiones La Medalla SpA"
                value={state.billingLegalName}
                invalid={!!e("billingLegalName")}
                onChange={(ev) => dispatch({ type: "set", field: "billingLegalName", value: ev.target.value })}
              />
            </Field>
            <div className="cotizador-grid-2">
              <Field label="RUT" required htmlFor="billingRUT" error={e("billingRUT")}>
                <Input
                  id="billingRUT"
                  data-field="billingRUT"
                  placeholder="76.274.028-1"
                  value={state.billingRUT}
                  invalid={!!e("billingRUT")}
                  onChange={(ev) => dispatch({ type: "set", field: "billingRUT", value: ev.target.value })}
                  onBlur={(ev) => {
                    if (isValidRUT(ev.target.value)) {
                      dispatch({ type: "set", field: "billingRUT", value: formatRUT(ev.target.value) });
                    }
                  }}
                />
              </Field>
              <Field label="Giro" required htmlFor="billingGiro" error={e("billingGiro")}>
                <Input
                  id="billingGiro"
                  data-field="billingGiro"
                  placeholder="Inmobiliaria, agrícola, etc."
                  value={state.billingGiro}
                  invalid={!!e("billingGiro")}
                  onChange={(ev) => dispatch({ type: "set", field: "billingGiro", value: ev.target.value })}
                />
              </Field>
            </div>
            <Field label="Domicilio comercial" required htmlFor="billingAddress" error={e("billingAddress")}>
              <Input
                id="billingAddress"
                data-field="billingAddress"
                placeholder="Ej. A. López de Bello 114 of 303, Recoleta, Región Metropolitana"
                value={state.billingAddress}
                invalid={!!e("billingAddress")}
                onChange={(ev) => dispatch({ type: "set", field: "billingAddress", value: ev.target.value })}
              />
            </Field>
            <Field label="Email para envío de factura" required htmlFor="billingEmail" error={e("billingEmail")}>
              <Input
                id="billingEmail"
                data-field="billingEmail"
                type="email"
                inputMode="email"
                placeholder="contabilidad@empresa.cl"
                value={state.billingEmail}
                invalid={!!e("billingEmail")}
                onChange={(ev) => dispatch({ type: "set", field: "billingEmail", value: ev.target.value })}
              />
            </Field>
          </StepBlock>
        </div>

        <Resumen
          extracts={state.extracts}
          metrics={extractMetrics}
          totalCLP={totalCLP}
          onSubmit={handleSubmit}
          formValid={validation.ok}
          submitState={submitState}
          overLimit={anyOverLimit}
          maxLines={maxLines}
          allHaveText={allHaveText}
        />
      </form>
    </div>
  );
}

/* ─── Sub-componentes ─────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section
      style={{
        background: `linear-gradient(180deg, ${T.cream} 0%, ${T.paper} 100%)`,
        padding: "48px 20px 28px",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          <Badge tone="accent">Servicio · Radio La Frontera AM 1110</Badge>
          <Badge tone="warn">Beta · pago por transferencia</Badge>
        </div>
        <h1
          className="display"
          style={{
            fontSize: "clamp(30px, 4.6vw, 48px)",
            lineHeight: 1.1,
            color: T.greenDark,
            marginBottom: 10,
            maxWidth: 760,
          }}
        >
          Difusión radial de extractos legales
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.55, color: T.inkSoft, maxWidth: 700 }}>
          Cotiza online tu aviso radial para trámites de la DGA, DIA al SEIA y
          publicaciones administrativas. Puedes incluir hasta {MAX_EXTRACTS} extractos
          en una sola cotización (1 factura, certificado por cada uno).
        </p>
        <p
          style={{
            marginTop: 14,
            padding: "10px 14px",
            background: "rgba(201,146,60,0.08)",
            border: "1px solid rgba(201,146,60,0.30)",
            borderRadius: 8,
            fontSize: 13,
            color: T.inkSoft,
            maxWidth: 760,
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: T.warn }}>En beta:</strong> el pago en línea con
          tarjeta llega pronto. Por ahora pagas por transferencia y la radio
          confirma manualmente en menos de 24 horas hábiles.
        </p>
      </div>
    </section>
  );
}

function StepBlock({ number, title, children }) {
  return (
    <Card>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span
          className="mono"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: 999,
            background: T.greenDark,
            color: T.cream,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {number}
        </span>
        <h2 className="display" style={{ fontSize: 20, color: T.greenDark, fontWeight: 500 }}>
          {title}
        </h2>
      </div>
      {children}
    </Card>
  );
}

function ExtractCard({
  extract,
  index,
  total,
  metrics,
  upcomingSlots,
  maxLines,
  errors,
  onChange,
  onChangeComuna,
  onRemove,
}) {
  const lineCount = metrics?.lineCount ?? 0;
  const overLimit = metrics?.overLimit ?? false;
  const priceCLP = metrics?.priceCLP ?? 0;
  const composedText = metrics?.composedText ?? "";

  const comunaWarning = useMemo(() => {
    if (!extract.comuna || !extract.comunaInputDirty) return null;
    const match = findComunaExacta(extract.comuna);
    return match ? null : "No reconocemos esa comuna. Verifica el nombre o avanza igual y la radio confirma cobertura.";
  }, [extract.comuna, extract.comunaInputDirty]);

  const comunaSuggestions = useMemo(() => {
    return extract.comuna ? searchComunas(extract.comuna, 8).map((c) => c.comuna) : [];
  }, [extract.comuna]);

  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 16,
        background: T.paper,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            className="mono"
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: T.greenDark,
              background: "rgba(78,165,82,0.10)",
              padding: "4px 10px",
              borderRadius: 999,
              letterSpacing: 0.4,
              textTransform: "uppercase",
            }}
          >
            Extracto #{index + 1}
          </span>
          {lineCount > 0 && (
            <span
              className="mono"
              style={{ fontSize: 12, color: overLimit ? T.danger : T.inkSoft }}
            >
              {lineCount} líneas {overLimit ? `· máx ${maxLines}` : `· ${formatCLP(priceCLP)}`}
            </span>
          )}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Quitar extracto ${index + 1}`}
            style={{
              border: "none",
              background: "transparent",
              color: T.danger,
              cursor: "pointer",
              fontSize: 13,
              padding: "4px 8px",
              borderRadius: 4,
            }}
          >
            × Quitar
          </button>
        )}
      </div>

      <Field
        label="Texto del extracto"
        hint={`La línea "${MANDATORY_TITLE}" se agrega arriba automáticamente y cuenta como una línea.`}
        error={errors?.extractText}
      >
        <Textarea
          data-field="extractText"
          data-extract-idx={index}
          value={extract.extractText}
          invalid={!!errors?.extractText}
          placeholder="Ej. Denisse Francisca Contreras Leiva, Rut: 18.036.339-4. Solicita un derecho de aprovechamiento de aguas subterráneas…"
          onChange={(ev) => onChange("extractText", ev.target.value)}
          spellCheck
          lang="es-CL"
        />
      </Field>

      <div
        aria-label="Vista previa del texto a difundir"
        style={{
          background: T.cream,
          border: `1px dashed ${T.border}`,
          borderRadius: 8,
          padding: 14,
          marginTop: 10,
          width: "100%",
          overflowX: "auto",
        }}
      >
        <div
          className="bookman"
          style={{
            fontFamily: LINE_COUNTER_FONT_STACK,
            fontSize: "12pt",
            lineHeight: 1,
            whiteSpace: "pre-wrap",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            width: "100%",
            maxWidth: `${LINE_COUNTER_WIDTH_CM}cm`,
            color: T.ink,
          }}
        >
          {extract.extractText ? composedText : (
            <span style={{ color: T.inkMute, fontFamily: FONTS.body, fontStyle: "italic" }}>
              Vista previa con la línea de título "{MANDATORY_TITLE}" arriba.
            </span>
          )}
        </div>
      </div>

      {overLimit && (
        <div
          role="alert"
          style={{
            marginTop: 10,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: T.danger,
            background: "rgba(197,62,31,0.06)",
            border: "1px solid rgba(197,62,31,0.35)",
            borderRadius: 8,
            padding: "10px 12px",
          }}
        >
          <strong>Excede {maxLines} líneas.</strong> Escribe a{" "}
          <a href="mailto:extractos@araucanayfrontera.cl" style={{ color: T.danger, textDecoration: "underline" }}>
            extractos@araucanayfrontera.cl
          </a>{" "}
          — extractos sobre {maxLines} líneas se cotizan como cápsula.
        </div>
      )}

      <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
        <Field label="Tipo de trámite" required htmlFor={`procedureType-${index}`}>
          <Select
            id={`procedureType-${index}`}
            data-field="procedureType"
            data-extract-idx={index}
            value={extract.procedureType}
            onChange={(ev) => onChange("procedureType", ev.target.value)}
          >
            {PROCEDURE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </Field>

        <Field
          label="Comuna del trámite"
          required
          htmlFor={`comuna-${index}`}
          hint={comunaWarning ?? "Empieza a escribir y te sugerimos."}
          error={errors?.comuna}
        >
          <Input
            id={`comuna-${index}`}
            data-field="comuna"
            data-extract-idx={index}
            list={`comunas-${index}`}
            autoComplete="off"
            placeholder="Ej. Temuco"
            value={extract.comuna}
            invalid={!!errors?.comuna}
            onChange={(ev) => onChangeComuna(ev.target.value)}
          />
          <datalist id={`comunas-${index}`}>
            {comunaSuggestions.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <div className="cotizador-grid-2">
          <Field label="Provincia" htmlFor={`provincia-${index}`} hint="Auto-completa según comuna." error={errors?.provincia}>
            <Input
              id={`provincia-${index}`}
              data-field="provincia"
              data-extract-idx={index}
              value={extract.provincia}
              invalid={!!errors?.provincia}
              onChange={(ev) => onChange("provincia", ev.target.value)}
            />
          </Field>
          <Field label="Región" htmlFor={`region-${index}`} hint="Auto-completa según comuna." error={errors?.region}>
            <Input
              id={`region-${index}`}
              data-field="region"
              data-extract-idx={index}
              value={extract.region}
              invalid={!!errors?.region}
              onChange={(ev) => onChange("region", ev.target.value)}
            />
          </Field>
        </div>

        <Field
          label="Fecha de difusión"
          required
          htmlFor={`publicationSlot-${index}`}
          hint="La radio difunde los días 1 o 15 de cada mes. Si caen domingo o festivo, pasa al día hábil siguiente."
        >
          <Select
            id={`publicationSlot-${index}`}
            data-field="publicationSlot"
            data-extract-idx={index}
            value={extract.publicationSlotIndex}
            onChange={(ev) => onChange("publicationSlotIndex", Number(ev.target.value))}
          >
            {upcomingSlots.map((slot, i) => (
              <option key={`${slot.monthYear}-${slot.day}`} value={i}>
                Día {slot.day} de {slot.monthYear} → {formatLongDateCL(slot.resolved.resolvedDate)}
                {slot.resolved.shifted ? " (corrido por feriado/domingo)" : ""}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </div>
  );
}

function Resumen({ extracts, metrics, totalCLP, onSubmit, formValid, submitState, overLimit, maxLines, allHaveText }) {
  return (
    <aside
      className="resumen-sticky"
      style={{
        position: "sticky",
        top: 80,
        alignSelf: "start",
      }}
    >
      <Card style={{ padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 className="display" style={{ fontSize: 18, color: T.greenDark, fontWeight: 500 }}>Resumen</h3>
          <Badge tone={allHaveText ? "primary" : "neutral"}>
            {allHaveText ? "Cotización viva" : "Faltan textos"}
          </Badge>
        </div>

        <ResumenRow label="Extractos" value={`${extracts.length}`} mono />
        <ResumenRow
          label="Total (IVA incl.)"
          value={overLimit ? "Cotizar aparte" : allHaveText ? formatCLP(totalCLP) : "—"}
          highlight
          mono
        />

        <hr style={{ border: 0, borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {extracts.map((ex, i) => {
            const m = metrics[ex.id];
            const slotDate = m?.slot ? formatLongDateCL(m.slot.resolved.resolvedDate) : "—";
            return (
              <div
                key={ex.id}
                style={{
                  fontSize: 12,
                  color: T.inkSoft,
                  lineHeight: 1.5,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ color: T.ink, fontWeight: 500 }}>#{i + 1}</span>
                <span style={{ flex: 1 }}>
                  {ex.comuna || <em style={{ color: T.inkMute }}>comuna…</em>}<br/>
                  <span style={{ fontSize: 11 }}>{slotDate}</span>
                </span>
                <span className="mono" style={{ color: m?.overLimit ? T.danger : T.ink }}>
                  {m?.overLimit ? "—" : m?.priceCLP ? formatCLP(m.priceCLP) : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            onClick={onSubmit}
            disabled={!allHaveText || overLimit}
            loading={submitState?.status === "submitting"}
          >
            {submitState?.status === "submitting" ? "Enviando…" : "Enviar solicitud"}
          </Button>
          {overLimit && (
            <p style={{ fontSize: 11.5, color: T.danger, textAlign: "center", lineHeight: 1.5 }}>
              Hay extractos que superan {maxLines} líneas — escribir a extractos@araucanayfrontera.cl.
            </p>
          )}
          <p style={{ fontSize: 11.5, color: T.inkMute, lineHeight: 1.5, textAlign: "center" }}>
            Recibirás un email con el N° de orden y los datos para transferir.
            Una sola factura por el total cuando se acredite el pago.
          </p>
          {!formValid && allHaveText && !overLimit && submitState?.status !== "submitting" && !submitState?.message && (
            <p style={{ fontSize: 11.5, color: T.warn, textAlign: "center" }}>
              Completa los datos del trámite, cliente y facturación.
            </p>
          )}
          {submitState?.message && (
            <div
              role="status"
              style={{
                fontSize: 12.5,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                padding: "10px 12px",
                borderRadius: 6,
                color: submitState.status === "blocked" ? T.warn : T.danger,
                background: submitState.status === "blocked" ? "rgba(201,146,60,0.10)" : "rgba(197,62,31,0.08)",
                border: `1px solid ${submitState.status === "blocked" ? "rgba(201,146,60,0.4)" : "rgba(197,62,31,0.35)"}`,
              }}
            >
              {submitState.message}
            </div>
          )}
        </div>
      </Card>

      <div
        style={{
          marginTop: 14,
          padding: "14px 16px",
          fontSize: 12,
          color: T.inkSoft,
          lineHeight: 1.55,
          background: "rgba(78,165,82,0.06)",
          border: `1px solid rgba(78,165,82,0.25)`,
          borderRadius: 8,
        }}
      >
        <strong style={{ color: T.greenDark }}>Conteo de líneas:</strong> es referencial.
        Si tu navegador no tiene Bookman Old Style instalada, el conteo puede diferir
        levemente del que hace la radio en Word. La operadora ajusta el monto antes del cobro si detecta diferencia.
      </div>
    </aside>
  );
}

function ResumenRow({ label, value, mono, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
        padding: "6px 0",
      }}
    >
      <span style={{ fontSize: 13, color: T.inkSoft }}>{label}</span>
      <span
        className={mono ? "mono" : ""}
        style={{
          fontSize: highlight ? 22 : 14,
          fontWeight: highlight ? 600 : 500,
          color: highlight ? T.greenDark : T.ink,
          fontFamily: highlight ? FONTS.display : undefined,
          textAlign: "right",
          lineHeight: 1.2,
        }}
      >
        {value}
      </span>
    </div>
  );
}
