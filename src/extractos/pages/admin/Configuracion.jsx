import React, { useMemo, useState } from "react";
import { T, FONTS } from "../../theme.js";
import { Card, Field, Input, Button, Badge } from "../../components/ui.jsx";
import {
  useSettings,
  updateSettings,
  resetSettings,
  hasLocalOverrides,
  DEFAULT_SETTINGS,
} from "../../lib/settings-store.js";
import { calculatePriceCLP, formatCLP } from "../../lib/pricing.js";

/* ─── Hook para forms con dirty-state + save/reset ────────────────────────── */
function useDraft(initial) {
  const [draft, setDraft] = useState(initial);
  const [savedAt, setSavedAt] = useState(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  return {
    draft,
    setDraft,
    setField: (k, v) => setDraft((prev) => ({ ...prev, [k]: v })),
    dirty,
    savedAt,
    markSaved: () => setSavedAt(Date.now()),
    revert: () => setDraft(initial),
  };
}

/* ─── Layout helper para una sección ──────────────────────────────────────── */
function Section({ title, description, children, dirty, onSave, onRevert, savedAt }) {
  return (
    <Card style={{ padding: 22 }}>
      <div style={{ marginBottom: 14 }}>
        <h2 className="display" style={{ fontSize: 19, color: T.greenDark, fontWeight: 500 }}>{title}</h2>
        {description && (
          <p style={{ fontSize: 13, color: T.inkSoft, marginTop: 4, lineHeight: 1.5 }}>{description}</p>
        )}
      </div>
      {children}
      <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "flex-end", marginTop: 14, flexWrap: "wrap" }}>
        {savedAt && !dirty && (
          <span className="mono" style={{ fontSize: 11, color: T.ok }}>
            ✓ guardado {timeAgo(savedAt)}
          </span>
        )}
        {dirty && (
          <Button variant="ghost" size="sm" type="button" onClick={onRevert}>
            Descartar
          </Button>
        )}
        <Button variant="secondary" size="sm" type="button" disabled={!dirty} onClick={onSave}>
          Guardar
        </Button>
      </div>
    </Card>
  );
}

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 5) return "ahora";
  if (s < 60) return `hace ${s}s`;
  if (s < 3600) return `hace ${Math.round(s / 60)} min`;
  return new Date(ts).toLocaleString("es-CL");
}

/* ─── Página ──────────────────────────────────────────────────────────────── */
export default function AdminConfiguracion() {
  const settings = useSettings();
  const overridden = hasLocalOverrides();

  return (
    <section style={{ padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <header style={{ marginBottom: 4 }}>
          <Badge tone="warn" style={{ marginBottom: 10 }}>Modo demo · localStorage</Badge>
          <h1 className="display" style={{ fontSize: 30, color: T.greenDark, marginBottom: 6 }}>
            Configuración
          </h1>
          <p style={{ fontSize: 14, color: T.inkSoft, lineHeight: 1.55, maxWidth: 720 }}>
            Acá editas el tarifario, los datos institucionales que aparecen en
            certificados y emails, los horarios de difusión y los destinatarios
            de notificaciones internas.
            <br />
            <strong>Mientras no haya Supabase conectado:</strong> los cambios se guardan solo en
            este navegador. Cuando se cargue la base, replicamos estos valores
            y queda persistente para todos.
          </p>
          {overridden && (
            <div style={{ marginTop: 10 }}>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  if (confirm("¿Restablecer todos los settings a los valores por defecto? Se perderán las ediciones locales.")) {
                    resetSettings();
                  }
                }}
              >
                Restablecer defaults
              </Button>
            </div>
          )}
        </header>

        <TariffSection settings={settings} />
        <IdentitySection settings={settings} />
        <ContactSection settings={settings} />
        <BankSection settings={settings} />
        <CoverageSection settings={settings} />
        <BroadcastTimesSection settings={settings} />
        <NotificationsSection settings={settings} />
        <SignersPlaceholderSection />
      </div>
    </section>
  );
}

/* ─── Tarifario ───────────────────────────────────────────────────────────── */
function TariffSection({ settings }) {
  const initial = settings.tariff_table ?? DEFAULT_SETTINGS.tariff_table;
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft({
    minLinesFlat: Number(initial.minLinesFlat) || 5,
    minPrice: Number(initial.minPrice) || 36000,
    baseAboveMin: Number(initial.baseAboveMin) || 26000,
    perLineAboveMin: Number(initial.perLineAboveMin) || 2000,
    maxLines: Number(initial.maxLines) || 20,
  });

  const simRows = useMemo(() => {
    const tariff = draft;
    const max = Number(draft.maxLines) || 20;
    const lines = [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].filter((n) => n <= max);
    return lines.map((n) => ({ n, price: calculatePriceCLP(n, tariff) }));
  }, [draft]);

  return (
    <Section
      title="Tarifario"
      description={
        <>
          Hasta <strong>{draft.minLinesFlat}</strong> líneas se cobra el mínimo plano.
          Desde la línea {draft.minLinesFlat + 1} el precio es{" "}
          <strong>{formatCLP(draft.baseAboveMin)} + N × {formatCLP(draft.perLineAboveMin)}</strong>.
          Tope <strong>{draft.maxLines}</strong> líneas — sobre eso se cotiza
          aparte como cápsula. Todos los montos en CLP, IVA incluido.
        </>
      }
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings({ tariff_table: { ...draft } });
        markSaved();
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Mínimo: hasta N líneas" htmlFor="minLinesFlat">
          <Input
            id="minLinesFlat"
            type="number"
            min="1"
            value={draft.minLinesFlat}
            onChange={(ev) => setField("minLinesFlat", Number(ev.target.value))}
          />
        </Field>
        <Field label={`Precio mínimo (≤ ${draft.minLinesFlat} líneas)`} htmlFor="minPrice">
          <Input
            id="minPrice"
            type="number"
            min="0"
            value={draft.minPrice}
            onChange={(ev) => setField("minPrice", Number(ev.target.value))}
          />
        </Field>
        <Field label="Base sobre el mínimo" htmlFor="baseAboveMin" hint="Se suma a (N × precio por línea)">
          <Input
            id="baseAboveMin"
            type="number"
            min="0"
            value={draft.baseAboveMin}
            onChange={(ev) => setField("baseAboveMin", Number(ev.target.value))}
          />
        </Field>
        <Field label="Precio por línea adicional" htmlFor="perLineAboveMin">
          <Input
            id="perLineAboveMin"
            type="number"
            min="0"
            value={draft.perLineAboveMin}
            onChange={(ev) => setField("perLineAboveMin", Number(ev.target.value))}
          />
        </Field>
        <Field
          label="Tope de líneas"
          htmlFor="maxLines"
          hint="Sobre este número el cotizador deriva a administración (cápsula)."
        >
          <Input
            id="maxLines"
            type="number"
            min="1"
            value={draft.maxLines}
            onChange={(ev) => setField("maxLines", Number(ev.target.value))}
          />
        </Field>
      </div>

      <div style={{ marginTop: 18, padding: "14px 16px", background: T.cream, border: `1px solid ${T.border}`, borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.4 }}>
          Simulador en vivo
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8 }}>
          {simRows.map(({ n, price }) => (
            <div
              key={n}
              style={{
                background: "#fff",
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                padding: "8px 10px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                fontFamily: FONTS.mono,
                fontSize: 13,
              }}
            >
              <span style={{ color: T.inkSoft }}>{n} {n === 1 ? "línea" : "líneas"}</span>
              <strong style={{ color: T.greenDark }}>{formatCLP(price)}</strong>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ─── Identidad institucional ─────────────────────────────────────────────── */
function IdentitySection({ settings }) {
  const initial = {
    radio_legal_name: settings.radio_legal_name ?? "",
    radio_legal_rut: settings.radio_legal_rut ?? "",
    radio_giro: settings.radio_giro ?? "",
    radio_address: settings.radio_address ?? "",
  };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Identidad institucional"
      description="Datos legales que aparecen en certificados de difusión y facturas. Asegúrate de que la razón social coincida con la del SII."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings(draft);
        markSaved();
      }}
    >
      <Field label="Razón social" htmlFor="radio_legal_name">
        <Input id="radio_legal_name" value={draft.radio_legal_name} onChange={(e) => setField("radio_legal_name", e.target.value)} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="RUT" htmlFor="radio_legal_rut">
          <Input id="radio_legal_rut" value={draft.radio_legal_rut} onChange={(e) => setField("radio_legal_rut", e.target.value)} />
        </Field>
        <Field label="Giro" htmlFor="radio_giro">
          <Input id="radio_giro" value={draft.radio_giro} onChange={(e) => setField("radio_giro", e.target.value)} />
        </Field>
      </div>
      <Field label="Domicilio comercial" htmlFor="radio_address">
        <Input id="radio_address" value={draft.radio_address} onChange={(e) => setField("radio_address", e.target.value)} />
      </Field>
    </Section>
  );
}

/* ─── Contacto ────────────────────────────────────────────────────────────── */
function ContactSection({ settings }) {
  const initial = {
    radio_phone_landline: settings.radio_phone_landline ?? "",
    radio_phone_mobile: settings.radio_phone_mobile ?? "",
    radio_email_administration: settings.radio_email_administration ?? "",
    radio_email_secretary: settings.radio_email_secretary ?? "",
  };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Contacto público"
      description="Aparece en el footer del cotizador, certificados y emails al cliente."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings(draft);
        markSaved();
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Teléfono fijo" htmlFor="radio_phone_landline">
          <Input id="radio_phone_landline" value={draft.radio_phone_landline} onChange={(e) => setField("radio_phone_landline", e.target.value)} />
        </Field>
        <Field label="Teléfono móvil" htmlFor="radio_phone_mobile">
          <Input id="radio_phone_mobile" value={draft.radio_phone_mobile} onChange={(e) => setField("radio_phone_mobile", e.target.value)} />
        </Field>
      </div>
      <Field label="Email administración / facturas" htmlFor="radio_email_administration">
        <Input id="radio_email_administration" type="email" value={draft.radio_email_administration} onChange={(e) => setField("radio_email_administration", e.target.value)} />
      </Field>
      <Field label="Email secretaría / coordinación" htmlFor="radio_email_secretary">
        <Input id="radio_email_secretary" type="email" value={draft.radio_email_secretary} onChange={(e) => setField("radio_email_secretary", e.target.value)} />
      </Field>
    </Section>
  );
}

/* ─── Datos bancarios ─────────────────────────────────────────────────────── */
function BankSection({ settings }) {
  const initial = {
    radio_bank_name: settings.radio_bank_name ?? "",
    radio_bank_account_type: settings.radio_bank_account_type ?? "",
    radio_bank_account_number: settings.radio_bank_account_number ?? "",
  };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Datos bancarios"
      description="Solo se muestran al cliente cuando paga por transferencia (no aplica a Flow.cl). Útiles también para facturación."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings(draft);
        markSaved();
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="Banco" htmlFor="radio_bank_name">
          <Input id="radio_bank_name" value={draft.radio_bank_name} onChange={(e) => setField("radio_bank_name", e.target.value)} />
        </Field>
        <Field label="Tipo de cuenta" htmlFor="radio_bank_account_type">
          <Input id="radio_bank_account_type" value={draft.radio_bank_account_type} onChange={(e) => setField("radio_bank_account_type", e.target.value)} />
        </Field>
      </div>
      <Field label="Número de cuenta" htmlFor="radio_bank_account_number">
        <Input id="radio_bank_account_number" value={draft.radio_bank_account_number} onChange={(e) => setField("radio_bank_account_number", e.target.value)} />
      </Field>
    </Section>
  );
}

/* ─── Cobertura por defecto ───────────────────────────────────────────────── */
function CoverageSection({ settings }) {
  const initial = { radio_coverage_default: settings.radio_coverage_default ?? "" };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Cobertura radial por defecto"
      description="Texto que se inserta en el certificado cuando el aviso aplica a varias provincias o cuando el cliente no especifica."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings(draft);
        markSaved();
      }}
    >
      <Field label="Cobertura" htmlFor="radio_coverage_default" hint="Ej. Provincia de Cautín, IX Región de La Araucanía">
        <Input id="radio_coverage_default" value={draft.radio_coverage_default} onChange={(e) => setField("radio_coverage_default", e.target.value)} />
      </Field>
    </Section>
  );
}

/* ─── Horarios de difusión ────────────────────────────────────────────────── */
function BroadcastTimesSection({ settings }) {
  const initialList = settings.default_broadcast_times ?? ["10:05", "11:05", "11:35"];
  const initial = {
    t1: initialList[0] || "",
    t2: initialList[1] || "",
    t3: initialList[2] || "",
  };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Horarios típicos de difusión"
      description="3 emisiones diarias. Estos horarios se pre-llenan al marcar una orden como difundida; la operadora puede ajustarlos por orden."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        updateSettings({ default_broadcast_times: [draft.t1, draft.t2, draft.t3] });
        markSaved();
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
        <Field label="Emisión 1" htmlFor="t1">
          <Input id="t1" type="time" value={draft.t1} onChange={(e) => setField("t1", e.target.value)} />
        </Field>
        <Field label="Emisión 2" htmlFor="t2">
          <Input id="t2" type="time" value={draft.t2} onChange={(e) => setField("t2", e.target.value)} />
        </Field>
        <Field label="Emisión 3" htmlFor="t3">
          <Input id="t3" type="time" value={draft.t3} onChange={(e) => setField("t3", e.target.value)} />
        </Field>
      </div>
    </Section>
  );
}

/* ─── Notificaciones internas ─────────────────────────────────────────────── */
function NotificationsSection({ settings }) {
  const initial = { csv: (settings.notification_emails ?? []).join(", ") };
  const { draft, setField, dirty, savedAt, markSaved, revert } = useDraft(initial);

  return (
    <Section
      title="Notificaciones internas"
      description="Lista de emails que reciben aviso cuando entra una orden nueva, cuando hay difusión pendiente del día, y otras alertas operativas. Separa varios por coma."
      dirty={dirty}
      savedAt={savedAt}
      onRevert={revert}
      onSave={() => {
        const list = draft.csv
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);
        updateSettings({ notification_emails: list });
        markSaved();
      }}
    >
      <Field label="Emails (separados por coma)" htmlFor="notif">
        <Input id="notif" value={draft.csv} onChange={(e) => setField("csv", e.target.value)} placeholder="admin@radio.cl, secretaria@radio.cl" />
      </Field>
    </Section>
  );
}

/* ─── Firmantes (placeholder F2) ──────────────────────────────────────────── */
function SignersPlaceholderSection() {
  return (
    <Card style={{ padding: 22, background: "rgba(201,146,60,0.05)", borderStyle: "dashed" }}>
      <Badge tone="warn" style={{ marginBottom: 10 }}>Pendiente — Fase 2</Badge>
      <h2 className="display" style={{ fontSize: 19, color: T.greenDark, marginBottom: 6, fontWeight: 500 }}>
        Firmantes del certificado
      </h2>
      <p style={{ fontSize: 13, color: T.inkSoft, lineHeight: 1.5 }}>
        Acá vas a poder agregar uno o más firmantes (nombre, RUT, título, imagen
        de firma PNG y timbre PNG). Cuando una orden se marque como difundida,
        el sistema generará el PDF del certificado superponiendo la firma e
        imagen del firmante por defecto. Esta sección se activa en Fase 2,
        junto con la generación del PDF.
      </p>
    </Card>
  );
}
