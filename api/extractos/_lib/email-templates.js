// Plantillas HTML + texto plano para los emails transaccionales del sistema.
// Inline CSS (Gmail-friendly, sin <style> en <head>). Sin assets externos.
//
// Las plantillas reciben { order, settings } donde:
//   - order: registro de public.orders (con order_number, amount_clp, etc.)
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

/* ────────────────────────────────────────────────────────────────────────────
 * 1) Email al CLIENTE — confirmación de orden + datos para transferencia
 * ──────────────────────────────────────────────────────────────────────────── */

export function clientOrderEmail({ order, settings }) {
  const bankName    = getStr(settings, "radio_bank_name", "Banco Santander");
  const accountType = getStr(settings, "radio_bank_account_type", "Cuenta Corriente");
  const accountNum  = getStr(settings, "radio_bank_account_number", "0-000-9874438-0");
  const legalName   = getStr(settings, "radio_legal_name", "Radio La Frontera");
  const legalRut    = getStr(settings, "radio_legal_rut", "79.966.670-7");
  const supportEmail = getStr(settings, "radio_email_secretary", "secretaria.araucana@gmail.com");
  const adminEmail   = getStr(settings, "radio_email_administration", "administracion@araucanayfrontera.cl");
  const phoneMobile  = getStr(settings, "radio_phone_mobile", "+56 9 4239 0216");

  const subject = `Recibimos tu solicitud — Orden ${order.order_number} · Radio La Frontera`;

  const broadcastDate = fmtDate(order.resolved_publication_date);
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
        Tu solicitud quedó registrada con los siguientes datos.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px dashed ${COLORS.border};border-radius:8px;margin-bottom:22px;">
        <tr><td style="padding:18px 22px;">
          <div style="font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;font-family:'Courier New',monospace;">N° de orden</div>
          <div style="font-family:'Courier New',monospace;font-size:24px;color:${COLORS.greenDark};font-weight:600;margin-top:4px;">${escapeHtml(order.order_number)}</div>
        </td></tr>
      </table>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">Resumen</h2>
      ${row("Líneas del extracto", String(order.line_count || "—"))}
      ${row("Monto a pagar (IVA incluido)", `<strong style="color:${COLORS.greenDark};font-size:18px;">${amount}</strong>`)}
      ${row("Fecha de difusión", broadcastDate)}
      ${row("Comuna del trámite", `${escapeHtml(order.comuna)}, ${escapeHtml(order.region)}`)}

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
        confirmaremos la difusión por email y emitiremos la factura electrónica
        a los datos de facturación que indicaste.
      </p>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:24px 0 10px;font-weight:500;">Qué pasa después</h2>
      <ol style="color:${COLORS.inkSoft};font-size:14px;line-height:1.7;margin:0 0 18px;padding-left:20px;">
        <li>Transfieres el monto y nos avisas por email a <a href="mailto:${escapeHtml(adminEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(adminEmail)}</a> (opcional, también lo detectamos al revisar el banco).</li>
        <li>Te confirmamos por email que recibimos el pago, normalmente en menos de 24 horas hábiles.</li>
        <li>El día <strong>${broadcastDate}</strong> la radio emite tu aviso 3 veces consecutivas.</li>
        <li>Al día hábil siguiente recibes el certificado de difusión por email, con firma y timbre.</li>
        <li>Junto al certificado va la factura electrónica.</li>
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
    ``,
    `RESUMEN`,
    `· Líneas: ${order.line_count}`,
    `· Monto a pagar: ${amount} (IVA incl.)`,
    `· Fecha de difusión: ${broadcastDate}`,
    `· Comuna: ${order.comuna}, ${order.region}`,
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
    `3. El ${broadcastDate} la radio emite tu aviso 3 veces.`,
    `4. Al día siguiente recibes el certificado de difusión por email.`,
    `5. La factura electrónica va junto al certificado.`,
    ``,
    `Estamos en beta — confirmación manual. Dudas: ${supportEmail} / ${phoneMobile}`,
  ].join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 2) Email al ADMIN (Bertha) — alerta de orden nueva
 * ──────────────────────────────────────────────────────────────────────────── */

export function adminOrderNotificationEmail({ order, settings, dashboardUrl }) {
  const subject = `🆕 Nueva orden ${order.order_number} — ${fmtCLP(order.amount_clp)} · ${fmtDate(order.resolved_publication_date)}`;

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <h1 style="font-family:Georgia,serif;font-size:24px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Nueva orden de extracto
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:14px;line-height:1.55;margin:0 0 18px;">
        El cliente envió la solicitud y está esperando confirmación de pago por transferencia.
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

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:18px 0 8px;font-weight:500;">Trámite y difusión</h2>
      ${row("Tipo", escapeHtml(humanProcedureType(order.procedure_type)))}
      ${row("Comuna", `${escapeHtml(order.comuna)}, ${escapeHtml(order.provincia)}, ${escapeHtml(order.region)}`)}
      ${row("Fecha de difusión", fmtDate(order.resolved_publication_date))}
      ${row("Líneas", String(order.line_count))}
      ${row("Monto", `<strong style="color:${COLORS.greenDark};">${fmtCLP(order.amount_clp)}</strong>`)}

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:18px 0 8px;font-weight:500;">Facturación</h2>
      ${row("Razón social", escapeHtml(order.billing_legal_name || "—"))}
      ${row("RUT empresa", escapeHtml(order.billing_rut || "—"))}
      ${row("Giro", escapeHtml(order.billing_giro || "—"))}
      ${row("Domicilio", escapeHtml(order.billing_address || "—"))}
      ${row("Email factura", escapeHtml(order.billing_email || "—"))}

      <h2 style="font-family:Georgia,serif;font-size:16px;color:${COLORS.greenDark};margin:18px 0 8px;font-weight:500;">Texto del extracto</h2>
      <div style="background:${COLORS.paper};border:1px dashed ${COLORS.border};border-radius:8px;padding:14px 18px;font-family:'Bookman Old Style','Bookman',Georgia,serif;font-size:13px;line-height:1.5;white-space:pre-wrap;color:${COLORS.ink};margin-bottom:18px;">${escapeHtml(order.extract_text)}</div>

      ${dashboardUrl ? `
        <a href="${escapeHtml(dashboardUrl)}" style="display:inline-block;padding:12px 22px;background:${COLORS.greenDark};color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
          Ver en el panel →
        </a>
      ` : ""}
    </td></tr>
  `, { settings, footerNote: "Notificación interna — no responder al cliente desde acá." });

  const text = [
    `🆕 NUEVA ORDEN ${order.order_number}`,
    ``,
    `CLIENTE`,
    `· ${order.client_name}`,
    `· RUT: ${order.client_rut}`,
    `· Email: ${order.client_email}`,
    `· Teléfono: ${order.client_phone}`,
    order.client_organization ? `· Org: ${order.client_organization}` : null,
    ``,
    `TRÁMITE Y DIFUSIÓN`,
    `· Tipo: ${humanProcedureType(order.procedure_type)}`,
    `· Comuna: ${order.comuna}, ${order.provincia}, ${order.region}`,
    `· Fecha difusión: ${fmtDate(order.resolved_publication_date)}`,
    `· Líneas: ${order.line_count}`,
    `· Monto: ${fmtCLP(order.amount_clp)}`,
    ``,
    `FACTURACIÓN`,
    `· Razón social: ${order.billing_legal_name || "—"}`,
    `· RUT empresa: ${order.billing_rut || "—"}`,
    `· Giro: ${order.billing_giro || "—"}`,
    `· Domicilio: ${order.billing_address || "—"}`,
    `· Email factura: ${order.billing_email || "—"}`,
    ``,
    `EXTRACTO`,
    order.extract_text,
    ``,
    dashboardUrl ? `Panel: ${dashboardUrl}` : "",
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 3) Email al CLIENTE — confirmación de pago recibido (Bertha marcó "Pagada")
 * ──────────────────────────────────────────────────────────────────────────── */

export function paymentConfirmedEmail({ order, settings }) {
  const supportEmail = getStr(settings, "radio_email_secretary", "secretaria.araucana@gmail.com");
  const adminEmail = getStr(settings, "radio_email_administration", "administracion@araucanayfrontera.cl");

  const broadcastDate = fmtDate(order.resolved_publication_date);
  const amount = fmtCLP(order.amount_clp);
  const subject = `Pago recibido — Tu aviso queda agendado para el ${broadcastDate} (${order.order_number})`;

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
        Tu aviso queda <strong>agendado en firme</strong> para difusión el día indicado.
      </p>

      <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px dashed ${COLORS.border};border-radius:8px;margin-bottom:22px;">
        <tr><td style="padding:18px 22px;text-align:center;">
          <div style="font-size:11px;color:${COLORS.inkSoft};letter-spacing:0.4px;text-transform:uppercase;font-family:'Courier New',monospace;">Fecha de difusión</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:${COLORS.greenDark};font-weight:600;margin-top:4px;">${broadcastDate}</div>
        </td></tr>
      </table>

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">Qué viene después</h2>
      <ol style="color:${COLORS.inkSoft};font-size:14px;line-height:1.7;margin:0 0 18px;padding-left:20px;">
        <li>El día <strong>${broadcastDate}</strong> nuestra emisora transmite tu aviso 3 veces consecutivas en horario establecido.</li>
        <li>Al día hábil siguiente recibirás por email <strong>el certificado de difusión</strong> (con firma y timbre) y la <strong>factura electrónica</strong> a los datos de facturación que indicaste.</li>
        <li>Con eso, tu trámite queda completo desde el lado de la radio.</li>
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
    `Tu aviso queda agendado en firme para el ${broadcastDate}.`,
    ``,
    `QUÉ VIENE DESPUÉS:`,
    `1. El ${broadcastDate} la emisora transmite tu aviso 3 veces.`,
    `2. Al día hábil siguiente recibes por email el certificado de difusión y la factura electrónica.`,
    `3. Con eso tu trámite queda completo.`,
    ``,
    `Dudas: ${supportEmail} (menciona el N° ${order.order_number}).`,
  ].join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 4) Email al CLIENTE — aviso fue difundido (Bertha marcó "Difundida")
 * ──────────────────────────────────────────────────────────────────────────── */

export function broadcastCompleteEmail({ order, settings }) {
  const supportEmail = getStr(settings, "radio_email_secretary", "secretaria.araucana@gmail.com");
  const broadcastDate = fmtDate(order.resolved_publication_date);
  const subject = `Tu aviso fue difundido hoy — Orden ${order.order_number}`;

  const times = [order.broadcast_time_1, order.broadcast_time_2, order.broadcast_time_3]
    .filter(Boolean)
    .map((t) => String(t).slice(0, 5));

  const html = wrap(`
    <tr><td style="padding:0 32px;">
      <div style="background:rgba(78,165,82,0.12);color:${COLORS.greenDark};font-size:11px;letter-spacing:0.18em;text-transform:uppercase;padding:6px 12px;border-radius:4px;display:inline-block;font-weight:700;margin-bottom:18px;">
        ✓ Difundido
      </div>
      <h1 style="font-family:Georgia,serif;font-size:26px;color:${COLORS.greenDark};margin:0 0 8px;line-height:1.2;font-weight:500;">
        Tu aviso salió al aire hoy
      </h1>
      <p style="color:${COLORS.inkSoft};font-size:15px;line-height:1.55;margin:0 0 22px;">
        Confirmamos que tu aviso correspondiente a la orden
        <strong style="font-family:'Courier New',monospace;">${escapeHtml(order.order_number)}</strong>
        fue transmitido hoy ${broadcastDate} por Radio La Frontera AM 1110.
      </p>

      ${times.length > 0 ? `
        <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">Horarios de transmisión</h2>
        <table cellpadding="0" cellspacing="0" border="0" style="width:100%;background:${COLORS.cream};border:1px solid ${COLORS.border};border-radius:8px;margin-bottom:18px;">
          <tr><td style="padding:14px 22px;font-family:'Courier New',monospace;font-size:14px;color:${COLORS.ink};text-align:center;">
            ${times.map((t) => `<span style="display:inline-block;margin:0 12px;font-weight:600;color:${COLORS.greenDark};">${escapeHtml(t)}</span>`).join("")}
          </td></tr>
        </table>
      ` : ""}

      <h2 style="font-family:Georgia,serif;font-size:17px;color:${COLORS.greenDark};margin:0 0 10px;font-weight:500;">Próximo paso</h2>
      <p style="color:${COLORS.inkSoft};font-size:14px;line-height:1.6;margin:0 0 18px;">
        En las próximas horas hábiles recibirás por email <strong>el certificado de difusión</strong>
        (con firma y timbre) y la <strong>factura electrónica</strong> a los datos que indicaste.
        Con eso podrás presentar el trámite ante la autoridad correspondiente (DGA, SEIA, etc.).
      </p>

      <div style="background:rgba(78,165,82,0.06);border:1px solid rgba(78,165,82,0.25);border-radius:8px;padding:14px 18px;">
        <p style="color:${COLORS.inkSoft};font-size:13px;line-height:1.55;margin:0;">
          ¿Necesitas el certificado urgente? Escríbenos a
          <a href="mailto:${escapeHtml(supportEmail)}" style="color:${COLORS.greenDark};">${escapeHtml(supportEmail)}</a>
          mencionando ${escapeHtml(order.order_number)} y lo coordinamos.
        </p>
      </div>
    </td></tr>
  `, { settings, footerNote: "" });

  const text = [
    `Tu aviso fue difundido — Orden ${order.order_number}`,
    ``,
    `Confirmamos que tu aviso fue transmitido hoy ${broadcastDate} por Radio La Frontera AM 1110.`,
    times.length > 0 ? `Horarios: ${times.join(" · ")}` : "",
    ``,
    `PRÓXIMO PASO: en las próximas horas hábiles recibirás el certificado de difusión y la factura electrónica.`,
    ``,
    `Urgente: ${supportEmail} (menciona el N° ${order.order_number}).`,
  ].filter(Boolean).join("\n");

  return { subject, html, text };
}

/* ────────────────────────────────────────────────────────────────────────────
 * 5) Email al CLIENTE — orden cancelada
 * ──────────────────────────────────────────────────────────────────────────── */

export function orderCancelledEmail({ order, settings }) {
  const supportEmail = getStr(settings, "radio_email_secretary", "secretaria.araucana@gmail.com");
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
