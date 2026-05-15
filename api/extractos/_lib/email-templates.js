// Plantillas HTML + texto plano para los emails transaccionales del sistema.
// Inline CSS (Gmail-friendly, sin <style> en <head>). Sin assets externos.
//
// Las plantillas reciben { order, extracts, settings } donde:
//   - order: registro de public.orders (con order_number, amount_clp total, etc.)
//   - extracts: array de public.order_extracts (los 1..20 extractos del bundle)
//   - settings: blob { radio_legal_name, radio_bank_name, ... } leído desde public.settings

const COLORS = {
  greenDark: "#0d2410",
  greenSoft: "#4ea552",
  cream: "#f6f5ee",
  paper: "#ffffff",
  ink: "#1a1f1a",
  inkSoft: "#5a5f56",
  border: "#dad7c8",
  warn: "#c9923c",
};

function fmtCLP(amount) {
  return "$" + Number(amount || 0).toLocaleString("es-CL");
}

function fmtDate(isoDate) {
  if (!isoDate) return "—";
  const [y, m, d] = String(isoDate).split("-").map((s) => parseInt(s, 10));
  if (!y || !m || !d) return isoDate;
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio",
                 "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d} de ${meses[m - 1]} de ${y}`;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getStr(settings, key, fallback = "") {
  const v = settings?.[key];
  return typeof v === "string" ? v : fallback;
}

// Normaliza el parámetro `extracts`: si la función se llama sin él (callers
// antiguos que solo pasaban `order`), reconstruimos un extracto a partir de
// las columnas legacy de `order`.
function normalizeExtracts(order, extracts) {
  if (Array.isArray(extracts) && extracts.length > 0) return extracts;
  return [{
    extract_index: 1,
    extract_text: order.extract_text,
    line_count: order.line_count,
    amount_clp: order.amount_clp,
    procedure_type: order.procedure_type,
    comuna: order.comuna,
    provincia: order.provincia,
    region: order.region,
    resolved_publication_date: order.resolved_publication_date,
  }];
}

/* ────────────────────────────────────────────────────────────────────────────
 * 1) Email al CLIENTE — confirmación de orden + datos para transferencia
 * ──────────────────────────────────────────────────────────────────────────── */

export function clientOrderEmail({ order, extracts, settings }) {
  const list = normalizeExtracts(order, extracts);
  const bankName    = getStr(settings, "radio_bank_name", "Banco Santander");
  const accountType = getStr(settings, "radio_bank_account_type", "Cuenta Corriente");
  const accountNum  = getStr(settings, "radio_bank_account_number", "0-000-9874438-0");
  const legalName   = getStr(settings, "radio_legal_name", "Radio La Frontera");
  const legalRut    = getStr(settings, "radio_legal_rut", "79.966.670-7");
  const supportEmail = getStr(settings, "radio_email_secretary", "administracion@araucanayfrontera.cl");
  const adminEmail   = getStr(settings, "radio_email_administration", "administracion@araucanayfrontera.cl");
  const phoneMobile  = getStr(settings, "radio_phone_mobile", "+56 9 4239 0216");

  const n = list.length;
  const noun = n === 1 ? "tu extracto" : `tus ${n} extractos`;
  const subject = `Recibimos tu solicitud — Orden ${order.order_number} (${n} ${n === 1 ? "extracto" : "extractos"}) · Radio La Frontera`;
  const amount = fmtCLP(order.amount_clp);

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <div style="background:${COLORS.warn};color:#fff;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:6px 10px;border-radius:4px;display:inline-block;font-weight:700;margin-bottom:18px;">
        Beta — confirmación manual
      </div>
      <h1 style="font-family:Georgia,serif;font-size:26px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Recibimos tu solicitud
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:15px;line-height:1.55;margin:0 0 20px;">
        Hola ${escapeHtml(order.client_name)}, gracias por preferir Radio La Frontera.
        Tu solicitud por ${escapeHtml(noun)} quedó registrada.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px dashed ${COLORS.border};border-radius:8px;margin-bottom:22px;">
        <tr><td style="padding:18px 22px;">
          <div style="font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;font-family:'Courier New',monospace;">N° de orden</div>
          <div style="font-family:'Courier New',monospace;font-size:24px;color:${COLORS.greenDark};font-weight:600;margin-top:4px;">${escapeHtml(order.order_number)}</div>
        </td></tr>
      </table>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">${n === 1 ? "Tu extracto" : `Tus ${n} extractos`}</h2>
      ${list.map((ex) => extractSummaryCardHtml(ex)).join("")}

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:18px 0 10px;font-weight:500;">Total a pagar</h2>
      ${row("Monto (IVA incluido)", `<strong style="color:${COLORS.greenDark};font-size:18px;">${amount}</strong>`)}

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:24px 0 10px;font-weight:500;">Cómo pagar</h2>
      <p style="color:${COLORS.inkSoft};font-size:14px;line-height:1.55;margin:0 0 14px;">
        Realiza una transferencia bancaria por <strong>${amount}</strong> a la siguiente cuenta:
      </p>
      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.paper};border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:14px;">
        <tr><td style="padding:18px 22px;font-family:'Courier New',monospace;font-size:13px;line-height:1.7;color:${COLORS.ink};">
          <strong>${escapeHtml(legalName)}</strong><br/>
          RUT: ${escapeHtml(legalRut)}<br/>
          ${escapeHtml(bankName)} — ${escapeHtml(accountType)}<br/>
          N° de cuenta: <strong>${escapeHtml(accountNum)}</strong><br/>
          Email: ${escapeHtml(adminEmail)}
        </td></tr>
      </table>
      <p style="color:${COLORS.inkSoft};font-size:13px;line-height:1.55;margin:0 0 14px;">
        Importante: incluye el <strong>N° de orden ${escapeHtml(order.order_number)}</strong> en
        el comentario o detalle de la transferencia. Cuando recibamos el pago,
        confirmaremos las difusiones por email y emitiremos <strong>una sola factura electrónica</strong>
        a los datos que indicaste.
      </p>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:24px 0 10px;font-weight:500;">Qué pasa después</h2>
      <ol style="color:${COLORS.inkSoft};font-size:14px;line-height:1.7;margin:0 0 18px;padding-left:20px;">
        <li>Transfieres el monto y nos avisas por email a <a href="mailto:${escapeHtml(adminEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(adminEmail)}</a> (opcional, también lo detectamos al revisar el banco).</li>
        <li>Te confirmamos por email que recibimos el pago, normalmente en menos de 24 horas hábiles.</li>
        <li>Cada extracto se emite en la fecha indicada (3 veces consecutivas).</li>
        <li>Al día hábil siguiente de cada difusión recibes <strong>un certificado individual</strong> por extracto, con firma y timbre.</li>
        <li>La factura electrónica del bundle te llega cuando se confirma el pago.</li>
      </ol>

      <div style="background:rgba(201,146,60,0.08);border:1px solid rgba(201,146,60,0.35);border-radius:8px;padding:14px 18px;margin-bottom:18px;">
        <strong style="color:${COLORS.warn};font-size:13px;">⚠ Estamos en beta</strong>
        <p style="color:${COLORS.inkSoft};font-size:13px;line-height:1.55;margin:6px 0 0;">
          Por ahora la confirmación de pago es manual: nuestra operadora revisa la cuenta y te avisa por email.
          Si pasa más de 24 horas hábiles sin novedades, escribe a
          <a href="mailto:${escapeHtml(supportEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(supportEmail)}</a>
          o llama al ${escapeHtml(phoneMobile)}.
        </p>
      </div>
    </td></tr>
  `, { settings, footerNote: `Si tienes dudas, responde este email o escribe a ${supportEmail}.` });

  const text = [
    `RECIBIMOS TU SOLICITUD — ORDEN ${order.order_number}`,
    ``,
    `Hola ${order.client_name}, gracias por preferir Radio La Frontera.`,
    `Tu solicitud por ${noun} quedó registrada.`,
    ``,
    `EXTRACTOS`,
    ...list.map((ex) => extractSummaryLineText(ex)),
    ``,
    `TOTAL A PAGAR: ${amount} (IVA incl.)`,
    ``,
    `CÓMO PAGAR — Transferencia bancaria:`,
    `· ${legalName}`,
    `· RUT: ${legalRut}`,
    `· ${bankName} — ${accountType}`,
    `· N° de cuenta: ${accountNum}`,
    `· Email: ${adminEmail}`,
    ``,
    `Importante: incluye el N° de orden ${order.order_number} en el comentario.`,
    ``,
    `QUÉ PASA DESPUÉS`,
    `1. Transfieres y nos avisas (opcional) a ${adminEmail}.`,
    `2. Confirmamos pago por email en <24h hábiles.`,
    `3. Cada extracto se emite en su fecha (3 veces).`,
    `4. Al día siguiente recibes un certificado por extracto.`,
    `5. Una sola factura electrónica por todo el bundle.`,
    ``,
    `Estamos en beta — confirmación manual. Dudas: ${supportEmail} / ${phoneMobile}`,
  ].join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2) Email al ADMIN (Bertha) — alerta de orden nueva
 * ──────────────────────────────────────────────────────────────────────────── */

export function adminOrderNotificationEmail({ order, extracts, settings, dashboardUrl }) {
  const list = normalizeExtracts(order, extracts);
  const n = list.length;
  const subject = `🆕 Nueva orden ${order.order_number} — ${n} ${n === 1 ? "extracto" : "extractos"} · ${fmtCLP(order.amount_clp)}`;

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <h1 style="font-family:Georgia,serif;font-size:24px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Nueva orden de extracto${n > 1 ? "s" : ""}
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:14px;line-height:1.55;margin:0 0 18px;">
        El cliente envió la solicitud (${n} ${n === 1 ? "extracto" : "extractos"}) y está esperando confirmación de pago por transferencia.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:18px;">
        <tr><td style="padding:18px 22px;">
          <div style="font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;font-family:'Courier New',monospace;">N° de orden</div>
          <div style="font-family:'Courier New',monospace;font-size:22px;color:${COLORS.greenDark};font-weight:600;margin:4px 0 0;">${escapeHtml(order.order_number)}</div>
        </td></tr>
      </table>

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:0 0 8px;font-weight:500;">Cliente</h2>
      ${row("Nombre", escapeHtml(order.client_name))}
      ${row("RUT", escapeHtml(order.client_rut))}
      ${row("Email", `<a href="mailto:${escapeHtml(order.client_email)}" style="color:${COLORS.greenDark};">${escapeHtml(order.client_email)}</a>`)}
      ${row("Teléfono", escapeHtml(order.client_phone))}
      ${order.client_organization ? row("Organización", escapeHtml(order.client_organization)) : ""}

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:18px 0 8px;font-weight:500;">Facturación</h2>
      ${row("Razón social", escapeHtml(order.billing_legal_name || "—"))}
      ${row("RUT empresa", escapeHtml(order.billing_rut || "—"))}
      ${row("Giro", escapeHtml(order.billing_giro || "—"))}
      ${row("Domicilio", escapeHtml(order.billing_address || "—"))}
      ${row("Email factura", escapeHtml(order.billing_email || "—"))}
      ${row("Total a facturar", `<strong style="color:${COLORS.greenDark};">${fmtCLP(order.amount_clp)}</strong>`)}

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:18px 0 8px;font-weight:500;">${n === 1 ? "Extracto" : `${n} extractos`}</h2>
      ${list.map((ex) => extractAdminCardHtml(ex)).join("")}

      ${dashboardUrl ? `
        <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:${COLORS.greenDark};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;margin-top:8px;">
          Ver en el panel →
        </a>
      ` : ""}
    </td></tr>
  `, { settings, footerNote: "Notificación interna — no responder al cliente desde acá." });

  const text = [
    `🆕 NUEVA ORDEN ${order.order_number} — ${n} ${n === 1 ? "extracto" : "extractos"}`,
    ``,
    `CLIENTE`,
    `· ${order.client_name}`,
    `· RUT: ${order.client_rut}`,
    `· Email: ${order.client_email}`,
    `· Teléfono: ${order.client_phone}`,
    order.client_organization ? `· Org: ${order.client_organization}` : null,
    ``,
    `FACTURACIÓN`,
    `· Razón social: ${order.billing_legal_name || "—"}`,
    `· RUT empresa: ${order.billing_rut || "—"}`,
    `· Giro: ${order.billing_giro || "—"}`,
    `· Domicilio: ${order.billing_address || "—"}`,
    `· Email factura: ${order.billing_email || "—"}`,
    `· Total a facturar: ${fmtCLP(order.amount_clp)}`,
    ``,
    ...list.flatMap((ex) => extractAdminLinesText(ex)),
    ``,
    dashboardUrl ? `Panel: ${dashboardUrl}` : "",
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3) Email al CLIENTE — confirmación de pago recibido (Bertha marcó "Pagada")
 * ──────────────────────────────────────────────────────────────────────────── */

export function paymentConfirmedEmail({ order, extracts, settings }) {
  const list = normalizeExtracts(order, extracts);
  const supportEmail = getStr(settings, "radio_email_secretary", "administracion@araucanayfrontera.cl");

  const amount = fmtCLP(order.amount_clp);
  const n = list.length;
  const subject = `Pago recibido — ${n} ${n === 1 ? "aviso queda agendado" : "avisos quedan agendados"} (${order.order_number})`;

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <div style="background:rgba(78,165,82,0.12);color:${COLORS.greenDark};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:6px 12px;border-radius:4px;display:inline-block;font-weight:700;margin-bottom:18px;">
        ✓ Pago confirmado
      </div>
      <h1 style="font-family:Georgia,serif;font-size:26px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Recibimos tu pago, ${escapeHtml(firstName(order.client_name))}
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:15px;line-height:1.55;margin:0 0 22px;">
        Acabamos de confirmar tu transferencia de <strong>${amount}</strong> por la orden
        <strong style="font-family:'Courier New',monospace;">${escapeHtml(order.order_number)}</strong>.
        ${n === 1 ? "Tu aviso queda agendado en firme" : `Tus ${n} avisos quedan agendados en firme`} para las fechas indicadas.
      </p>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">${n === 1 ? "Tu aviso" : "Tus avisos"}</h2>
      ${list.map((ex) => extractSummaryCardHtml(ex)).join("")}

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:18px 0 10px;font-weight:500;">Qué viene después</h2>
      <ol style="color:${COLORS.inkSoft};font-size:14px;line-height:1.7;margin:0 0 18px;padding-left:20px;">
        <li>Cada extracto se transmite en la fecha indicada (3 veces consecutivas en horario establecido).</li>
        <li>Al día hábil siguiente de cada difusión recibes <strong>el certificado individual</strong> de ese extracto, con firma y timbre.</li>
        <li>La factura electrónica única del bundle te llega junto al primer certificado.</li>
      </ol>

      <div style="background:rgba(78,165,82,0.06);border:1px solid rgba(78,165,82,0.25);border-radius:8px;padding:14px 18px;margin-bottom:8px;">
        <p style="color:${COLORS.inkSoft};font-size:13px;line-height:1.55;margin:0;">
          ¿Dudas? Escribe a
          <a href="mailto:${escapeHtml(supportEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(supportEmail)}</a>
          mencionando tu N° de orden ${escapeHtml(order.order_number)}.
        </p>
      </div>
    </td></tr>
  `, { settings, footerNote: "" });

  const text = [
    `Pago recibido — Orden ${order.order_number}`,
    ``,
    `Hola ${firstName(order.client_name)}, recibimos tu transferencia de ${amount}.`,
    ``,
    n === 1 ? "Tu aviso queda agendado en firme:" : `Tus ${n} avisos quedan agendados en firme:`,
    ...list.map((ex) => extractSummaryLineText(ex)),
    ``,
    `QUÉ VIENE DESPUÉS`,
    `1. Cada extracto se transmite en su fecha (3 veces).`,
    `2. Al día siguiente de cada difusión recibes el certificado individual.`,
    `3. La factura electrónica única va con el primer certificado.`,
    ``,
    `Dudas: ${supportEmail} (menciona el N° ${order.order_number}).`,
  ].join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 4) Email al CLIENTE — orden cancelada
 *
 * Nota (Bertha, 2026-05-15): el aviso de "difundida al aire" se eliminó.
 * El cliente recibe directamente el certificado + factura que la operadora
 * envía manualmente; un email intermedio se sentía redundante.
 * ──────────────────────────────────────────────────────────────────────────── */

export function orderCancelledEmail({ order, settings }) {
  const adminEmail = getStr(settings, "radio_email_administration", "administracion@araucanayfrontera.cl");
  const subject = `Orden ${order.order_number} cancelada`;

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <div style="background:rgba(201,146,60,0.12);color:${COLORS.warn};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:6px 12px;border-radius:4px;display:inline-block;font-weight:700;margin-bottom:18px;">
        Orden cancelada
      </div>
      <h1 style="font-family:Georgia,serif;font-size:26px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Tu solicitud fue cancelada
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:15px;line-height:1.55;margin:0 0 18px;">
        La orden <strong style="font-family:'Courier New',monospace;">${escapeHtml(order.order_number)}</strong> fue cancelada
        ${order.cancelled_reason ? "con el siguiente motivo:" : "y queda sin efecto."}
      </p>
      ${order.cancelled_reason ? `
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px dashed ${COLORS.border};border-radius:8px;margin-bottom:18px;">
          <tr><td style="padding:14px 22px;color:${COLORS.ink};font-size:14px;line-height:1.5;">
            ${escapeHtml(order.cancelled_reason)}
          </td></tr>
        </table>
      ` : ""}

      <p style="color:${COLORS.inkSoft};font-size:14px;line-height:1.6;margin:0 0 18px;">
        Si ya transferiste el monto, te coordinamos la devolución a la brevedad.
        Si crees que esto fue un error o quieres reactivar el trámite, escríbenos a
        <a href="mailto:${escapeHtml(adminEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(adminEmail)}</a>
        mencionando ${escapeHtml(order.order_number)}.
      </p>
    </td></tr>
  `, { settings, footerNote: "" });

  const text = [
    `Orden ${order.order_number} cancelada`,
    ``,
    `Tu solicitud fue cancelada${order.cancelled_reason ? " con el siguiente motivo:" : "."}`,
    order.cancelled_reason || "",
    ``,
    `Si ya transferiste, coordinamos devolución. Dudas: ${adminEmail} (mencionar ${order.order_number}).`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

/* ─── helpers de extractos ──────────────────────────────────────────────── */

function extractSummaryCardHtml(ex) {
  const blockLine = ex.time_block
    ? `Horario: <strong>${escapeHtml(ex.time_block)} — ${blockHoursLabel(ex.time_block)}</strong><br/>`
    : "";
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:10px;">
      <tr><td style="padding:14px 18px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;margin-bottom:6px;">
          Extracto #${ex.extract_index}
        </div>
        <div style="font-size:13.5px;color:${COLORS.ink};line-height:1.6;">
          <strong>${escapeHtml(humanProcedureType(ex.procedure_type))}</strong><br/>
          ${escapeHtml(ex.comuna || "—")}, ${escapeHtml(ex.region || "—")}<br/>
          Difusión: <strong>${fmtDate(ex.resolved_publication_date)}</strong><br/>
          ${blockLine}
          ${ex.line_count || 0} ${ex.line_count === 1 ? "línea" : "líneas"} · ${fmtCLP(ex.amount_clp)}
        </div>
      </td></tr>
    </table>
  `;
}

function extractSummaryLineText(ex) {
  const blockTxt = ex.time_block ? ` — Horario ${ex.time_block} (${blockHoursLabel(ex.time_block)})` : "";
  return `· #${ex.extract_index} — ${humanProcedureType(ex.procedure_type)} — ${ex.comuna}, ${ex.region} — ${fmtDate(ex.resolved_publication_date)}${blockTxt} — ${ex.line_count} líneas · ${fmtCLP(ex.amount_clp)}`;
}

function blockHoursLabel(block) {
  if (block === "A") return "08:00, 10:00, 12:00";
  if (block === "B") return "09:00, 11:00, 13:00";
  return "";
}

function extractAdminCardHtml(ex) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:12px;">
      <tr><td style="padding:14px 18px;">
        <div style="font-family:'Courier New',monospace;font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;margin-bottom:8px;">
          Extracto #${ex.extract_index}
        </div>
        ${row("Tipo", escapeHtml(humanProcedureType(ex.procedure_type)))}
        ${row("Comuna", `${escapeHtml(ex.comuna)}, ${escapeHtml(ex.provincia)}, ${escapeHtml(ex.region)}`)}
        ${row("Fecha de difusión", fmtDate(ex.resolved_publication_date))}
        ${row("Líneas", String(ex.line_count))}
        ${row("Monto", `<strong style="color:${COLORS.greenDark};">${fmtCLP(ex.amount_clp)}</strong>`)}
        <div style="margin-top:10px;background:${COLORS.paper};border:1px dashed ${COLORS.border};border-radius:6px;padding:12px 14px;font-family:'Bookman Old Style','Bookman',Georgia,serif;font-size:13px;line-height:1.5;white-space:pre-wrap;color:${COLORS.ink};">${escapeHtml(ex.extract_text)}</div>
      </td></tr>
    </table>
  `;
}

function extractAdminLinesText(ex) {
  return [
    `── EXTRACTO #${ex.extract_index} ──`,
    `· Tipo: ${humanProcedureType(ex.procedure_type)}`,
    `· Comuna: ${ex.comuna}, ${ex.provincia}, ${ex.region}`,
    `· Fecha difusión: ${fmtDate(ex.resolved_publication_date)}`,
    `· Líneas: ${ex.line_count}`,
    `· Monto: ${fmtCLP(ex.amount_clp)}`,
    ``,
    ex.extract_text,
    ``,
  ];
}

/* ─── helpers ────────────────────────────────────────────────────────────── */

function firstName(fullName) {
  if (!fullName) return "";
  return String(fullName).trim().split(/\s+/)[0] || "";
}

function row(label, value) {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;border-bottom:1px solid ${COLORS.border};">
      <tr>
        <td style="padding:7px 0;color:${COLORS.inkSoft};font-size:13px;width:42%;">${escapeHtml(label)}</td>
        <td style="padding:7px 0;color:${COLORS.ink};font-size:13px;text-align:right;">${value}</td>
      </tr>
    </table>
  `;
}

function humanProcedureType(t) {
  switch (t) {
    case "dga_subterraneas": return "DGA — aguas subterráneas";
    case "dga_superficiales": return "DGA — aguas superficiales";
    case "dia_seia": return "DIA al SEIA";
    case "otro": return "Otro trámite administrativo";
    default: return t || "—";
  }
}

function wrap(bodyRows, { settings, footerNote }) {
  const legalName = getStr(settings, "radio_legal_name", "");
  const legalRut  = getStr(settings, "radio_legal_rut", "");
  const address   = getStr(settings, "radio_address", "");
  return `<!doctype html>
<html lang="es-CL">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Radio La Frontera — Extractos</title>
  </head>
  <body style="margin:0;padding:0;background:${COLORS.cream};font-family:Helvetica,Arial,sans-serif;color:${COLORS.ink};">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${COLORS.cream};padding:32px 16px;">
      <tr><td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background:${COLORS.paper};border:1px solid ${COLORS.border};border-radius:12px;overflow:hidden;">
          <tr><td style="background:${COLORS.greenDark};color:${COLORS.cream};padding:20px 32px;font-family:Georgia,serif;font-size:18px;font-weight:500;letter-spacing:-0.01em;">
            Radio La Frontera AM 1110 — Extractos legales
          </td></tr>
          <tr><td style="height:24px;"></td></tr>
          ${bodyRows}
          <tr><td style="height:24px;"></td></tr>
          <tr><td style="background:${COLORS.cream};padding:18px 32px;font-size:11px;color:${COLORS.inkSoft};line-height:1.6;border-top:1px solid ${COLORS.border};">
            ${footerNote ? `<div style="margin-bottom:8px;">${escapeHtml(footerNote)}</div>` : ""}
            ${legalName ? escapeHtml(legalName) : "Radio La Frontera AM 1110"}${legalRut ? ` · ${escapeHtml(legalRut)}` : ""}<br/>
            ${address ? escapeHtml(address) : "Temuco, Región de La Araucanía"}
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}
