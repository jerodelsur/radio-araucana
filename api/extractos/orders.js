// POST /api/extractos/orders
// Crea una orden en estado `pending_payment` a partir de la cotización
// del cliente. Recalcula precio y fecha de difusión server-side (autoritativo).
// Si Supabase aún no está configurado, devuelve 503 con instrucción clara
// para el cliente: la página la captura y muestra fallback "escríbenos".
//
// El siguiente paso (cuando llegue Flow sandbox) es: tras crear la orden,
// pedir un token de pago a Flow y devolver la URL de redirect.

import { createOrderInputSchema } from "./_lib/order-schema.js";
import { getSupabaseAdmin, isSupabaseConfigured } from "./_lib/supabase.js";
import { calculatePriceCLP, DEFAULT_TARIFF } from "../../src/extractos/lib/pricing.js";
import { resolveBroadcastDate } from "../../src/extractos/lib/broadcast-date.js";

export const config = { runtime: "nodejs" };

const SUPPORT_EMAIL = "secretaria.araucana@gmail.com";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Body parse defensivo (Vercel parsea JSON automáticamente cuando el header
  // viene correcto, pero en local dev puede no ser así).
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

  // Recalcular pricing y fecha (no confiamos en lo que mande el cliente).
  const tariff = await fetchTariff();
  const lineCount = countLinesEstimate(input.extractText);
  const amountCLP = calculatePriceCLP(lineCount, tariff);
  const resolved = resolveBroadcastDate(input.publicationDay, input.publicationMonth);

  if (resolved.resolvedDate.getTime() < Date.now() - 24 * 3600 * 1000) {
    return res.status(400).json({
      error: "publication_date_in_past",
      message: "La fecha resuelta de difusión es anterior a hoy. Selecciona un mes futuro.",
    });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({
      error: "system_not_configured",
      message:
        "Estamos terminando de configurar el sistema. Por ahora envía tu extracto a " +
        `${SUPPORT_EMAIL} y te respondemos con la cotización en el día.`,
    });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("orders")
    .insert({
      client_name: input.clientName,
      client_rut: input.clientRUT,
      client_email: input.clientEmail,
      client_phone: input.clientPhone,
      client_organization: input.clientOrganization || null,
      client_gender: input.gender,
      extract_text: input.extractText,
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
    })
    .select("order_number, amount_clp, resolved_publication_date")
    .single();

  if (error) {
    console.error("[/api/extractos/orders] insert error:", error);
    return res.status(500).json({ error: "db_error", message: "No pudimos guardar tu orden. Intenta de nuevo o escríbenos a " + SUPPORT_EMAIL });
  }

  // TODO Fase 1 (Flow sandbox): crear el pago Flow acá y devolver redirect URL.
  return res.status(200).json({
    orderNumber: data.order_number,
    amountCLP: data.amount_clp,
    resolvedPublicationDate: data.resolved_publication_date,
    paymentRedirectUrl: null,
  });
}

async function fetchTariff() {
  if (!isSupabaseConfigured()) return DEFAULT_TARIFF;
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("settings").select("value").eq("key", "tariff_table").maybeSingle();
    if (data?.value && typeof data.value === "object") {
      return {
        minLinesFlat: Number(data.value.minLinesFlat) || DEFAULT_TARIFF.minLinesFlat,
        minPrice: Number(data.value.minPrice) || DEFAULT_TARIFF.minPrice,
        baseAboveMin: Number(data.value.baseAboveMin) || DEFAULT_TARIFF.baseAboveMin,
        perLineAboveMin: Number(data.value.perLineAboveMin) || DEFAULT_TARIFF.perLineAboveMin,
      };
    }
  } catch (err) {
    console.warn("[/api/extractos/orders] fallback a tarifario hardcoded:", err?.message ?? err);
  }
  return DEFAULT_TARIFF;
}

// El meter visual del cliente usa DOM. Server-side estimamos líneas con un
// heurístico tipográfico simple basado en ancho de carácter promedio en BOS 12.
// La operadora puede ajustar el conteo desde el dashboard si difiere.
const AVG_CHARS_PER_LINE = 78; // calibrado para BOS 12 @ 16cm
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
