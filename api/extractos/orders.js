// POST /api/extractos/orders
//
// Crea una orden en estado `pending_payment` a partir de la cotización
// del cliente. Recalcula precio y fecha de difusión server-side (autoritativo).
//
// Beta: la confirmación de pago es manual (transferencia + factura). Tras crear
// la orden enviamos:
//   1) Email al cliente con datos de transferencia y N° de orden.
//   2) Email a Bertha con todos los datos para que pueda procesar.
//
// Si Supabase no está configurado, devolvemos 503 con instrucción "escríbenos".
// Si Gmail SMTP no está configurado, la orden se crea igual y solo logueamos.

import { createOrderInputSchema } from "./_lib/order-schema.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_lib/supabase.js";
import { sendEmail, isMailerConfigured, adminRecipients } from "./_lib/mailer.js";
import { clientOrderEmail, adminOrderNotificationEmail } from "./_lib/email-templates.js";
import { calculatePriceCLP, exceedsMaxLines, DEFAULT_TARIFF } from "../../src/extractos/lib/pricing.js";
import { withMandatoryTitle } from "../../src/extractos/lib/extract-text.js";
import { resolveBroadcastDate } from "../../src/extractos/lib/broadcast-date.js";

export const config = { runtime: "nodejs" };

const SUPPORT_EMAIL = "secretaria.araucana@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid_json" }); }
  }

  const parsed = createOrderInputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      error: "validation_failed",
      issues: parsed.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  const input = parsed.data;

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "system_not_configured",
      message:
        "Estamos terminando de configurar el sistema. Por ahora envía tu extracto a " +
        `${SUPPORT_EMAIL} y te respondemos con la cotización en el día.`,
    });
  }

  // Recalcular pricing y fecha (server-side autoritativo).
  const supabase = getSupabaseAdmin();
  const settings = await fetchSettings(supabase);
  const tariff = settingsTariff(settings);
  // Aseguramos la línea de título "EXTRACTOS" arriba — siempre se difunde así.
  const finalText = withMandatoryTitle(input.extractText);
  const lineCount = countLinesEstimate(finalText);
  if (exceedsMaxLines(lineCount, tariff)) {
    return res.status(400).json({
      error: "extract_too_long",
      message:
        `Para extractos que superan las ${tariff.maxLines} líneas hay que escribir directamente a ` +
        "administracion@araucanayfrontera.cl — se cotiza como cápsula, no como extracto.",
    });
  }
  const amountCLP = calculatePriceCLP(lineCount, tariff);
  const resolved = resolveBroadcastDate(input.publicationDay, input.publicationMonth);

  if (resolved.resolvedDate.getTime() < Date.now() - 24 * 3600 * 1000) {
    return res.status(400).json({
      error: "publication_date_in_past",
      message: "La fecha resuelta de difusión es anterior a hoy. Selecciona un mes futuro.",
    });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      client_name: input.clientName,
      client_rut: input.clientRUT,
      client_email: input.clientEmail,
      client_phone: input.clientPhone,
      client_organization: input.clientOrganization || null,
      client_gender: input.gender,
      extract_text: finalText,
      line_count: lineCount,
      amount_clp: amountCLP,
      procedure_type: input.procedureType,
      comuna: input.comuna,
      provincia: input.provincia,
      region: input.region,
      publication_day: input.publicationDay,
      publication_month: input.publicationMonth,
      resolved_publication_date: toIsoDate(resolved.resolvedDate),
      status: "pending_payment",
      requires_invoice: true,
      billing_legal_name: input.billingLegalName,
      billing_rut: input.billingRUT,
      billing_address: input.billingAddress,
      billing_giro: input.billingGiro,
      billing_email: input.billingEmail,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[/api/extractos/orders] insert error:", error);
    return res.status(500).json({
      error: "db_error",
      message: "No pudimos guardar tu orden. Intenta de nuevo o escríbenos a " + SUPPORT_EMAIL,
    });
  }

  // Disparar emails en paralelo. Errores se loguean pero no rompen la respuesta:
  // la orden ya está creada y la operadora puede recuperarla desde el dashboard.
  const baseUrl = req.headers["x-forwarded-host"]
    ? `https://${req.headers["x-forwarded-host"]}`
    : req.headers.host
      ? `https://${req.headers.host}`
      : "https://radioaraucana.cl";
  const dashboardUrl = `${baseUrl}/frontera/extractos/admin/orden/${encodeURIComponent(order.order_number)}`;

  if (isMailerConfigured()) {
    const clientMsg = clientOrderEmail({ order, settings });
    const adminMsg = adminOrderNotificationEmail({ order, settings, dashboardUrl });

    const [clientResult, adminResult] = await Promise.allSettled([
      sendEmail({
        to: order.client_email,
        subject: clientMsg.subject,
        html: clientMsg.html,
        text: clientMsg.text,
        replyTo: process.env.GMAIL_USER || SUPPORT_EMAIL,
      }),
      sendEmail({
        to: adminRecipients(),
        subject: adminMsg.subject,
        html: adminMsg.html,
        text: adminMsg.text,
        replyTo: order.client_email,
      }),
    ]);

    if (clientResult.status === "rejected" || (clientResult.value && !clientResult.value.ok)) {
      console.warn("[/api/extractos/orders] email cliente falló:", clientResult);
    }
    if (adminResult.status === "rejected" || (adminResult.value && !adminResult.value.ok)) {
      console.warn("[/api/extractos/orders] email admin falló:", adminResult);
    }
  } else {
    console.warn("[/api/extractos/orders] mailer no configurado — orden creada sin enviar emails:", order.order_number);
  }

  return res.status(200).json({
    orderNumber: order.order_number,
    amountCLP: order.amount_clp,
    resolvedPublicationDate: order.resolved_publication_date,
    paymentRedirectUrl: null,
  });
}

async function fetchSettings(supabase) {
  try {
    const { data } = await supabase.from("settings").select("key, value");
    if (!data) return {};
    const out = {};
    for (const row of data) {
      out[row.key] = row.value;
    }
    return out;
  } catch (err) {
    console.warn("[/api/extractos/orders] no pudimos leer settings:", err?.message ?? err);
    return {};
  }
}

function settingsTariff(settings) {
  const t = settings?.tariff_table;
  if (t && typeof t === "object") {
    return {
      minLinesFlat: Number(t.minLinesFlat) || DEFAULT_TARIFF.minLinesFlat,
      minPrice: Number(t.minPrice) || DEFAULT_TARIFF.minPrice,
      baseAboveMin: Number(t.baseAboveMin) || DEFAULT_TARIFF.baseAboveMin,
      perLineAboveMin: Number(t.perLineAboveMin) || DEFAULT_TARIFF.perLineAboveMin,
      maxLines: Number(t.maxLines) || DEFAULT_TARIFF.maxLines,
    };
  }
  return DEFAULT_TARIFF;
}

const AVG_CHARS_PER_LINE = 78;
function countLinesEstimate(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  let total = 0;
  for (const ln of lines) {
    if (!ln.length) { total += 1; continue; }
    total += Math.max(1, Math.ceil(ln.length / AVG_CHARS_PER_LINE));
  }
  return total;
}

function toIsoDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
