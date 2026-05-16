// POST: el sitio /contacto manda consultas con un selector de tema. Acá
// rutéamos al destinatario correcto según el tema elegido por el cliente.
// FROM: avisos@araucanayfrontera.cl (mismo dominio verificado en Resend).

import { sendEmail, isMailerConfigured } from "../extractos/_lib/mailer.js";

export const config = { runtime: "nodejs" };

const MAX_BODY_LEN = 10_000;

// Tabla de ruteo: tema → { to, cc, displayName }
// Override sin redeploy con env CONTACTO_RUTEO_JSON (objeto JSON).
const RUTEO_DEFAULT = {
  publicidad: {
    to: ["avisos@araucanayfrontera.cl"],
    cc: ["administracion@araucanayfrontera.cl"],
    fromName: "Radio Araucana — Publicidad",
  },
  extractos: {
    to: ["extractos@araucanayfrontera.cl"],
    cc: ["administracion@araucanayfrontera.cl"],
    fromName: "Radio La Frontera — Extractos",
  },
  prensa: {
    // Por ahora va al cajón general. Cuando definan email dedicado de prensa,
    // se cambia acá (o vía env CONTACTO_RUTEO_JSON sin redeploy).
    to: ["contacto@araucanayfrontera.cl"],
    cc: [],
    fromName: "Radio Araucana — Prensa",
  },
  general: {
    to: ["administracion@araucanayfrontera.cl"],
    cc: [],
    fromName: "Radio Araucana — Consulta",
  },
};

function getRuteo() {
  if (process.env.CONTACTO_RUTEO_JSON) {
    try {
      const parsed = JSON.parse(process.env.CONTACTO_RUTEO_JSON);
      if (parsed && typeof parsed === "object") return { ...RUTEO_DEFAULT, ...parsed };
    } catch (err) {
      console.warn("[/api/contacto/submit] CONTACTO_RUTEO_JSON inválido, uso defaults:", err?.message);
    }
  }
  return RUTEO_DEFAULT;
}

function getFromEmail() {
  // Usamos el FROM del cotizador como default (avisos@). Override con env propio.
  return (process.env.CONTACTO_EMAIL_FROM || process.env.COTIZA_EMAIL_FROM || "avisos@araucanayfrontera.cl").trim();
}

function esEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function clean(s, max = 200) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function renderHtml({ cliente, mensaje, temaTitulo, fecha }) {
  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <p style="font-size:11px;font-weight:700;color:#29623a;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px;">Radio Araucana · Contacto</p>
    <h1 style="margin:0 0 8px;font-size:22px;">Nueva consulta · ${escapeHtml(temaTitulo)}</h1>
    <p style="margin:0 0 24px;font-size:12px;color:#999;">${fecha}</p>

    <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:24px;">
      <tr><td style="padding:4px 0;color:#666;width:110px;">Nombre</td><td><strong>${escapeHtml(cliente.nombre)}</strong></td></tr>
      ${cliente.empresa ? `<tr><td style="padding:4px 0;color:#666;">Empresa</td><td>${escapeHtml(cliente.empresa)}</td></tr>` : ""}
      ${cliente.telefono ? `<tr><td style="padding:4px 0;color:#666;">Teléfono</td><td><a href="https://wa.me/${encodeURIComponent(cliente.telefono.replace(/\D/g, ""))}" style="color:#29623a;text-decoration:none;">${escapeHtml(cliente.telefono)} (WhatsApp)</a></td></tr>` : ""}
      <tr><td style="padding:4px 0;color:#666;">Email</td><td><a href="mailto:${encodeURIComponent(cliente.email)}" style="color:#29623a;text-decoration:none;">${escapeHtml(cliente.email)}</a></td></tr>
    </table>

    <div style="padding:16px;background:#fafafa;border-left:3px solid #29623a;font-size:14px;color:#333;line-height:1.6;white-space:pre-wrap;">${escapeHtml(mensaje)}</div>

    <p style="margin-top:24px;font-size:11px;color:#999;">
      Generado desde radioaraucana.cl/contacto. Responde a este correo para contactar a ${escapeHtml(cliente.nombre)} directamente.
    </p>
  </div>
</body></html>`;
}

function renderText({ cliente, mensaje, temaTitulo, fecha }) {
  const out = [];
  out.push(`NUEVA CONSULTA — ${temaTitulo.toUpperCase()}`);
  out.push("=".repeat(50));
  out.push(`Fecha: ${fecha}`);
  out.push("");
  out.push("CLIENTE:");
  out.push(`  Nombre: ${cliente.nombre}`);
  if (cliente.empresa) out.push(`  Empresa: ${cliente.empresa}`);
  if (cliente.telefono) out.push(`  Teléfono: ${cliente.telefono}`);
  out.push(`  Email: ${cliente.email}`);
  out.push("");
  out.push("MENSAJE:");
  out.push(mensaje);
  out.push("");
  out.push("Generado desde radioaraucana.cl/contacto");
  return out.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (JSON.stringify(req.body || {}).length > MAX_BODY_LEN) {
    return res.status(413).json({ error: "Body too large" });
  }

  const b = req.body || {};
  const ruteo = getRuteo();

  const tema = clean(b.tema, 40);
  const config = ruteo[tema];
  if (!config) return res.status(400).json({ error: "Tema inválido", validos: Object.keys(ruteo) });

  const cliente = {
    nombre: clean(b.cliente?.nombre, 200),
    empresa: clean(b.cliente?.empresa, 200),
    telefono: clean(b.cliente?.telefono, 80),
    email: clean(b.cliente?.email, 200),
  };
  if (cliente.nombre.length < 2) return res.status(400).json({ error: "Nombre requerido" });
  if (!esEmail(cliente.email)) return res.status(400).json({ error: "Email inválido" });

  const mensaje = clean(b.mensaje, 5000);
  if (mensaje.length < 5) return res.status(400).json({ error: "Mensaje muy corto" });

  const temaTitulo = clean(b.temaTitulo, 60) || tema;
  const fecha = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "mailer_not_configured",
      message: "El sistema de email no está disponible. Escríbenos directo a contacto@araucanayfrontera.cl o por WhatsApp al +56 9 9287 2087.",
    });
  }

  const subject = `Contacto — ${temaTitulo} — ${cliente.empresa || cliente.nombre}`;
  const html = renderHtml({ cliente, mensaje, temaTitulo, fecha });
  const text = renderText({ cliente, mensaje, temaTitulo, fecha });

  const result = await sendEmail({
    to: config.to,
    cc: config.cc?.length ? config.cc : undefined,
    subject, html, text,
    replyTo: cliente.email,
    fromName: config.fromName,
    fromEmail: getFromEmail(),
  });

  if (!result.ok) {
    console.error("[/api/contacto/submit] envío falló:", result.error);
    return res.status(502).json({ error: "send_failed", detail: result.error });
  }
  return res.status(200).json({ ok: true });
}
