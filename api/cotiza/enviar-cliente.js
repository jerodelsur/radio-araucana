// POST: el equipo comercial envía una cotización armada en /cotiza/interno
// directo al email del cliente. Auth requiere ADMIN_PASSWORD (es interno).
// El cliente recibe la propuesta con membrete de Radio Araucana.

import { sendEmail, isMailerConfigured } from "../extractos/_lib/mailer.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../extractos/_lib/supabase.js";
import { consumirCupon } from "./_lib/tarifas-store.js";
import { authOk } from "./_lib/auth.js";
import { cotizaTo, cotizaCc } from "./_lib/recipients.js";

export const config = { runtime: "nodejs" };

const MAX_BODY_LEN = 20_000;

function esEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

function clean(s, max = 200) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}

function fmtCLP(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
}

function validar(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body inválido";
  const c = body.cliente || {};
  if (!esEmail(c.email)) return "Email del cliente requerido y debe ser válido";
  if (!Array.isArray(body.lineas) || body.lineas.length === 0) return "Debe haber al menos una línea";
  if (typeof body.total !== "number" || body.total <= 0) return "Total inválido";
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

function renderHtml({ cliente, lineas, descPyme, descAgencia, cupon, totales, comentarios, fecha, iva }) {
  const rows = lineas.map((l) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;">${escapeHtml(l.detalle)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums;font-size:14px;"><strong>${fmtCLP(l.subtotal)}</strong></td>
    </tr>`).join("");

  const descuentos = [];
  if (descPyme) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">${escapeHtml(descPyme.label)} (-${descPyme.porcentaje}%)</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(descPyme.monto)}</td></tr>`);
  if (descAgencia) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">Precio Agencia · ${escapeHtml(descAgencia.label)} (-${descAgencia.porcentaje}%)</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(descAgencia.monto)}</td></tr>`);
  if (cupon) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">Cupón ${escapeHtml(cupon.codigo)}${cupon.descripcion ? " · " + escapeHtml(cupon.descripcion) : ""}</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(cupon.monto)}</td></tr>`);

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:36px;">
    <div style="border-bottom:2px solid #29623a;padding-bottom:16px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;color:#29623a;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px;">Radio Araucana 95.9 FM</p>
      <p style="font-size:12px;color:#666;margin:0;">Temuco · La Araucanía · Desde 1960</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:22px;color:#191919;">Cotización publicidad</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#666;">${fecha}</p>

    ${cliente.nombre || cliente.empresa ? `<p style="margin:0 0 24px;font-size:14px;color:#444;">
      Para: <strong>${escapeHtml(cliente.nombre || "")}${cliente.empresa ? " · " + escapeHtml(cliente.empresa) : ""}</strong>
    </p>` : ""}

    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Detalle</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr><td style="padding:10px 14px;font-size:13px;color:#666;border-top:1px solid #ddd;">Subtotal</td>
            <td style="padding:10px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;border-top:1px solid #ddd;">${fmtCLP(totales.subtotal)}</td></tr>
        ${descuentos.join("")}
        <tr><td style="padding:6px 14px;font-size:13px;color:#666;">IVA (${Math.round((iva || 0.19) * 100)}%)</td>
            <td style="padding:6px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;">${fmtCLP(totales.iva)}</td></tr>
        <tr><td style="padding:16px 14px;font-size:16px;font-weight:700;border-top:2px solid #191919;">TOTAL con IVA</td>
            <td style="padding:16px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:22px;font-weight:700;color:#29623a;border-top:2px solid #191919;">${fmtCLP(totales.total)}</td></tr>
      </tbody>
    </table>

    ${comentarios ? `<div style="margin-top:24px;padding:14px;background:#fafafa;border-left:3px solid #29623a;font-size:13px;color:#444;line-height:1.5;">${escapeHtml(comentarios).replace(/\n/g, "<br/>")}</div>` : ""}

    <p style="margin-top:32px;font-size:13px;color:#444;line-height:1.6;">
      Esta cotización es referencial y válida por 30 días. La programación final se confirma al cerrar el contrato.
      Cualquier duda quedamos atentos.
    </p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.7;">
      <strong style="color:#29623a;">Radio Araucana FM 95.9 — Temuco</strong><br/>
      Caupolicán 110, Of. 2003 · Temuco · La Araucanía<br/>
      <a href="mailto:administracion@araucanayfrontera.cl" style="color:#29623a;">administracion@araucanayfrontera.cl</a> · +56 9 9287 2087<br/>
      <a href="https://radioaraucana.cl" style="color:#29623a;">radioaraucana.cl</a>
    </div>
  </div>
</body></html>`;
}

function renderText({ cliente, lineas, descPyme, descAgencia, cupon, totales, comentarios, fecha, iva }) {
  const out = [];
  out.push("RADIO ARAUCANA 95.9 FM — COTIZACIÓN PUBLICIDAD");
  out.push("=".repeat(50));
  out.push(`Fecha: ${fecha}`);
  if (cliente.nombre || cliente.empresa) {
    out.push(`Para: ${cliente.nombre || ""}${cliente.empresa ? " · " + cliente.empresa : ""}`);
  }
  out.push("");
  out.push("DETALLE:");
  lineas.forEach((l) => out.push(`  • ${l.detalle} — ${fmtCLP(l.subtotal)}`));
  out.push("");
  out.push(`Subtotal:             ${fmtCLP(totales.subtotal)}`);
  if (descPyme) out.push(`${descPyme.label} (-${descPyme.porcentaje}%): -${fmtCLP(descPyme.monto)}`);
  if (descAgencia) out.push(`Precio Agencia · ${descAgencia.label} (-${descAgencia.porcentaje}%): -${fmtCLP(descAgencia.monto)}`);
  if (cupon) out.push(`Cupón ${cupon.codigo}: -${fmtCLP(cupon.monto)}`);
  out.push(`IVA (${Math.round((iva || 0.19) * 100)}%):           ${fmtCLP(totales.iva)}`);
  out.push("");
  out.push(`TOTAL CON IVA:        ${fmtCLP(totales.total)}`);
  if (comentarios) {
    out.push("");
    out.push("NOTAS:");
    out.push(comentarios);
  }
  out.push("");
  out.push("Cotización referencial, vigencia 30 días.");
  out.push("Radio Araucana FM 95.9 · administracion@araucanayfrontera.cl · +56 9 9287 2087");
  return out.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!authOk(req)) return res.status(401).json({ error: "Unauthorized" });

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
  const lineas = req.body.lineas.map((l) => ({
    detalle: clean(l.detalle, 300),
    subtotal: Number(l.subtotal) || 0,
  }));
  const totales = {
    subtotal: Number(req.body.subtotal) || 0,
    iva: Number(req.body.iva) || 0,
    total: Number(req.body.total) || 0,
  };
  const comentarios = clean(req.body.comentarios, 2000);
  const descPyme = req.body.descPyme && req.body.descPyme.monto ? {
    label: clean(req.body.descPyme.label, 60),
    porcentaje: Number(req.body.descPyme.porcentaje) || 0,
    monto: Number(req.body.descPyme.monto) || 0,
  } : null;
  const descAgencia = req.body.descAgencia && req.body.descAgencia.monto ? {
    label: clean(req.body.descAgencia.label, 60),
    porcentaje: Number(req.body.descAgencia.porcentaje) || 0,
    monto: Number(req.body.descAgencia.monto) || 0,
  } : null;
  const cupon = req.body.cupon && req.body.cupon.monto ? {
    codigo: clean(req.body.cupon.codigo, 40),
    descripcion: clean(req.body.cupon.descripcion, 200),
    monto: Number(req.body.cupon.monto) || 0,
  } : null;
  const fecha = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "mailer_not_configured",
      message: "El sistema de email no está configurado. Pide a Jerónimo configurar las envs SMTP_*.",
    });
  }

  // Si la cotización trae cupón, consumirlo antes de enviar. Valida que sigue
  // disponible (no expirado, no agotado) y persiste el incremento de uso.
  if (cupon && cupon.codigo) {
    const consumo = await consumirCupon(cupon.codigo);
    if (!consumo.ok) {
      return res.status(409).json({
        error: "cupon_no_disponible",
        message: `No se puede usar el cupón ${cupon.codigo}: ${consumo.motivo}. Quita el cupón y vuelve a intentar.`,
      });
    }
  }

  const subject = `Cotización publicidad Radio Araucana 95.9 FM${cliente.empresa ? " — " + cliente.empresa : ""}`;
  const html = renderHtml({ cliente, lineas, descPyme, descAgencia, cupon, totales, comentarios, fecha, iva: req.body.iva });
  const text = renderText({ cliente, lineas, descPyme, descAgencia, cupon, totales, comentarios, fecha, iva: req.body.iva });

  const result = await sendEmail({
    to: cliente.email,
    cc: [...cotizaTo(), ...cotizaCc()],
    subject,
    html,
    text,
    replyTo: undefined, // Que las respuestas vuelvan al EMAIL_FROM por defecto
    fromName: "Radio Araucana 95.9 FM — Publicidad",
  });

  if (!result.ok) {
    console.error("[/api/cotiza/enviar-cliente] envío falló:", result.error);
    return res.status(502).json({ error: "send_failed", detail: result.error });
  }

  // Persistir la cotización para historial. Si la BD falla, no rompemos
  // el flujo — el email ya salió y el cliente lo recibió.
  let cotizacionGuardada = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("cotiza_cotizaciones")
        .insert({
          solicitud_id: req.body.solicitudId || null,
          cliente_nombre: cliente.nombre || "Cliente",
          cliente_empresa: cliente.empresa || null,
          cliente_telefono: cliente.telefono || null,
          cliente_email: cliente.email || null,
          lineas: lineas.map((l) => ({ detalle: l.detalle, subtotal: l.subtotal })),
          comentarios: comentarios || null,
          subtotal: totales.subtotal,
          descuento_pyme: descPyme?.monto || 0,
          descuento_agencia: descAgencia?.monto || 0,
          descuento_cupon: cupon?.monto || 0,
          iva: totales.iva,
          total: totales.total,
          pyme_aplicado: Boolean(descPyme),
          agencia_tramo: descAgencia ? descAgencia.label : null,
          cupon_codigo: cupon ? cupon.codigo : null,
          estado: "enviada",
          enviada_via: "email",
          enviada_a: cliente.email,
        })
        .select("id, numero")
        .single();
      if (error) console.error("[/api/cotiza/enviar-cliente] insert cotización fail:", error.message);
      else cotizacionGuardada = data;
    } catch (err) {
      console.error("[/api/cotiza/enviar-cliente] supabase error:", err?.message ?? err);
    }
  }

  return res.status(200).json({ ok: true, messageId: result.messageId, cotizacion: cotizacionGuardada });
}
