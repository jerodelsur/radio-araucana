import React, { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { T, FONTS, S } from "../theme.js";
import { Card, Field, Input, Textarea, Select, Button, Badge } from "../components/ui.jsx";
import { calculatePriceCLP, exceedsMaxLines, formatCLP, DEFAULT_TARIFF } from "../lib/pricing.js";
import { useSettings } from "../lib/settings-store.js";
import { createLineMeter, LINE_COUNTER_FONT_STACK, LINE_COUNTER_WIDTH_CM } from "../lib/line-counter.js";
import { MANDATORY_TITLE, withMandatoryTitle } from "../lib/extract-text.js";
import { listUpcomingSlots, formatLongDateCL, resolveBroadcastDate } from "../lib/broadcast-date.js";
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

/* ─── Esquema zod (snapshot del estado al pagar) ──────────────────────────── */
// La radio emite siempre factura — boleta a persona no es una opción.
// Por eso billing_* es siempre obligatorio.
const orderSchema = z.object({
  extractText: z.string().trim().min(10, "El texto del extracto es muy corto").max(50000, "Máximo 50.000 caracteres"),
  procedureType: z.enum(["dga_subterraneas", "dga_superficiales", "dia_seia", "otro"]),
  comuna: z.string().trim().min(2, "Indica la comuna"),
  provincia: z.string().trim().min(2, "Indica la provincia"),
  region: z.string().trim().min(2, "Indica la región"),
  publicationDay: z.union([z.literal(1), z.literal(15)]),
  publicationMonth: z.string().regex(/^\d{4}-\d{2}$/, "Mes inválido"),
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
const initialState = {
  extractText: "",
  procedureType: "dga_subterraneas",
  comuna: "",
  provincia: "",
  region: "",
  comunaInputDirty: false,
  publicationSlotIndex: 0, // índice dentro de upcomingSlots
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
    case "setComuna": {
      const match = findComunaExacta(action.value);
      return {
        ...state,
        comuna: action.value,
        comunaInputDirty: true,
        provincia: match ? match.provincia : state.provincia,
        region: match ? match.region : state.region,
      };
    }
    case "setRUT": {
      // Permitir tipear con o sin formato; aplicamos formato canónico solo si parece RUT.
      return { ...state, clientRUT: action.value };
    }
    default:
      return state;
  }
}

/* ─── Página principal ────────────────────────────────────────────────────── */
export default function Cotizador() {
  // Habilitar indexación: esta es la única página pública del módulo.
  useEffect(() => {
    const meta = document.querySelector('meta[name="robots"]');
    if (meta) meta.setAttribute("content", "index, follow, max-image-preview:large");
  }, []);

  const navigate = useNavigate();
  const settings = useSettings();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitState, setSubmitState] = useState({ status: "idle", message: null });

  // Slots de difusión: próximos agendamientos válidos.
  const upcomingSlots = useMemo(() => listUpcomingSlots(new Date(), 12), []);
  const selectedSlot = upcomingSlots[state.publicationSlotIndex] ?? upcomingSlots[0];

  // Conteo de líneas en vivo.
  const meterRef = useRef(null);
  const [lineCount, setLineCount] = useState(0);
  useEffect(() => {
    meterRef.current = createLineMeter();
    return () => meterRef.current?.dispose();
  }, []);
  // El texto que se difunde y se cobra es siempre `withMandatoryTitle(...)`
  // — la línea "EXTRACTOS" cuenta como una línea más.
  const composedText = useMemo(() => withMandatoryTitle(state.extractText), [state.extractText]);
  useEffect(() => {
    if (!meterRef.current) return;
    setLineCount(meterRef.current.measure(composedText));
  }, [composedText]);

  const tariff = settings.tariff_table ?? DEFAULT_TARIFF;
  const maxLines = Number(tariff?.maxLines) || DEFAULT_TARIFF.maxLines;
  const overLimit = exceedsMaxLines(lineCount, tariff);
  const priceCLP = lineCount > 0 && !overLimit ? calculatePriceCLP(lineCount, tariff) : 0;

  // Validación zod (siempre, mostramos errores solo después de intento de submit).
  // El server recibe el texto ya compuesto con la línea "EXTRACTOS" — así
  // se difunde y se factura siempre con título.
  const formSnapshot = useMemo(() => {
    if (!selectedSlot) return null;
    return {
      extractText: composedText,
      procedureType: state.procedureType,
      comuna: state.comuna,
      provincia: state.provincia,
      region: state.region,
      publicationDay: selectedSlot.day,
      publicationMonth: selectedSlot.monthYear,
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
  }, [state, selectedSlot, composedText]);

  const validation = useMemo(() => {
    if (!formSnapshot) return { ok: false, errors: {} };
    const result = orderSchema.safeParse(formSnapshot);
    if (result.success) return { ok: true, errors: {} };
    const errors = {};
    for (const issue of result.error.issues) {
      const key = issue.path[0];
      if (key && !errors[key]) errors[key] = issue.message;
    }
    return { ok: false, errors };
  }, [formSnapshot]);

  const showErrors = submitAttempted;
  const e = (field) => (showErrors ? validation.errors[field] : undefined);

  // Comuna: warning si el usuario escribió algo y no matchea exacto.
  const comunaWarning = useMemo(() => {
    if (!state.comuna || !state.comunaInputDirty) return null;
    const match = findComunaExacta(state.comuna);
    return match ? null : "No reconocemos esa comuna. Verifica el nombre o avanza igual y la radio confirmará cobertura.";
  }, [state.comuna, state.comunaInputDirty]);

  // Sugerencias para datalist HTML nativo.
  const comunaSuggestions = useMemo(() => {
    return state.comuna ? searchComunas(state.comuna, 8).map((c) => c.comuna) : [];
  }, [state.comuna]);

  async function handleSubmit(ev) {
    ev.preventDefault();
    setSubmitAttempted(true);
    if (overLimit) {
      setSubmitState({
        status: "blocked",
        message:
          `Para extractos que superan las ${maxLines} líneas hay que escribir directamente a ` +
          "administracion@araucanayfrontera.cl — se cotiza como cápsula, no como extracto.",
      });
      return;
    }
    if (!validation.ok) {
      // Llevar foco al primer error.
      requestAnimationFrame(() => {
        const firstErrorField = Object.keys(validation.errors)[0];
        const el = firstErrorField ? document.querySelector(`[data-field="${firstErrorField}"]`) : null;
        if (el && typeof el.scrollIntoView === "function") {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
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
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.orderNumber) {
        // TODO: cuando Flow esté integrado, redirigir a data.paymentRedirectUrl.
        navigate(`/orden/${encodeURIComponent(data.orderNumber)}`);
        return;
      }
      if (r.status === 503) {
        setSubmitState({
          status: "blocked",
          message:
            data.message ??
            "Estamos terminando de configurar el sistema. Por ahora escríbenos a secretaria.araucana@gmail.com con tu cotización y te respondemos.",
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
          "No pudimos procesar tu solicitud en este momento. Intenta de nuevo o escríbenos a secretaria.araucana@gmail.com.",
      });
    } catch (err) {
      setSubmitState({
        status: "error",
        message: "Sin conexión con el servidor. Verifica tu internet e intenta de nuevo.",
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
          <StepBlock number={1} title="Pega el texto del extracto">
            <ExtractEditor
              value={state.extractText}
              composedText={composedText}
              onChange={(v) => dispatch({ type: "set", field: "extractText", value: v })}
              lineCount={lineCount}
              maxLines={maxLines}
              overLimit={overLimit}
              error={e("extractText")}
            />
          </StepBlock>

          <StepBlock number={2} title="Detalles del trámite y la difusión">
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 0 }}>
              <Field label="Tipo de trámite" required htmlFor="procedureType">
                <Select
                  id="procedureType"
                  data-field="procedureType"
                  value={state.procedureType}
                  onChange={(ev) => dispatch({ type: "set", field: "procedureType", value: ev.target.value })}
                >
                  {PROCEDURE_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </Field>

              <Field
                label="Comuna donde se ubica el predio o trámite"
                required
                htmlFor="comuna"
                hint={comunaWarning ?? "Empieza a escribir y te sugerimos comunas."}
                error={e("comuna")}
              >
                <Input
                  id="comuna"
                  data-field="comuna"
                  list="comunas-sugeridas"
                  autoComplete="off"
                  placeholder="Ej. Temuco"
                  value={state.comuna}
                  invalid={!!e("comuna")}
                  onChange={(ev) => dispatch({ type: "setComuna", value: ev.target.value })}
                />
                <datalist id="comunas-sugeridas">
                  {comunaSuggestions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>

              <div className="cotizador-grid-2">
                <Field label="Provincia" htmlFor="provincia" hint="Auto-completa según comuna." error={e("provincia")}>
                  <Input
                    id="provincia"
                    data-field="provincia"
                    value={state.provincia}
                    invalid={!!e("provincia")}
                    onChange={(ev) => dispatch({ type: "set", field: "provincia", value: ev.target.value })}
                  />
                </Field>
                <Field label="Región" htmlFor="region" hint="Auto-completa según comuna." error={e("region")}>
                  <Input
                    id="region"
                    data-field="region"
                    value={state.region}
                    invalid={!!e("region")}
                    onChange={(ev) => dispatch({ type: "set", field: "region", value: ev.target.value })}
                  />
                </Field>
              </div>

              <Field
                label="Fecha de difusión"
                required
                htmlFor="publicationSlot"
                hint="La radio difunde los días 1 o 15 de cada mes. Si caen domingo o festivo, pasa al día hábil siguiente."
              >
                <Select
                  id="publicationSlot"
                  data-field="publicationSlot"
                  value={state.publicationSlotIndex}
                  onChange={(ev) => dispatch({ type: "set", field: "publicationSlotIndex", value: Number(ev.target.value) })}
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
          </StepBlock>

          <StepBlock number={3} title="Tus datos">
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
                  onChange={(ev) => dispatch({ type: "setRUT", value: ev.target.value })}
                  onBlur={(ev) => {
                    if (isValidRUT(ev.target.value)) {
                      dispatch({ type: "setRUT", value: formatRUT(ev.target.value) });
                    }
                  }}
                />
              </Field>
              <Field label="Tratamiento" htmlFor="gender" hint="Aparecerá en el certificado.">
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
              <Field label="Email" required htmlFor="clientEmail" error={e("clientEmail")} hint="Acá te llega el certificado.">
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

          <StepBlock number={4} title="Facturación">
            <p style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, lineHeight: 1.5 }}>
              Toda difusión radial se factura. Indica los datos de la empresa o persona a nombre de quien va la factura.
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
          lineCount={lineCount}
          priceCLP={priceCLP}
          slot={selectedSlot}
          onSubmit={handleSubmit}
          formValid={validation.ok}
          submitState={submitState}
          overLimit={overLimit}
          maxLines={maxLines}
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
          publicaciones administrativas. Cuando envíes la solicitud te llegan por
          email los datos de transferencia y el N° de orden. Pagada la transferencia,
          la radio difunde en la fecha agendada y al día siguiente recibes tu
          certificado.
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

function ExtractEditor({ value, composedText, onChange, lineCount, maxLines, overLimit, error }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
      <Field
        label="Texto del extracto"
        hint={`Pega el texto completo tal como debe difundirse. La línea de título "${MANDATORY_TITLE}" se agrega automáticamente arriba y cuenta como una línea.`}
        error={error}
      >
        <Textarea
          data-field="extractText"
          value={value}
          invalid={!!error}
          placeholder="Ej. Denisse Francisca Contreras Leiva, Rut: 18.036.339-4. Solicita un derecho de aprovechamiento de aguas subterráneas…"
          onChange={(ev) => onChange(ev.target.value)}
          spellCheck
          lang="es-CL"
        />
      </Field>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <span className="mono" style={{ fontSize: 12, color: T.inkSoft, letterSpacing: 0.4, textTransform: "uppercase" }}>
          Vista previa — Bookman Old Style 12 (referencial)
        </span>
        <span
          className="mono"
          style={{ fontSize: 12, color: overLimit ? T.danger : T.greenDark, fontWeight: 600 }}
        >
          {lineCount} {lineCount === 1 ? "línea" : "líneas"} {overLimit ? `· máx ${maxLines}` : ""}
        </span>
      </div>

      <div
        aria-label="Vista previa del texto a difundir"
        style={{
          background: "#fff",
          border: `1px dashed ${T.border}`,
          borderRadius: 8,
          padding: 16,
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          color: T.ink,
          minHeight: 80,
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
          }}
        >
          {value ? composedText : (
            <span style={{ color: T.inkMute, fontFamily: FONTS.body, fontStyle: "italic" }}>
              Acá vas a ver tu texto tal como se cuenta para tarifar (con la línea
              de título "{MANDATORY_TITLE}" arriba).
            </span>
          )}
        </div>
      </div>

      {overLimit && (
        <div
          role="alert"
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: T.danger,
            background: "rgba(197,62,31,0.06)",
            border: "1px solid rgba(197,62,31,0.35)",
            borderRadius: 8,
            padding: "12px 14px",
          }}
        >
          <strong>Excediste el tope de {maxLines} líneas.</strong> Para extractos
          más largos hay que cotizarlo como cápsula. Escríbenos a{" "}
          <a
            href="mailto:administracion@araucanayfrontera.cl"
            style={{ color: T.danger, textDecoration: "underline" }}
          >
            administracion@araucanayfrontera.cl
          </a>{" "}
          y te respondemos en el día.
        </div>
      )}
    </div>
  );
}

function Resumen({ lineCount, priceCLP, slot, onSubmit, formValid, submitState, overLimit, maxLines }) {
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
          <Badge tone={lineCount > 0 ? "primary" : "neutral"}>
            {lineCount > 0 ? "Cotización viva" : "Sin texto"}
          </Badge>
        </div>

        <ResumenRow label="Líneas" value={lineCount > 0 ? `${lineCount}` : "—"} mono />
        <ResumenRow
          label="Monto (IVA incl.)"
          value={overLimit ? "Cotizar aparte" : lineCount > 0 ? formatCLP(priceCLP) : "—"}
          highlight
          mono
        />
        <hr style={{ border: 0, borderTop: `1px solid ${T.border}`, margin: "14px 0" }} />
        <ResumenRow
          label="Fecha de difusión"
          value={slot ? formatLongDateCL(slot.resolved.resolvedDate) : "—"}
        />
        <ResumenRow
          label="3 emisiones diarias"
          value={slot?.resolved.warning ? "—" : "Sí"}
          mono
        />
        {slot?.resolved.warning && (
          <p
            style={{
              fontSize: 12,
              color: T.warn,
              background: "rgba(201,146,60,0.10)",
              border: "1px solid rgba(201,146,60,0.4)",
              borderRadius: 6,
              padding: 10,
              marginTop: 8,
              lineHeight: 1.4,
            }}
          >
            ⚠ {slot.resolved.warning}
          </p>
        )}

        <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            onClick={onSubmit}
            disabled={lineCount === 0 || overLimit}
            loading={submitState?.status === "submitting"}
          >
            {submitState?.status === "submitting" ? "Enviando…" : "Enviar solicitud"}
          </Button>
          {overLimit && (
            <p style={{ fontSize: 11.5, color: T.danger, textAlign: "center", lineHeight: 1.5 }}>
              Supera {maxLines} líneas — escribir a administracion@araucanayfrontera.cl.
            </p>
          )}
          <p style={{ fontSize: 11.5, color: T.inkMute, lineHeight: 1.5, textAlign: "center" }}>
            Recibirás un email con el N° de orden y los datos para transferir.
            Cuando se acredite el pago, se confirma la difusión.
          </p>
          {!formValid && lineCount > 0 && submitState?.status !== "submitting" && !submitState?.message && (
            <p style={{ fontSize: 11.5, color: T.warn, textAlign: "center" }}>
              Completa los datos del trámite para continuar.
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
        <strong style={{ color: T.greenDark }}>Sobre el conteo de líneas:</strong> es referencial. Si tu navegador no tiene
        Bookman Old Style instalada, el conteo puede diferir levemente del que hace
        la radio en Word. La operadora ajusta el monto antes del cobro si detecta diferencia.
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
