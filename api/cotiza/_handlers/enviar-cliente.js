// POST: el equipo comercial envía una cotización armada en /cotiza/admin
// directo al email del cliente. Soporta Opción A + Opción B (propuesta_b
// opcional). Auth requiere ADMIN_PASSWORD.

import { sendEmail, isMailerConfigured } from "../../extractos/_lib/mailer.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { consumirCupon } from "../_lib/tarifas-store.js";
import { authOk } from "../_lib/auth.js";
import { cotizaTo, cotizaCc, cotizaFromEmail } from "../_lib/recipients.js";

export const config = { runtime: "nodejs" };

const MAX_BODY_LEN = 30_000;

function esEmail(v) {
  return typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}
function clean(s, max = 200) {
  return typeof s === "string" ? s.trim().slice(0, max) : "";
}
function fmtCLP(n) {
  return "$" + Math.round(Number(n) || 0).toLocaleString("es-CL");
}
function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validar(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return "Body inválido";
  const c = body.cliente || {};
  if (!esEmail(c.email)) return "Email del cliente requerido y debe ser válido";
  // Aceptamos formato nuevo (propuesta_a) o legacy (lineas/total plano)
  const propA = body.propuesta_a || body;
  if (!Array.isArray(propA.lineas) || propA.lineas.length === 0) return "Debe haber al menos una línea";
  if (typeof propA.total !== "number" || propA.total <= 0) return "Total inválido";
  return null;
}

function renderPropuestaBloque({ titulo, propuesta, iva }) {
  const rows = propuesta.lineas.map((l) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;">${escapeHtml(l.detalle)}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums;font-size:14px;"><strong>${fmtCLP(l.subtotal)}</strong></td>
    </tr>`).join("");

  const descuentos = [];
  if (propuesta.descPyme) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">${escapeHtml(propuesta.descPyme.label)} (-${propuesta.descPyme.porcentaje}%)</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(propuesta.descPyme.monto)}</td></tr>`);
  if (propuesta.descAgencia) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">Precio Agencia · ${escapeHtml(propuesta.descAgencia.label)} (-${propuesta.descAgencia.porcentaje}%)</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(propuesta.descAgencia.monto)}</td></tr>`);
  if (propuesta.cupon) descuentos.push(`<tr><td style="padding:6px 14px;font-size:13px;color:#29623a;">Cupón ${escapeHtml(propuesta.cupon.codigo)}${propuesta.cupon.descripcion ? " · " + escapeHtml(propuesta.cupon.descripcion) : ""}</td><td style="padding:6px 14px;text-align:right;color:#29623a;font-variant-numeric:tabular-nums;font-size:13px;">-${fmtCLP(propuesta.cupon.monto)}</td></tr>`);

  const tituloBloque = titulo
    ? `<div style="background:#29623a;color:#fff;padding:10px 14px;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;border-radius:6px 6px 0 0;">${escapeHtml(titulo)}</div>`
    : "";

  const comentariosBloque = propuesta.comentarios
    ? `<div style="margin-top:12px;padding:12px 14px;background:#fafafa;border-left:3px solid #29623a;font-size:13px;color:#444;line-height:1.5;">${escapeHtml(propuesta.comentarios).replace(/\n/g, "<br/>")}</div>`
    : "";

  return `<div style="margin-bottom:28px;">
    ${tituloBloque}
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;${titulo ? "border-top:none;" : "border-radius:6px;"}overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Detalle</th>
          <th style="padding:10px 14px;text-align:right;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Valor</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr><td style="padding:10px 14px;font-size:13px;color:#666;border-top:1px solid #ddd;">Subtotal</td>
            <td style="padding:10px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;border-top:1px solid #ddd;">${fmtCLP(propuesta.subtotal)}</td></tr>
        ${descuentos.join("")}
        <tr><td style="padding:6px 14px;font-size:13px;color:#666;">IVA (${Math.round((iva || 0.19) * 100)}%)</td>
            <td style="padding:6px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:13px;">${fmtCLP(propuesta.iva)}</td></tr>
        <tr><td style="padding:16px 14px;font-size:16px;font-weight:700;border-top:2px solid #191919;">TOTAL con IVA</td>
            <td style="padding:16px 14px;text-align:right;font-variant-numeric:tabular-nums;font-size:22px;font-weight:700;color:#29623a;border-top:2px solid #191919;">${fmtCLP(propuesta.total)}</td></tr>
      </tbody>
    </table>
    ${comentariosBloque}
  </div>`;
}

function renderHtml({ cliente, propuestaA, propuestaB, fecha, iva }) {
  const tieneB = Boolean(propuestaB);
  const introOpciones = tieneB
    ? `<div style="background:rgba(82,184,112,0.08);border-radius:6px;padding:14px;margin-bottom:24px;font-size:13px;color:#1d4a2b;line-height:1.55;">
        <strong>Te enviamos dos opciones</strong> para que elijas la que mejor se ajuste a tu campaña.
        Cualquier duda, respondé este correo y conversamos.
      </div>`
    : "";

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;padding:36px;">
    <div style="border-bottom:2px solid #29623a;padding-bottom:16px;margin-bottom:24px;">
      <p style="font-size:11px;font-weight:700;color:#29623a;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 4px;">Radio Araucana 95.9 FM</p>
      <p style="font-size:12px;color:#666;margin:0;">Temuco · La Araucanía · Desde 1960</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:22px;color:#191919;">Cotización publicidad</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#666;">${fecha}</p>

    ${cliente.nombre || cliente.empresa ? `<p style="margin:0 0 24px;font-size:14px;color:#444;">
      Para: <strong>${escapeHtml(cliente.nombre || "")}${cliente.empresa ? " · " + escapeHtml(cliente.empresa) : ""}</strong>
    </p>` : ""}

    ${introOpciones}

    ${renderPropuestaBloque({ titulo: tieneB ? "Opción A" : null, propuesta: propuestaA, iva })}
    ${tieneB ? renderPropuestaBloque({ titulo: "Opción B", propuesta: propuestaB, iva }) : ""}

    <p style="margin-top:24px;font-size:13px;color:#444;line-height:1.6;">
      Cotización referencial, vigente por <strong>14 días</strong> desde la fecha de emisión.
      Los valores están sujetos a corrección por errores involuntarios; en caso de discrepancia,
      prevalecen las tarifas vigentes al cerrar el contrato. La programación definitiva se
      confirma con el acuerdo final. Cualquier duda, escríbenos.
    </p>

    <div style="margin-top:32px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#666;line-height:1.7;">
      <strong style="color:#29623a;">Radio Araucana FM 95.9 — Temuco</strong><br/>
      Caupolicán 110, Of. 2003 · Temuco · La Araucanía<br/>
      <a href="mailto:cotizaciones@araucanayfrontera.cl" style="color:#29623a;">cotizaciones@araucanayfrontera.cl</a> · +56 9 9287 2087<br/>
      <a href="https://radioaraucana.cl" style="color:#29623a;">radioaraucana.cl</a>
    </div>
  </div>
</body></html>`;
}

function renderPropuestaTexto({ titulo, propuesta, iva }) {
  const out = [];
  if (titulo) {
    out.push("");
    out.push(`─── ${titulo.toUpperCase()} ───`);
  }
  out.push("");
  out.push("DETALLE:");
  propuesta.lineas.forEach((l) => out.push(`  • ${l.detalle} — ${fmtCLP(l.subtotal)}`));
  out.push("");
  out.push(`Subtotal:             ${fmtCLP(propuesta.subtotal)}`);
  if (propuesta.descPyme) out.push(`${propuesta.descPyme.label} (-${propuesta.descPyme.porcentaje}%): -${fmtCLP(propuesta.descPyme.monto)}`);
  if (propuesta.descAgencia) out.push(`Precio Agencia · ${propuesta.descAgencia.label} (-${propuesta.descAgencia.porcentaje}%): -${fmtCLP(propuesta.descAgencia.monto)}`);
  if (propuesta.cupon) out.push(`Cupón ${propuesta.cupon.codigo}: -${fmtCLP(propuesta.cupon.monto)}`);
  out.push(`IVA (${Math.round((iva || 0.19) * 100)}%):           ${fmtCLP(propuesta.iva)}`);
  out.push("");
  out.push(`TOTAL CON IVA:        ${fmtCLP(propuesta.total)}`);
  if (propuesta.comentarios) {
    out.push("");
    out.push("Notas:");
    out.push(propuesta.comentarios);
  }
  return out;
}

function renderText({ cliente, propuestaA, propuestaB, fecha, iva }) {
  const out = [];
  out.push("RADIO ARAUCANA 95.9 FM — COTIZACIÓN PUBLICIDAD");
  out.push("=".repeat(50));
  out.push(`Fecha: ${fecha}`);
  if (cliente.nombre || cliente.empresa) {
    out.push(`Para: ${cliente.nombre || ""}${cliente.empresa ? " · " + cliente.empresa : ""}`);
  }
  if (propuestaB) {
    out.push("");
    out.push("Te enviamos dos opciones para que elijas la que mejor se ajuste.");
  }
  out.push(...renderPropuestaTexto({ titulo: propuestaB ? "Opción A" : null, propuesta: propuestaA, iva }));
  if (propuestaB) {
    out.push(...renderPropuestaTexto({ titulo: "Opción B", propuesta: propuestaB, iva }));
  }
  out.push("");
  out.push("Cotización referencial, vigente por 14 días desde la fecha de emisión.");
  out.push("Los valores están sujetos a corrección por errores involuntarios; en caso de");
  out.push("discrepancia, prevalecen las tarifas vigentes al cerrar el contrato.");
  out.push("Radio Araucana FM 95.9 · cotizaciones@araucanayfrontera.cl · +56 9 9287 2087");
  return out.join("\n");
}

function parsePropuesta(body) {
  return {
    lineas: (body.lineas || []).map((l) => ({ detalle: clean(l.detalle, 300), subtotal: Number(l.subtotal) || 0 })),
    subtotal: Number(body.subtotal) || 0,
    iva: Number(body.iva) || 0,
    total: Number(body.total) || 0,
    descPyme: body.descPyme && body.descPyme.monto ? {
      label: clean(body.descPyme.label, 60),
      porcentaje: Number(body.descPyme.porcentaje) || 0,
      monto: Number(body.descPyme.monto) || 0,
    } : null,
    descAgencia: body.descAgencia && body.descAgencia.monto ? {
      label: clean(body.descAgencia.label, 60),
      porcentaje: Number(body.descAgencia.porcentaje) || 0,
      monto: Number(body.descAgencia.monto) || 0,
    } : null,
    cupon: body.cupon && body.cupon.monto ? {
      codigo: clean(body.cupon.codigo, 40),
      descripcion: clean(body.cupon.descripcion, 200),
      monto: Number(body.cupon.monto) || 0,
    } : null,
    comentarios: clean(body.comentarios, 2000),
    descuento_pyme: Number(body.descuento_pyme) || 0,
    descuento_agencia: Number(body.descuento_agencia) || 0,
    descuento_cupon: Number(body.descuento_cupon) || 0,
    pyme_aplicado: Boolean(body.pyme_aplicado),
    agencia_tramo: clean(body.agencia_tramo, 80) || null,
    cupon_codigo: clean(body.cupon_codigo, 40) || null,
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!(await authOk(req))) return res.status(401).json({ error: "Unauthorized" });

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

  const propuestaA = parsePropuesta(req.body.propuesta_a || req.body);
  const propuestaB = req.body.propuesta_b ? parsePropuesta(req.body.propuesta_b) : null;
  const fecha = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });

  if (!isMailerConfigured()) {
    return res.status(503).json({
      error: "mailer_not_configured",
      message: "El sistema de email no está configurado. Pide a Jerónimo configurar las envs SMTP_*.",
    });
  }

  // Consumir cupón de propuesta A (si aplica). Si la B tiene cupón distinto,
  // también lo consumimos. Si comparten cupón, lo consumimos una sola vez.
  const cuponesAConsumir = new Set();
  if (propuestaA.cupon?.codigo) cuponesAConsumir.add(propuestaA.cupon.codigo);
  if (propuestaB?.cupon?.codigo) cuponesAConsumir.add(propuestaB.cupon.codigo);
  for (const codigo of cuponesAConsumir) {
    const consumo = await consumirCupon(codigo);
    if (!consumo.ok) {
      return res.status(409).json({
        error: "cupon_no_disponible",
        message: `No se puede usar el cupón ${codigo}: ${consumo.motivo}. Quita el cupón y vuelve a intentar.`,
      });
    }
  }

  const subject = `Cotización publicidad Radio Araucana 95.9 FM${cliente.empresa ? " — " + cliente.empresa : ""}${propuestaB ? " (Opción A + B)" : ""}`.replace(/[\r\n]+/g, " ");
  // Tasa de IVA = monto / subtotal. body.iva es el MONTO (no la tasa), por eso
  // no se usa para esto — usarlo directo daba el famoso "IVA (12825000%)".
  const iva = propuestaA.subtotal > 0
    ? propuestaA.iva / propuestaA.subtotal
    : 0.19;
  const html = renderHtml({ cliente, propuestaA, propuestaB, fecha, iva });
  const text = renderText({ cliente, propuestaA, propuestaB, fecha, iva });

  const result = await sendEmail({
    to: cliente.email,
    cc: [...cotizaTo(), ...cotizaCc()],
    subject, html, text,
    replyTo: undefined,
    fromName: "Radio Araucana 95.9 FM — Publicidad",
    fromEmail: cotizaFromEmail(),
  });

  if (!result.ok) {
    console.error("[/api/cotiza/enviar-cliente] envío falló:", result.error);
    return res.status(502).json({ error: "send_failed" });
  }

  // Persistir cotización en Supabase
  let cotizacionGuardada = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const propuestaBJson = propuestaB ? {
        lineas: propuestaB.lineas,
        subtotal: propuestaB.subtotal,
        descuento_pyme: propuestaB.descuento_pyme,
        descuento_agencia: propuestaB.descuento_agencia,
        descuento_cupon: propuestaB.descuento_cupon,
        iva: propuestaB.iva,
        total: propuestaB.total,
        pyme_aplicado: propuestaB.pyme_aplicado,
        agencia_tramo: propuestaB.agencia_tramo,
        cupon_codigo: propuestaB.cupon_codigo,
        comentarios: propuestaB.comentarios || null,
      } : null;

      const { data, error } = await supabase
        .from("cotiza_cotizaciones")
        .insert({
          solicitud_id: req.body.solicitudId || req.body.solicitud_id || null,
          cliente_nombre: cliente.nombre || "Cliente",
          cliente_empresa: cliente.empresa || null,
          cliente_telefono: cliente.telefono || null,
          cliente_email: cliente.email || null,
          lineas: propuestaA.lineas,
          comentarios: propuestaA.comentarios || null,
          subtotal: propuestaA.subtotal,
          descuento_pyme: propuestaA.descuento_pyme,
          descuento_agencia: propuestaA.descuento_agencia,
          descuento_cupon: propuestaA.descuento_cupon,
          iva: propuestaA.iva,
          total: propuestaA.total,
          pyme_aplicado: propuestaA.pyme_aplicado,
          agencia_tramo: propuestaA.agencia_tramo,
          cupon_codigo: propuestaA.cupon_codigo,
          estado: "enviada",
          enviada_via: "email",
          enviada_a: cliente.email,
          propuesta_b: propuestaBJson,
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
