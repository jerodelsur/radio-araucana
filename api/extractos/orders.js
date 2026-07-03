// POST /api/extractos/orders
//
// Crea una orden (bundle) en estado `pending_payment` a partir de la cotización
// del cliente. Una cotización agrupa 1..20 extractos. Cada extracto vive en
// `order_extracts` con su propia fecha, comuna, monto y estado de difusión.
// La orden bundle lleva cliente, facturación, total y estado de pago.
//
// Recalcula precio y fecha de difusión server-side (autoritativo).
//
// Beta: la confirmación de pago es manual (transferencia + factura). Tras crear
// la orden enviamos:
//   1) Email al cliente con datos de transferencia y N° de orden.
//   2) Email a Bertha con todos los datos para que pueda procesar.
//
// Si Supabase no está configurado, devolvemos 503 con instrucción "escríbenos".
// Si Gmail SMTP no está configurado, la orden se crea igual y solo logueamos.

import { createOrderInputSchema } from "./_lib/order-schema.js";
import { rateLimit, tooManyRequests } from "../_lib/security.js";
import { getSupabaseAdmin, isSupabaseConfigured, isSupabaseUnreachable } from "./_lib/supabase.js";
import { sendEmail, isMailerConfigured, adminRecipients } from "./_lib/mailer.js";
import { clientOrderEmail, adminOrderNotificationEmail } from "./_lib/email-templates.js";
import { calculatePriceCLP, exceedsMaxLines, DEFAULT_TARIFF } from "../../src/extractos/lib/pricing.js";
import { withMandatoryTitle } from "../../src/extractos/lib/extract-text.js";
import { resolveBroadcastDate } from "../../src/extractos/lib/broadcast-date.js";

export const config = { runtime: "nodejs" };

const SUPPORT_EMAIL = "extractos@araucanayfrontera.cl";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Formulario público: 5 envíos/min por IP frena spam y abuso del mailer.
  if (!rateLimit(req, { key: "extractos-orders", limit: 5 })) return tooManyRequests(res);

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

  // Recalcular pricing y fechas (server-side autoritativo) por cada extracto.
  const supabase = getSupabaseAdmin();
  const settings = await fetchSettings(supabase);
  const tariff = settingsTariff(settings);

  /** @type {Array<{
   *   index: number, finalText: string, lineCount: number, amountCLP: number,
   *   procedureType: string, comuna: string, provincia: string, region: string,
   *   publicationDay: 1|15, publicationMonth: string, resolvedDateIso: string,
   * }>} */
  const computedExtracts = [];
  const nowMinus24h = Date.now() - 24 * 3600 * 1000;

  for (let i = 0; i < input.extracts.length; i++) {
    const ex = input.extracts[i];
    const finalText = withMandatoryTitle(ex.extractText);
    const lineCount = countLinesEstimate(finalText);
    if (exceedsMaxLines(lineCount, tariff)) {
      return res.status(400).json({
        error: "extract_too_long",
        message:
          `El extracto #${i + 1} supera las ${tariff.maxLines} líneas. Para extractos largos hay que ` +
          "escribir directamente a extractos@araucanayfrontera.cl — se cotiza como cápsula.",
      });
    }
    const amountCLP = calculatePriceCLP(lineCount, tariff);
    const resolved = resolveBroadcastDate(ex.publicationDay, ex.publicationMonth);
    if (resolved.resolvedDate.getTime() < nowMinus24h) {
      return res.status(400).json({
        error: "publication_date_in_past",
        message: `La fecha de difusión del extracto #${i + 1} es anterior a hoy. Selecciona un mes futuro.`,
      });
    }
    computedExtracts.push({
      index: i + 1,
      finalText,
      lineCount,
      amountCLP,
      procedureType: ex.procedureType,
      comuna: ex.comuna,
      provincia: ex.provincia,
      region: ex.region,
      publicationDay: ex.publicationDay,
      publicationMonth: ex.publicationMonth,
      resolvedDateIso: toIsoDate(resolved.resolvedDate),
    });
  }

  const totalCLP = computedExtracts.reduce((s, e) => s + e.amountCLP, 0);
  const first = computedExtracts[0];

  // Insertamos la orden bundle. Las columnas legacy (extract_text, comuna, etc)
  // se llenan con los datos del primer extracto para back-compat.
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      client_name: input.clientName,
      client_rut: input.clientRUT,
      client_email: input.clientEmail,
      client_phone: input.clientPhone,
      client_organization: input.clientOrganization || null,
      client_gender: input.gender,
      // Total del bundle.
      amount_clp: totalCLP,
      // Snapshot legacy del primer extracto (la tabla order_extracts es la fuente de verdad).
      extract_text: first.finalText,
      line_count: first.lineCount,
      procedure_type: first.procedureType,
      comuna: first.comuna,
      provincia: first.provincia,
      region: first.region,
      publication_day: first.publicationDay,
      publication_month: first.publicationMonth,
      resolved_publication_date: first.resolvedDateIso,
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
    console.error("[/api/extractos/orders] insert order error:", error);
    return respondOrderNotSaved(res, error, input, computedExtracts, totalCLP);
  }

  // Insertamos los N extractos hijos. Si alguno falla, borramos la orden y devolvemos error.
  const extractRows = computedExtracts.map((e) => ({
    order_id: order.id,
    extract_index: e.index,
    extract_text: e.finalText,
    line_count: e.lineCount,
    amount_clp: e.amountCLP,
    procedure_type: e.procedureType,
    comuna: e.comuna,
    provincia: e.provincia,
    region: e.region,
    publication_day: e.publicationDay,
    publication_month: e.publicationMonth,
    resolved_publication_date: e.resolvedDateIso,
    status: "scheduled",
  }));
  const { data: insertedExtracts, error: exErr } = await supabase
    .from("order_extracts")
    .insert(extractRows)
    .select("*")
    .order("extract_index", { ascending: true });

  if (exErr || !insertedExtracts) {
    console.error("[/api/extractos/orders] insert extracts error:", exErr);
    // Cleanup: borrar la orden bundle (cascade borra extractos si quedaron parciales).
    const { error: delErr } = await supabase.from("orders").delete().eq("id", order.id);
    if (delErr) {
      console.error(
        `[/api/extractos/orders] cleanup falló — orden ${order.id} (${order.order_number}) queda pending_payment sin extractos:`,
        delErr.message
      );
    }
    return respondOrderNotSaved(res, exErr, input, computedExtracts, totalCLP);
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
    const clientMsg = clientOrderEmail({ order, extracts: insertedExtracts, settings });
    const adminMsg = adminOrderNotificationEmail({ order, extracts: insertedExtracts, settings, dashboardUrl });

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
    extractCount: insertedExtracts.length,
    paymentRedirectUrl: null,
  });
}

// La BD no guardó la orden (proyecto pausado, red caída, etc.). Antes de
// rendirnos, rescatamos el lead: el mailer (SMTP) es independiente de
// Supabase, así que mandamos al equipo todos los datos ya calculados para
// procesar a mano. El cliente recibe un mensaje honesto según si el rescate
// funcionó o no.
async function respondOrderNotSaved(res, dbError, input, computedExtracts, totalCLP) {
  let rescued = false;
  if (isMailerConfigured()) {
    try {
      const fmtCLP = (n) => Number(n || 0).toLocaleString("es-CL");
      const lines = [
        "ORDEN NO PERSISTIDA — la base de datos no estaba disponible al momento del envío.",
        "Estos son todos los datos recalculados server-side para procesarla a mano:",
        "",
        `Cliente: ${input.clientName} (${input.clientRUT})`,
        `Email: ${input.clientEmail} · Fono: ${input.clientPhone}`,
        input.clientOrganization ? `Organización: ${input.clientOrganization}` : null,
        `Facturación: ${input.billingLegalName} · RUT ${input.billingRUT} · Giro: ${input.billingGiro}`,
        `Dirección: ${input.billingAddress} · Email facturación: ${input.billingEmail}`,
        `TOTAL: $${fmtCLP(totalCLP)} CLP · ${computedExtracts.length} extracto(s)`,
        "",
        ...computedExtracts.flatMap((e) => [
          `— Extracto #${e.index} · ${e.procedureType} · ${e.comuna}, ${e.provincia} (${e.region})`,
          `  Difusión: día ${e.publicationDay} de ${e.publicationMonth} (${e.resolvedDateIso}) · ${e.lineCount} líneas · $${fmtCLP(e.amountCLP)}`,
          e.finalText,
          "",
        ]),
        `Error técnico: ${dbError?.message || dbError}`,
      ].filter((l) => l !== null);

      const result = await sendEmail({
        to: adminRecipients(),
        subject: `⚠️ Orden NO guardada (BD no disponible) — ${input.clientName}`,
        text: lines.join("\n"),
        replyTo: input.clientEmail,
      });
      rescued = Boolean(result?.ok);
    } catch (err) {
      console.error("[/api/extractos/orders] rescate por email también falló:", err?.message ?? err);
    }
  }

  return res.status(isSupabaseUnreachable(dbError) ? 503 : 500).json({
    error: "db_error",
    message: rescued
      ? "Nuestro sistema de órdenes está temporalmente fuera de servicio, pero tus datos sí llegaron " +
        "al equipo por correo y te contactaremos con la cotización. Si prefieres, escríbenos directo a " +
        SUPPORT_EMAIL + "."
      : "Nuestro sistema de órdenes está temporalmente fuera de servicio. Envía tu extracto a " +
        SUPPORT_EMAIL + " y te respondemos con la cotización en el día.",
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
