// Helpers compartidos por dashboard y detalle de orden.

export const STATUS_LABELS = {
  draft: "Borrador",
  pending_payment: "Pago pendiente",
  paid: "Pagada",
  scheduled: "Agendada",
  broadcast_complete: "Difundida",
  certificate_generated: "Certificado generado",
  certificate_sent: "Certificado enviado",
  completed: "Completada",
  payment_failed: "Pago fallido",
  cancelled: "Cancelada",
};

export const STATUS_TONES = {
  draft: "neutral",
  pending_payment: "warn",
  paid: "primary",
  scheduled: "primary",
  broadcast_complete: "accent",
  certificate_generated: "accent",
  certificate_sent: "accent",
  completed: "primary",
  payment_failed: "danger",
  cancelled: "neutral",
};

export const STATUS_ORDER = [
  "pending_payment",
  "paid",
  "scheduled",
  "broadcast_complete",
  "certificate_generated",
  "certificate_sent",
  "completed",
  "payment_failed",
  "cancelled",
];

export const PROCEDURE_LABELS = {
  dga_subterraneas: "DGA aguas subterráneas",
  dga_superficiales: "DGA aguas superficiales",
  dia_seia: "DIA al SEIA",
  otro: "Otro",
};

export function statusLabel(s) {
  return STATUS_LABELS[s] || s;
}
export function statusTone(s) {
  return STATUS_TONES[s] || "neutral";
}
export function procedureLabel(p) {
  return PROCEDURE_LABELS[p] || p;
}

export function formatCLPSimple(amount) {
  return "$" + Number(amount || 0).toLocaleString("es-CL");
}

const MESES = ["enero","febrero","marzo","abril","mayo","junio",
               "julio","agosto","septiembre","octubre","noviembre","diciembre"];

export function formatLongDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = String(isoDate).split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return isoDate;
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

export function formatShortDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = String(isoDate).split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return isoDate;
  return `${String(d).padStart(2,"0")}/${String(m).padStart(2,"0")}/${y}`;
}

export function formatTimestamp(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  });
}
