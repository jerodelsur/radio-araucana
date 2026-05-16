// POST: el visitante público de /cotiza solicita una cotización. NO incluye
// precios (que quedan ocultos por estrategia comercial). El equipo recibe el
// pedido del cliente por email y arma la cotización formal desde /cotiza/interno.

import { sendEmail, isMailerConfigured } from "../../extractos/_lib/mailer.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { cotizaTo, cotizaCc, cotizaFromEmail } from "../_lib/recipients.js";

export const config = { runtime: "nodejs" };

const MAX_BODY_LEN = 8_000;

function esEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function clean(s, max = 200) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

function validar(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body inválido";
  const c = body.cliente || {};
  if (!clean(c.nombre)) return "Nombre requerido";
  if (!clean(c.telefono) && !esEmail(c.email)) return "Necesitamos teléfono o email válido";
  if (c.email && !esEmail(c.email)) return "Email inválido";
  if (!Array.isArray(body.pedido) || body.pedido.length === 0) return "Debe haber al menos un formato seleccionado";
  return null;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderHtml({ cliente, pedido, comentarios, fecha }) {
  const filas = pedido.map((p) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;width:40%;"><strong>${escapeHtml(p.titulo)}</strong><br/><span style="font-size:12px;color:#999;">${escapeHtml(p.duracion)}</span></td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#444;">${escapeHtml(p.necesidad) || "<em style='color:#999'>sin detalle</em>"}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <p style="font-size:11px;font-weight:700;color:#29623a;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;">Radio Araucana · Solicitud de cotización</p>
    <h1 style="margin:0 0 8px;font-size:22px;">Nueva solicitud del público</h1>
    <p style="margin:0 0 24px;font-size:12px;color:#999;">${fecha}</p>

    <h2 style="margin:24px 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Cliente</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 0;color:#666;width:120px;">Nombre</td><td><strong>${escapeHtml(cliente.nombre)}</strong></td></tr>
      ${cliente.empresa ? `<tr><td style="padding:4px 0;color:#666;">Empresa</td><td>${escapeHtml(cliente.empresa)}</td></tr>` : ""}
      ${cliente.telefono ? `<tr><td style="padding:4px 0;color:#666;">Teléfono</td><td><a href="https://wa.me/${encodeURIComponent(cliente.telefono.replace(/\D/g, ""))}" style="color:#29623a;text-decoration:none;">${escapeHtml(cliente.telefono)} (WhatsApp)</a></td></tr>` : ""}
      ${cliente.email ? `<tr><td style="padding:4px 0;color:#666;">Email</td><td><a href="mailto:${encodeURIComponent(cliente.email)}" style="color:#29623a;text-decoration:none;">${escapeHtml(cliente.email)}</a></td></tr>` : ""}
    </table>

    <h2 style="margin:32px 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Le interesan estos formatos</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Formato</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Qué necesita</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    ${comentarios ? `<div style="margin-top:24px;padding:14px;background:#fafafa;border-left:3px solid #29623a;font-size:13px;color:#444;line-height:1.5;"><strong>Comentarios:</strong><br/>${escapeHtml(comentarios).replace(/\n/g, "<br/>")}</div>` : ""}

    <div style="margin-top:28px;padding:14px;background:rgba(82,184,112,0.08);border-radius:6px;font-size:13px;color:#29623a;line-height:1.5;">
      <strong>Siguiente paso:</strong> arma la cotización formal en
      <a href="https://radioaraucana.cl/cotiza/interno" style="color:#29623a;">radioaraucana.cl/cotiza/interno</a>
      y envíasela al cliente.
    </div>

    <p style="margin-top:24px;font-size:11px;color:#999;">Generado desde radioaraucana.cl/cotiza</p>
  </div>
</body></html>`;
}

function renderText({ cliente, pedido, comentarios, fecha }) {
  const out = [];
  out.push("NUEVA SOLICITUD — COTIZACIÓN PUBLICIDAD RADIO ARAUCANA");
  out.push("=".repeat(50));
  out.push(`Fecha: ${fecha}`);
  out.push("");
  out.push("CLIENTE:");
  out.push(`  Nombre: ${cliente.nombre}`);
  if (cliente.empresa) out.push(`  Empresa: ${cliente.empresa}`);
  if (cliente.telefono) out.push(`  Teléfono: ${cliente.telefono}`);
  if (cliente.email) out.push(`  Email: ${cliente.email}`);
  out.push("");
  out.push("FORMATOS DE INTERÉS:");
  pedido.forEach((p) => {
    out.push(`  • ${p.titulo} (${p.duracion})`);
    if (p.necesidad) out.push(`      → ${p.necesidad}`);
  });
  if (comentarios) {
    out.push("");
    out.push("COMENTARIOS:");
    out.push(comentarios);
  }
  out.push("");
  out.push("→ Arma cotización formal en radioaraucana.cl/cotiza/interno");
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

  const errorMsg = validar(req.body);
  if (errorMsg) return res.status(400).json({ error: errorMsg });

  const cliente = {
    nombre: clean(req.body.cliente.nombre),
    empresa: clean(req.body.cliente.empresa),
    telefono: clean(req.body.cliente.telefono),
    email: clean(req.body.cliente.email),
  };
  const pedido = req.body.pedido.map((p) => {
    // Sanitizar el objeto de opciones (estructurado para el panel admin).
    // Keys y valores cortos, máximo 20 entradas por seguridad.
    let opciones = null;
    if (p.opciones && typeof p.opciones === "object" && !Array.isArray(p.opciones)) {
      opciones = {};
      const keys = Object.keys(p.opciones).slice(0, 20);
      for (const k of keys) {
        const key = clean(k, 40);
        const val = clean(p.opciones[k], 80);
        if (key && val) opciones[key] = val;
      }
    }
    return {
      formatoId: clean(p.formatoId, 60) || null,
      titulo: clean(p.titulo, 80),
      duracion: clean(p.duracion, 40),
      necesidad: clean(p.necesidad, 400),
      opciones,
    };
  });
  const comentarios = clean(req.body.comentarios, 2000);
  const fecha = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });

  // Persistir la solicitud en Supabase ANTES de mandar el email. Si la BD
  // falla seguimos enviando el correo igual — la información no se pierde.
  let solicitudId = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("cotiza_solicitudes")
        .insert({
          cliente_nombre: cliente.nombre,
          cliente_empresa: cliente.empresa || null,
          cliente_telefono: cliente.telefono || null,
          cliente_email: cliente.email || null,
          pedido,
          comentarios: comentarios || null,
        })
        .select("id")
        .single();
      if (error) console.error("[/api/cotiza/submit] insert fail:", error?.message);
      else solicitudId = data.id;
    } catch (err) {
      console.error("[/api/cotiza/submit] supabase error:", err?.message ?? err);
    }
  }

  if (!isMailerConfigured()) {
    console.warn("[/api/cotiza/submit] SMTP no configurado");
    return res.status(503).json({
      error: "mailer_not_configured",
      message: "El sistema de email no está disponible ahora mismo. Por favor escríbenos directamente a administracion@araucanayfrontera.cl o por WhatsApp al +56 9 9287 2087.",
    });
  }

  const subject = `Solicitud cotización — ${cliente.empresa || cliente.nombre}`;
  const html = renderHtml({ cliente, pedido, comentarios, fecha });
  const text = renderText({ cliente, pedido, comentarios, fecha });

  const result = await sendEmail({
    to: cotizaTo(),
    cc: cotizaCc(),
    subject,
    html,
    text,
    replyTo: cliente.email || undefined,
    fromName: "Radio Araucana — Solicitud Cotización",
    fromEmail: cotizaFromEmail(),
  });

  if (!result.ok) {
    console.error("[/api/cotiza/submit] envío falló:", result.error);
    return res.status(502).json({ error: "send_failed", detail: result.error });
  }
  return res.status(200).json({ ok: true, messageId: result.messageId });
}
