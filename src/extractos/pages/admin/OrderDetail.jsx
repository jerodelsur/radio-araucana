import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { T, FONTS } from "../../theme.js";
import { Card, Field, Input, Textarea, Button, Badge, ConfirmDialog } from "../../components/ui.jsx";
import { useAuth } from "../../lib/auth.jsx";
import { getSupabaseBrowser } from "../../lib/supabase-browser.js";
import { useSettings } from "../../lib/settings-store.js";
import { LINE_COUNTER_FONT_STACK } from "../../lib/line-counter.js";
import {
  statusLabel,
  statusTone,
  procedureLabel,
  formatCLPSimple,
  formatLongDate,
  formatTimestamp,
} from "../../lib/order-helpers.js";

export default function OrderDetail() {
  const { orderNumber } = useParams();
  const { user } = useAuth();
  const settings = useSettings();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setErr(null);
    const supabase = getSupabaseBrowser();
    try {
      const queryPromise = supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber)
        .maybeSingle();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout: la consulta tardó más de 10s.")), 10000)
      );
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      if (error) {
        setErr(error.message);
        setOrder(null);
      } else {
        setOrder(data);
      }
    } catch (e) {
      setErr(e?.message || "Error al cargar la orden.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderNumber]);

  useEffect(() => { reload(); }, [reload]);

  async function patch(updates, successMsg, notifyEvent) {
    if (!order) return;
    setBusy(true);
    setActionMsg(null);
    const supabase = getSupabaseBrowser();
    const { error } = await supabase
      .from("orders")
      .update(updates)
      .eq("id", order.id);
    if (error) {
      setBusy(false);
      setActionMsg({ type: "error", text: error.message });
      return;
    }

    // Notificar al cliente por email si la transición lo amerita.
    let notifyResult = null;
    if (notifyEvent) {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        if (!token) {
          notifyResult = { ok: false, error: "Sin sesión activa para enviar email." };
        } else {
          const r = await fetch("/api/extractos/admin/notify-client", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ orderNumber: order.order_number, eventType: notifyEvent }),
          });
          notifyResult = await r.json().catch(() => ({ ok: false }));
        }
      } catch (e) {
        notifyResult = { ok: false, error: e?.message || "Error al notificar." };
      }
    }

    setBusy(false);
    const baseMsg = successMsg || "Guardado.";
    if (notifyEvent) {
      if (notifyResult?.sent) {
        setActionMsg({ type: "ok", text: `${baseMsg} Email enviado al cliente.` });
      } else if (notifyResult?.reason === "mailer_not_configured") {
        setActionMsg({ type: "ok", text: `${baseMsg} (Email no enviado: SMTP no configurado en este entorno.)` });
      } else {
        setActionMsg({ type: "ok", text: `${baseMsg} ⚠ Email al cliente falló: ${notifyResult?.error || notifyResult?.reason || "intenta de nuevo"}.` });
      }
    } else {
      setActionMsg({ type: "ok", text: baseMsg });
    }
    await reload();
  }

  if (loading) {
    return <div style={{ padding: 60, textAlign: "center", color: T.inkSoft }}>Cargando orden…</div>;
  }
  if (err) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: T.danger }}>Error: {err}</p>
        <Link to="/admin" style={{ color: T.greenDark }}>← Volver al panel</Link>
      </div>
    );
  }
  if (!order) {
    return (
      <div style={{ padding: 60, textAlign: "center" }}>
        <p style={{ color: T.inkSoft }}>No encontramos la orden <code>{orderNumber}</code>.</p>
        <Link to="/admin" style={{ color: T.greenDark }}>← Volver al panel</Link>
      </div>
    );
  }

  return (
    <section style={{ padding: "32px 20px 60px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <Link to="/admin" style={{ color: T.inkSoft, fontSize: 13, textDecoration: "none" }}>← Panel</Link>

        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginTop: 14, marginBottom: 22 }}>
          <div>
            <Badge tone={statusTone(order.status)} style={{ marginBottom: 8 }}>{statusLabel(order.status)}</Badge>
            <h1 className="display mono" style={{ fontSize: 30, color: T.greenDark, marginBottom: 4 }}>
              {order.order_number}
            </h1>
            <p style={{ fontSize: 13, color: T.inkSoft }}>
              Recibida {formatTimestamp(order.created_at)} ·
              difusión {formatLongDate(order.resolved_publication_date)}
            </p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 28, color: T.greenDark, fontWeight: 600 }}>
              {formatCLPSimple(order.amount_clp)}
            </div>
            <div style={{ fontSize: 12, color: T.inkSoft }}>
              {order.line_count} {order.line_count === 1 ? "línea" : "líneas"} · IVA incl.
            </div>
          </div>
        </header>

        {actionMsg && (
          <div
            role="status"
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              borderRadius: 8,
              fontSize: 13,
              background: actionMsg.type === "ok" ? "rgba(78,165,82,0.10)" : "rgba(197,62,31,0.08)",
              border: `1px solid ${actionMsg.type === "ok" ? "rgba(78,165,82,0.4)" : "rgba(197,62,31,0.35)"}`,
              color: actionMsg.type === "ok" ? T.greenDark : T.danger,
            }}
          >
            {actionMsg.text}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)",
            gap: 22,
            alignItems: "start",
          }}
        >
          {/* Columna principal */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18, minWidth: 0 }}>
            <Section title="Cliente">
              <Pair label="Nombre" value={order.client_name} />
              <Pair label="RUT" value={order.client_rut} />
              <Pair label="Email" value={<a href={`mailto:${order.client_email}`} style={{ color: T.greenDark }}>{order.client_email}</a>} />
              <Pair label="Teléfono" value={<a href={`tel:${(order.client_phone || "").replace(/\s+/g,"")}`} style={{ color: T.greenDark }}>{order.client_phone}</a>} />
              {order.client_organization && <Pair label="Organización" value={order.client_organization} />}
              <Pair label="Tratamiento" value={order.client_gender === "sr" ? "Sr." : order.client_gender === "sra" ? "Sra." : "Sr./Sra."} />
            </Section>

            <Section title="Trámite">
              <Pair label="Tipo" value={procedureLabel(order.procedure_type)} />
              <Pair label="Comuna" value={order.comuna} />
              <Pair label="Provincia" value={order.provincia} />
              <Pair label="Región" value={order.region} />
              <Pair label="Día solicitado" value={`${order.publication_day} de ${order.publication_month}`} />
              <Pair label="Fecha resuelta" value={formatLongDate(order.resolved_publication_date)} />
            </Section>

            <Section title="Texto del extracto">
              <div
                className="bookman"
                style={{
                  background: "#fff",
                  border: `1px dashed ${T.border}`,
                  borderRadius: 8,
                  padding: 16,
                  fontFamily: LINE_COUNTER_FONT_STACK,
                  fontSize: "12pt",
                  lineHeight: 1.4,
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                }}
              >
                {order.extract_text}
              </div>
            </Section>

            <Section title="Facturación">
              <Pair label="Razón social" value={order.billing_legal_name || "—"} />
              <Pair label="RUT empresa" value={order.billing_rut || "—"} />
              <Pair label="Giro" value={order.billing_giro || "—"} />
              <Pair label="Domicilio" value={order.billing_address || "—"} />
              <Pair label="Email factura" value={order.billing_email ? <a href={`mailto:${order.billing_email}`} style={{ color: T.greenDark }}>{order.billing_email}</a> : "—"} />
            </Section>

            <NotesSection order={order} onSave={(notes) => patch({ admin_notes: notes }, "Nota guardada.")} busy={busy} />
          </div>

          {/* Sidebar de acciones */}
          <aside style={{ position: "sticky", top: 80, alignSelf: "start", display: "flex", flexDirection: "column", gap: 14 }}>
            <ActionsCard order={order} busy={busy} patch={patch} userId={user?.id} settings={settings} />
            <TimelineCard order={order} />
          </aside>
        </div>
      </div>
    </section>
  );
}

/* ─── Sub-componentes ─────────────────────────────────────────────────────── */

function Section({ title, children }) {
  return (
    <Card>
      <h2 className="display" style={{ fontSize: 16, color: T.greenDark, marginBottom: 12, fontWeight: 500 }}>
        {title}
      </h2>
      {children}
    </Card>
  );
}

function Pair({ label, value }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "180px 1fr",
        gap: 12,
        padding: "6px 0",
        borderBottom: `1px solid ${T.border}`,
        fontSize: 13,
      }}
    >
      <span style={{ color: T.inkSoft }}>{label}</span>
      <span style={{ color: T.ink }}>{value}</span>
    </div>
  );
}

function ActionsCard({ order, busy, patch, userId, settings }) {
  const canMarkPaid = order.status === "pending_payment";
  const canMarkBroadcast = order.status === "paid" || order.status === "scheduled";
  const canCancel = !["completed", "cancelled"].includes(order.status);
  const broadcastTimes = Array.isArray(settings?.default_broadcast_times) && settings.default_broadcast_times.length >= 3
    ? settings.default_broadcast_times
    : ["10:00", "10:05", "10:10"];

  // Estado del modal: null = cerrado; objeto = modal abierto con esa acción.
  // kind ∈ "pay" | "broadcast" | "complete" | "cancel"
  const [pending, setPending] = useState(null);
  // Para cancelar: motivo escrito por la operadora.
  const [cancelReason, setCancelReason] = useState("");

  function close() {
    setPending(null);
    setCancelReason("");
  }

  function execute() {
    if (!pending) return;
    const onDone = () => close();
    if (pending.kind === "pay") {
      patch(
        {
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "transferencia",
          payment_provider: "manual",
        },
        "Marcada como pagada.",
        "payment_confirmed",
      ).finally(onDone);
    } else if (pending.kind === "broadcast") {
      patch(
        {
          status: "broadcast_complete",
          broadcast_marked_at: new Date().toISOString(),
          broadcast_marked_by: userId || null,
          broadcast_time_1: broadcastTimes[0] || null,
          broadcast_time_2: broadcastTimes[1] || null,
          broadcast_time_3: broadcastTimes[2] || null,
        },
        "Marcada como difundida.",
        "broadcast_complete",
      ).finally(onDone);
    } else if (pending.kind === "complete") {
      patch({ status: "completed" }, "Marcada como completada.").finally(onDone);
    } else if (pending.kind === "cancel") {
      patch(
        {
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
          cancelled_by: userId || null,
          cancelled_reason: cancelReason.trim() || "Sin motivo indicado",
        },
        "Orden cancelada.",
        "cancelled",
      ).finally(onDone);
    }
  }

  return (
    <Card>
      <h3 className="display" style={{ fontSize: 15, color: T.greenDark, marginBottom: 10, fontWeight: 500 }}>
        Acciones
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <Button
          type="button"
          variant="primary"
          disabled={!canMarkPaid || busy}
          onClick={() => setPending({ kind: "pay" })}
        >
          ✓ Marcar pagada
        </Button>

        <Button
          type="button"
          variant="secondary"
          disabled={!canMarkBroadcast || busy}
          onClick={() => setPending({ kind: "broadcast" })}
        >
          📻 Marcar difundida
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={busy}
          onClick={() => setPending({ kind: "complete" })}
        >
          Marcar completada
        </Button>

        <hr style={{ border: 0, borderTop: `1px solid ${T.border}`, margin: "8px 0" }} />

        <Button
          type="button"
          variant="ghost"
          disabled={!canCancel || busy}
          onClick={() => setPending({ kind: "cancel" })}
          style={{ color: T.danger }}
        >
          Cancelar orden
        </Button>
      </div>

      <p style={{ marginTop: 12, fontSize: 11, color: T.inkMute, lineHeight: 1.5 }}>
        Las acciones que envían email al cliente (pagada, difundida, cancelada)
        muestran un resumen antes de confirmar.
      </p>

      {/* Diálogo de confirmación: pagada */}
      <ConfirmDialog
        open={pending?.kind === "pay"}
        title="Marcar pagada"
        confirmLabel="Sí, confirmar pago y enviar email"
        cancelLabel="Cancelar"
        tone="primary"
        busy={busy}
        onCancel={close}
        onConfirm={execute}
      >
        <p style={{ marginBottom: 14 }}>
          Estás por <strong>confirmar que el pago de {formatCLPSimple(order.amount_clp)} está acreditado</strong> en
          la cuenta bancaria de la radio.
        </p>
        <EmailPreview
          to={order.client_email}
          subject={`Pago recibido — Tu aviso queda agendado para el ${formatLongDate(order.resolved_publication_date)} (${order.order_number})`}
          summary={`Confirmación de pago recibido. El cliente queda con su difusión agendada para ${formatLongDate(order.resolved_publication_date)}.`}
        />
      </ConfirmDialog>

      {/* Diálogo de confirmación: difundida */}
      <ConfirmDialog
        open={pending?.kind === "broadcast"}
        title="Marcar como difundida"
        confirmLabel="Sí, marcar difundida y enviar email"
        cancelLabel="Cancelar"
        tone="primary"
        busy={busy}
        onCancel={close}
        onConfirm={execute}
      >
        <p style={{ marginBottom: 14 }}>
          Estás confirmando que el aviso fue transmitido hoy en los horarios:{" "}
          <strong>{broadcastTimes.slice(0, 3).join(" · ")}</strong>.
        </p>
        <EmailPreview
          to={order.client_email}
          subject={`Tu aviso fue difundido hoy — Orden ${order.order_number}`}
          summary={`Confirmación de difusión hoy con horarios. Mensaje al cliente: "esperá en las próximas horas hábiles el certificado y la factura".`}
        />
      </ConfirmDialog>

      {/* Diálogo de confirmación: completada (sin email) */}
      <ConfirmDialog
        open={pending?.kind === "complete"}
        title="Marcar como completada"
        confirmLabel="Sí, marcar completada"
        cancelLabel="Volver"
        tone="primary"
        busy={busy}
        onCancel={close}
        onConfirm={execute}
      >
        <p style={{ marginBottom: 8 }}>
          Cierra el flujo de la orden. Úsalo cuando ya enviaste certificado y factura al cliente.
        </p>
        <p style={{ fontSize: 12, color: T.inkSoft }}>
          Esta acción <strong>no envía email al cliente</strong> — es solo un cierre administrativo interno.
        </p>
      </ConfirmDialog>

      {/* Diálogo de confirmación: cancelar (con motivo) */}
      <ConfirmDialog
        open={pending?.kind === "cancel"}
        title="Cancelar orden"
        confirmLabel="Sí, cancelar y enviar email"
        cancelLabel="Volver"
        tone="danger"
        busy={busy}
        onCancel={close}
        onConfirm={execute}
      >
        <p style={{ marginBottom: 14 }}>
          Estás por <strong>cancelar la orden {order.order_number}</strong>. Esta acción queda registrada en el historial.
        </p>
        <Field
          label="Motivo (opcional, se incluye en el email al cliente)"
          htmlFor="cancel-reason"
          hint="Si dejas vacío, el cliente recibe email sin motivo específico."
        >
          <Textarea
            id="cancel-reason"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Ej. Cliente solicitó cancelar por cambio de fecha, pago no acreditado, etc."
            style={{ minHeight: 70 }}
          />
        </Field>
        <EmailPreview
          to={order.client_email}
          subject={`Orden ${order.order_number} cancelada`}
          summary={cancelReason.trim()
            ? `Aviso de cancelación con el motivo que escribiste arriba.`
            : `Aviso de cancelación sin motivo específico.`}
        />
      </ConfirmDialog>
    </Card>
  );
}

function EmailPreview({ to, subject, summary }) {
  return (
    <div
      style={{
        background: T.cream,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "12px 14px",
        fontSize: 13,
        marginTop: 4,
      }}
    >
      <div style={{ fontSize: 11, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 6, fontFamily: FONTS.mono }}>
        ✉ Email automático al cliente
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "60px 1fr", gap: 6, fontSize: 12.5, lineHeight: 1.4 }}>
        <span style={{ color: T.inkSoft }}>Para:</span>
        <span style={{ color: T.ink, wordBreak: "break-all" }}>{to}</span>
        <span style={{ color: T.inkSoft }}>Asunto:</span>
        <span style={{ color: T.ink }}>{subject}</span>
      </div>
      {summary && (
        <p style={{ fontSize: 12, color: T.inkSoft, marginTop: 8, lineHeight: 1.5, paddingTop: 8, borderTop: `1px dashed ${T.border}` }}>
          {summary}
        </p>
      )}
    </div>
  );
}

function TimelineCard({ order }) {
  const events = [];
  if (order.created_at) events.push({ at: order.created_at, label: "Solicitud recibida" });
  if (order.paid_at) events.push({ at: order.paid_at, label: "Pago acreditado" });
  if (order.broadcast_marked_at) events.push({ at: order.broadcast_marked_at, label: "Marcada difundida" });
  if (order.certificate_generated_at) events.push({ at: order.certificate_generated_at, label: "Certificado generado" });
  if (order.certificate_sent_at) events.push({ at: order.certificate_sent_at, label: "Certificado enviado" });
  if (order.cancelled_at) events.push({ at: order.cancelled_at, label: "Cancelada" });

  events.sort((a, b) => new Date(a.at) - new Date(b.at));

  return (
    <Card>
      <h3 className="display" style={{ fontSize: 15, color: T.greenDark, marginBottom: 10, fontWeight: 500 }}>
        Historial
      </h3>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((ev, i) => (
          <li key={i} style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.4 }}>
            <span className="mono" style={{ display: "block", color: T.ink, fontSize: 11 }}>
              {formatTimestamp(ev.at)}
            </span>
            {ev.label}
          </li>
        ))}
      </ol>
    </Card>
  );
}

function NotesSection({ order, onSave, busy }) {
  const [draft, setDraft] = useState(order.admin_notes || "");
  useEffect(() => { setDraft(order.admin_notes || ""); }, [order.admin_notes]);
  const dirty = draft !== (order.admin_notes || "");

  return (
    <Card>
      <h2 className="display" style={{ fontSize: 16, color: T.greenDark, marginBottom: 12, fontWeight: 500 }}>
        Notas internas
      </h2>
      <Textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Apuntes operativos: confirmación del cliente, observaciones del banco, ajustes del aviso, etc."
        style={{ minHeight: 100 }}
      />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
        {dirty && (
          <Button variant="ghost" size="sm" type="button" onClick={() => setDraft(order.admin_notes || "")}>
            Descartar
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={!dirty || busy}
          loading={busy && dirty}
          onClick={() => onSave(draft)}
        >
          Guardar nota
        </Button>
      </div>
    </Card>
  );
}
