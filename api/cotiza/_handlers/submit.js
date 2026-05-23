// POST: el visitante público de /cotiza solicita una cotización. NO incluye
// precios calculados para su pedido (ocultos por estrategia comercial), pero
// sí enviamos al cliente un email de confirmación con ejemplos de packs base
// (educativo) y la promesa de contacto del equipo. El equipo recibe el pedido
// por email y arma la cotización formal desde /cotiza/admin.

import { sendEmail, isMailerConfigured } from "../../extractos/_lib/mailer.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "../../extractos/_lib/supabase.js";
import { leerTarifas } from "../_lib/tarifas-store.js";
import { cotizaTo, cotizaCc, cotizaFromEmail } from "../_lib/recipients.js";

export const config = { runtime: "nodejs" };

const MAX_BODY_LEN = 8_000;

const TIPOS_PROMOCION_VALIDOS = ["negocio", "servicio", "evento", "oferta", "campana", "otro"];

const TIPOS_PROMOCION_LABEL = {
  negocio: "Mi negocio o tienda local",
  servicio: "Un servicio profesional",
  evento: "Un evento puntual",
  oferta: "Una oferta o promoción específica",
  campana: "Campaña institucional, municipal o política",
  otro: "Otro",
};

// Descripciones de los 4 packs base usados como ejemplos educativos en el
// email al cliente. Se renderizan junto al precio calculado en runtime desde
// el tarifario vigente, para que si los packs cambian de precio, el email
// refleje los valores actuales sin redeploy.
const DESCRIPCIONES_PACK_BASE = {
  30: "30 frases mensuales (≈1 frase al día). Presencia liviana. Ideal para negocios ya conocidos que necesitan recordación constante sin saturar al oyente.",
  60: "60 frases mensuales (≈2 frases al día). Refuerzo medido. Buen punto de partida para sostener una marca: el oyente promedio te escucha varias veces por semana.",
  90: "90 frases mensuales (≈3 frases al día). Cobertura sólida. Recomendado para mantener una marca activa o acompañar una promoción que se extiende varias semanas.",
  120: "120 frases mensuales (≈4 frases al día). Alta exposición. Para lanzamientos, fechas comerciales fuertes (Navidad, Día del Padre), inauguraciones o campañas políticas en tramo final.",
};

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
  if (!clean(c.nombre)) return "Nombre requerido";
  if (!clean(c.empresa)) return "Empresa requerida";
  if (!clean(c.telefono) && !esEmail(c.email)) return "Necesitamos teléfono o email válido";
  if (c.email && !esEmail(c.email)) return "Email inválido";
  if (!c.tipoPromocion || !TIPOS_PROMOCION_VALIDOS.includes(c.tipoPromocion)) return "Tipo de promoción no válido";
  if (c.tipoPromocion === "otro" && !clean(c.tipoPromocionOtro)) return "Detalla qué quieres promocionar";
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

function tipoPromocionTexto(cliente) {
  if (!cliente?.tipoPromocion) return "";
  if (cliente.tipoPromocion === "otro" && cliente.tipoPromocionOtro) {
    return `Otro: ${cliente.tipoPromocionOtro}`;
  }
  return TIPOS_PROMOCION_LABEL[cliente.tipoPromocion] || cliente.tipoPromocion;
}

/**
 * Extrae los 4 packs BASE mensuales del tarifario (30, 60, 90, 120) y calcula
 * subtotal, IVA y total. Se usa para los ejemplos educativos del email al
 * cliente. Si el tarifario no tiene esa estructura, devuelve [].
 */
function ejemplosPacksBase(tarifas) {
  const ivaRate = Number(tarifas?.iva) || 0.19;
  const frase = (tarifas?.formatos || []).find((f) => f.id === "frase_comercial");
  if (!frase) return [];
  const horario = (frase.horarios || []).find((h) => h.id === "base");
  if (!horario) return [];
  const packs = (horario.packs || []).filter((p) => p.id !== "suelta");
  return packs.map((p) => {
    const subtotal = (Number(p.frases) || 0) * (Number(p.precioUnitario) || 0);
    const iva = Math.round(subtotal * ivaRate);
    const total = subtotal + iva;
    return {
      id: String(p.id),
      label: p.label,
      frases: p.frases,
      precioUnitario: p.precioUnitario,
      subtotal,
      iva,
      total,
      descripcion: DESCRIPCIONES_PACK_BASE[String(p.id)] || "",
    };
  });
}

/* ─── Email AL EQUIPO COMERCIAL ─────────────────────────────────────────── */

function renderTeamHtml({ cliente, pedido, comentarios, fecha }) {
  const filas = pedido.map((p) => `
    <tr>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:14px;width:40%;"><strong>${escapeHtml(p.titulo)}</strong><br/><span style="font-size:12px;color:#999;">${escapeHtml(p.duracion)}</span></td>
      <td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;color:#444;">${escapeHtml(p.necesidad) || "<em style='color:#999'>sin detalle</em>"}</td>
    </tr>`).join("");

  const tipoPromoLinea = tipoPromocionTexto(cliente);

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:8px;padding:32px;">
    <p style="font-size:11px;font-weight:700;color:#29623a;letter-spacing:0.14em;text-transform:uppercase;margin:0 0 8px;">Radio Araucana · Solicitud de cotización</p>
    <h1 style="margin:0 0 8px;font-size:22px;">Nueva solicitud del público</h1>
    <p style="margin:0 0 24px;font-size:12px;color:#999;">${fecha}</p>

    <h2 style="margin:24px 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Cliente</h2>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <tr><td style="padding:4px 0;color:#666;width:120px;">Nombre</td><td><strong>${escapeHtml(cliente.nombre)}</strong></td></tr>
      <tr><td style="padding:4px 0;color:#666;">Empresa</td><td>${escapeHtml(cliente.empresa)}</td></tr>
      ${tipoPromoLinea ? `<tr><td style="padding:4px 0;color:#666;">Promociona</td><td>${escapeHtml(tipoPromoLinea)}</td></tr>` : ""}
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
      <a href="https://radioaraucana.cl/cotiza/admin" style="color:#29623a;">radioaraucana.cl/cotiza/admin</a>
      y envíasela al cliente.
    </div>

    <p style="margin-top:24px;font-size:11px;color:#999;">Generado desde radioaraucana.cl/cotiza</p>
  </div>
</body></html>`;
}

function renderTeamText({ cliente, pedido, comentarios, fecha }) {
  const out = [];
  out.push("NUEVA SOLICITUD — COTIZACIÓN PUBLICIDAD RADIO ARAUCANA");
  out.push("=".repeat(50));
  out.push(`Fecha: ${fecha}`);
  out.push("");
  out.push("CLIENTE:");
  out.push(`  Nombre: ${cliente.nombre}`);
  out.push(`  Empresa: ${cliente.empresa}`);
  const tipoPromoLinea = tipoPromocionTexto(cliente);
  if (tipoPromoLinea) out.push(`  Promociona: ${tipoPromoLinea}`);
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
  out.push("→ Arma cotización formal en radioaraucana.cl/cotiza/admin");
  return out.join("\n");
}

/* ─── Email AL CLIENTE (confirmación + ejemplos educativos) ──────────────── */

function renderClienteHtml({ cliente, pedido, comentarios, ejemplos, fecha }) {
  const nombrePila = (cliente.nombre || "").split(" ")[0] || cliente.nombre || "";

  // Cada item del pedido se renderiza con la "necesidad" partida en líneas
  // (separador " · " del frontend). Una línea por respuesta es más fácil
  // de escanear que un párrafo continuo, sobre todo en mobile.
  const pedidoFilas = pedido.map((p) => {
    const items = (p.necesidad || "").split(" · ").map((s) => s.trim()).filter(Boolean);
    const necesidadHtml = items.length > 0
      ? `<ul style="margin:0;padding:0;list-style:none;">${items.map((it) => `<li style="margin:0 0 4px;padding:0 0 0 12px;position:relative;font-size:13px;color:#444;line-height:1.5;"><span style="position:absolute;left:0;top:0;color:#52b870;font-weight:700;">·</span>${escapeHtml(it)}</li>`).join("")}</ul>`
      : "<em style='color:#999'>sin detalle</em>";
    return `
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;font-size:14px;width:38%;vertical-align:top;"><strong>${escapeHtml(p.titulo)}</strong><br/><span style="font-size:12px;color:#999;">${escapeHtml(p.duracion)}</span></td>
      <td style="padding:12px 14px;border-bottom:1px solid #f0f0f0;vertical-align:top;">${necesidadHtml}</td>
    </tr>`;
  }).join("");

  // Layout label/precio con TABLA (no flex): Gmail y la mayoría de los
  // clientes de email no soportan flexbox, por eso el precio aparecía
  // pegado al label en vez de alineado a la derecha.
  //
  // Precio grande muestra NETO + IVA porque el tarifario está construido
  // como frases × precioUnitario en múltiplos de mil — los netos son
  // visualmente "redondos" ($255.000, $480.000…) y la suma con IVA queda
  // explícita en la línea chica de math (que igual muestra el total).
  //
  // Tipografía del precio: $monto en grande/bold como ancla visual; el
  // sufijo "+ IVA / mes" un punto más chico y peso normal para que la
  // cifra no se pierda al lado del texto. Card con acento verde izquierdo
  // sutil que ancla cada bloque a la identidad de Radio Araucana.
  const ejemplosCards = ejemplos.map((e) => `
    <div style="background:#fafafa;border:1px solid #f0f0f0;border-left:3px solid #52b870;border-radius:6px;padding:18px 20px;margin-bottom:12px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        <tbody>
          <tr>
            <td style="font-size:15px;font-weight:700;color:#191919;text-align:left;vertical-align:baseline;padding-right:12px;">${escapeHtml(e.label)}</td>
            <td style="text-align:right;vertical-align:baseline;white-space:nowrap;font-variant-numeric:tabular-nums;"><span style="font-size:18px;font-weight:700;color:#29623a;">${fmtCLP(e.subtotal)}</span><span style="font-size:13px;font-weight:400;color:#666;"> + IVA / mes</span></td>
          </tr>
        </tbody>
      </table>
      <p style="margin:0 0 6px;font-size:11px;color:#999;font-variant-numeric:tabular-nums;">
        ${e.frases} frases × ${fmtCLP(e.precioUnitario)} = ${fmtCLP(e.subtotal)} neto · Total con IVA ${fmtCLP(e.total)}
      </p>
      <p style="margin:0;font-size:13px;color:#444;line-height:1.55;">${escapeHtml(e.descripcion)}</p>
    </div>`).join("");

  return `<!DOCTYPE html>
<html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5;margin:0;padding:24px;color:#191919;">
  <div style="max-width:680px;margin:0 auto;background:#fff;border-radius:8px;padding:36px;">
    <div style="border-bottom:2px solid #29623a;padding-bottom:18px;margin-bottom:24px;">
      <img src="https://radioaraucana.cl/araucana-logo.png" alt="Radio Araucana 95.9 FM" width="220" style="display:block;max-width:100%;height:auto;border:0;margin:0 0 10px;">
      <p style="font-size:12px;color:#666;margin:0;">Temuco · La Araucanía · Desde 1960</p>
    </div>

    <h1 style="margin:0 0 8px;font-size:22px;color:#191919;">Recibimos tu solicitud${nombrePila ? `, ${escapeHtml(nombrePila)}` : ""}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#666;">${fecha}</p>

    <p style="margin:0 0 16px;font-size:15px;color:#191919;line-height:1.6;">
      Gracias por considerarnos. Pasamos tu pedido al equipo comercial — te contactaremos
      en horario hábil con la propuesta formal a medida, adaptada a lo que necesitas.
    </p>

    <h2 style="margin:28px 0 10px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Esto es lo que nos contaste</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:6px;overflow:hidden;">
      <thead>
        <tr style="background:#fafafa;">
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Formato</th>
          <th style="padding:10px 14px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.08em;">Lo que pediste</th>
        </tr>
      </thead>
      <tbody>${pedidoFilas}</tbody>
    </table>
    ${comentarios ? `<div style="margin-top:12px;padding:12px 14px;background:#fafafa;border-left:3px solid #29623a;font-size:13px;color:#444;line-height:1.5;"><strong>Tus comentarios:</strong><br/>${escapeHtml(comentarios).replace(/\n/g, "<br/>")}</div>` : ""}

    ${ejemplos.length > 0 ? `
    <h2 style="margin:36px 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Mientras tanto, algunos ejemplos para orientarte</h2>
    <p style="margin:0 0 16px;font-size:13px;color:#444;line-height:1.55;">
      Estos son ejemplos de packs mensuales en <strong>horario repartido</strong>, es decir, las frases rotan durante toda la programación. Si prefieres concentrar las pasadas en bloques específicos (mañana, tarde o noche), existe el horario seleccionado con valores algo mayores — lo conversamos en tu propuesta a medida.
    </p>
    ${ejemplosCards}
    ` : ""}

    <div style="margin-top:24px;padding:18px 20px;background:rgba(82,184,112,0.06);border-left:3px solid #52b870;border-radius:0 6px 6px 0;">
      <p style="margin:0 0 8px;font-size:14px;color:#191919;font-weight:700;">Estos son referencias para orientarte.</p>
      <p style="margin:0;font-size:13px;color:#444;line-height:1.6;">
        Tu cotización a medida puede ser más liviana o más intensa según lo que necesites.
        Aplican <strong>descuentos según volumen, continuidad y forma de pago</strong>. Además,
        los contratos de 6 o 12 meses acceden a <strong>bonificaciones por permanencia</strong> —
        conversemos para armar el convenio que mejor se adapte a tu campaña.
      </p>
    </div>

    <p style="margin-top:24px;font-size:12px;color:#888;line-height:1.6;">
      Los valores indicados son <strong>referenciales</strong> y están sujetos a confirmación
      por Radio Araucana. Pueden ajustarse en caso de errores de sistema, tipográficos o por
      actualización de tarifas vigentes. El acuerdo definitivo se formaliza al momento de la
      contratación.
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

function renderClienteText({ cliente, pedido, comentarios, ejemplos, fecha }) {
  const nombrePila = (cliente.nombre || "").split(" ")[0] || cliente.nombre || "";
  const out = [];
  out.push("RADIO ARAUCANA 95.9 FM");
  out.push("=".repeat(50));
  out.push(`Recibimos tu solicitud${nombrePila ? `, ${nombrePila}` : ""}`);
  out.push(`Fecha: ${fecha}`);
  out.push("");
  out.push("Gracias por considerarnos. Pasamos tu pedido al equipo comercial — te");
  out.push("contactaremos en horario hábil con la propuesta formal a medida.");
  out.push("");
  out.push("ESTO ES LO QUE NOS CONTASTE:");
  pedido.forEach((p) => {
    out.push(`  • ${p.titulo} (${p.duracion})`);
    if (p.necesidad) out.push(`      → ${p.necesidad}`);
  });
  if (comentarios) {
    out.push("");
    out.push(`Tus comentarios: ${comentarios}`);
  }
  if (ejemplos.length > 0) {
    out.push("");
    out.push("EJEMPLOS PARA ORIENTARTE (packs mensuales en horario repartido):");
    ejemplos.forEach((e) => {
      out.push("");
      out.push(`  ${e.label} — ${fmtCLP(e.subtotal)} + IVA / mes`);
      out.push(`    ${e.frases} frases × ${fmtCLP(e.precioUnitario)} = ${fmtCLP(e.subtotal)} neto · Total con IVA ${fmtCLP(e.total)}`);
      if (e.descripcion) out.push(`    ${e.descripcion}`);
    });
    out.push("");
    out.push("Si prefieres horario seleccionado (mañana, tarde o noche), los valores");
    out.push("son algo mayores — lo conversamos en tu propuesta a medida.");
  }
  out.push("");
  out.push("Estos son referencias para orientarte. Tu cotización a medida puede ser más");
  out.push("liviana o más intensa según lo que necesites. Aplican descuentos según");
  out.push("volumen, continuidad y forma de pago. Los contratos de 6 o 12 meses acceden");
  out.push("a bonificaciones por permanencia — conversemos para armar el convenio que");
  out.push("mejor se adapte a tu campaña.");
  out.push("");
  out.push("Valores referenciales, sujetos a confirmación por Radio Araucana. Pueden");
  out.push("ajustarse por errores de sistema, tipográficos o actualización de tarifas.");
  out.push("");
  out.push("Radio Araucana FM 95.9 · cotizaciones@araucanayfrontera.cl · +56 9 9287 2087");
  return out.join("\n");
}

/* ─── Handler ───────────────────────────────────────────────────────────── */

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
    tipoPromocion: clean(req.body.cliente.tipoPromocion, 40),
    tipoPromocionOtro: clean(req.body.cliente.tipoPromocionOtro, 200),
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

  // Persistir la solicitud en Supabase ANTES de mandar emails. Si la BD falla
  // seguimos enviando los correos igual — la información no se pierde.
  let solicitudId = null;
  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from("cotiza_solicitudes")
        .insert({
          cliente_nombre: cliente.nombre,
          cliente_empresa: cliente.empresa,
          cliente_telefono: cliente.telefono || null,
          cliente_email: cliente.email || null,
          tipo_promocion: cliente.tipoPromocion || null,
          tipo_promocion_otro: cliente.tipoPromocionOtro || null,
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
      message: "El sistema de email no está disponible ahora mismo. Por favor escríbenos directamente a cotizaciones@araucanayfrontera.cl o por WhatsApp al +56 9 9287 2087.",
    });
  }

  // Email AL EQUIPO COMERCIAL (siempre se envía; si falla, devolvemos error).
  const subjectTeam = `Solicitud cotización — ${cliente.empresa || cliente.nombre}`;
  const teamResult = await sendEmail({
    to: cotizaTo(),
    cc: cotizaCc(),
    subject: subjectTeam,
    html: renderTeamHtml({ cliente, pedido, comentarios, fecha }),
    text: renderTeamText({ cliente, pedido, comentarios, fecha }),
    replyTo: cliente.email || undefined,
    fromName: "Radio Araucana — Solicitud Cotización",
    fromEmail: cotizaFromEmail(),
  });

  if (!teamResult.ok) {
    console.error("[/api/cotiza/submit] envío al equipo falló:", teamResult.error);
    return res.status(502).json({ error: "send_failed", detail: teamResult.error });
  }

  // Email DE CONFIRMACIÓN AL CLIENTE (best-effort: si falla, no rompe la
  // respuesta — el equipo ya tiene la solicitud y puede contactar igual).
  let clienteEmailSent = false;
  if (esEmail(cliente.email)) {
    try {
      const tarifas = await leerTarifas();
      const ejemplos = ejemplosPacksBase(tarifas);
      const fechaCliente = new Date().toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" });
      const clientResult = await sendEmail({
        to: cliente.email,
        subject: `Recibimos tu solicitud de cotización — Radio Araucana 95.9 FM`,
        html: renderClienteHtml({ cliente, pedido, comentarios, ejemplos, fecha: fechaCliente }),
        text: renderClienteText({ cliente, pedido, comentarios, ejemplos, fecha: fechaCliente }),
        replyTo: cotizaFromEmail(),
        fromName: "Radio Araucana 95.9 FM",
        fromEmail: cotizaFromEmail(),
      });
      clienteEmailSent = clientResult.ok;
      if (!clientResult.ok) {
        console.error("[/api/cotiza/submit] envío al cliente falló:", clientResult.error);
      }
    } catch (err) {
      console.error("[/api/cotiza/submit] cliente email error:", err?.message ?? err);
    }
  }

  return res.status(200).json({
    ok: true,
    messageId: teamResult.messageId,
    solicitudId,
    clienteEmailSent,
  });
}
