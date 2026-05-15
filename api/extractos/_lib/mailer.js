// Transporter SMTP (nodemailer) + helpers para emails transaccionales.
//
// Diseñado para ser agnóstico al provider: cambias 4 envs y migras de proveedor.
//
// Beta: usamos Resend (smtp.resend.com:587). Gratis 3000/mes.
// Para Gmail SMTP, Postmark, SES, etc. solo cambias SMTP_HOST/PORT/USER/PASS.
//
// Envs requeridas:
//   SMTP_HOST           — ej. smtp.resend.com
//   SMTP_PORT           — ej. 587 (STARTTLS) o 465 (TLS implícito)
//   SMTP_USER           — usuario (Resend usa literal "resend"; Gmail usa el email)
//   SMTP_PASS           — API key del provider o app password
//   EMAIL_FROM          — dirección remitente (ej. extractos@araucanayfrontera.cl)
//   EMAIL_FROM_NAME     — nombre que ve el destinatario (opcional)
//   ADMIN_NOTIFICATION_EMAILS — CSV de emails internos
//
// Si las envs no están, isMailerConfigured() devuelve false y los endpoints
// pueden seguir funcionando sin enviar emails (modo degradado).

import nodemailer from "nodemailer";

let cachedTransporter = null;

function smtpConfig() {
  return {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || "",
  };
}

export function isMailerConfigured() {
  const c = smtpConfig();
  return Boolean(c.host && c.user && c.pass && c.from);
}

export function getTransporter() {
  if (!isMailerConfigured()) {
    throw new Error("SMTP no configurado. Revisa SMTP_HOST/PORT/USER/PASS y EMAIL_FROM.");
  }
  if (cachedTransporter) return cachedTransporter;
  const c = smtpConfig();
  cachedTransporter = nodemailer.createTransport({
    host: c.host,
    port: c.port,
    secure: c.port === 465, // 465=TLS implícito, 587=STARTTLS
    auth: { user: c.user, pass: c.pass },
  });
  return cachedTransporter;
}

function fromHeader() {
  const c = smtpConfig();
  const name = process.env.EMAIL_FROM_NAME || "Radio La Frontera — Extractos";
  return `"${name}" <${c.from}>`;
}

function adminRecipients() {
  const raw = process.env.ADMIN_NOTIFICATION_EMAILS || "administracion@araucanayfrontera.cl";
  return raw.split(",").map((s) => s.trim()).filter(Boolean);
}

/**
 * Envía un email. Devuelve { ok: boolean, messageId?: string, error?: string }.
 * Nunca lanza — captura errores para no romper la creación de órdenes si SMTP falla.
 */
export async function sendEmail({ to, subject, html, text, replyTo, cc }) {
  if (!isMailerConfigured()) {
    return { ok: false, error: "mailer_not_configured" };
  }
  try {
    const t = getTransporter();
    const c = smtpConfig();
    const info = await t.sendMail({
      from: fromHeader(),
      to: Array.isArray(to) ? to.join(", ") : to,
      cc: cc ? (Array.isArray(cc) ? cc.join(", ") : cc) : undefined,
      replyTo: replyTo || c.from,
      subject,
      html,
      text,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mailer] sendMail error:", err?.message || err);
    return { ok: false, error: err?.message || String(err) };
  }
}

export { adminRecipients };
