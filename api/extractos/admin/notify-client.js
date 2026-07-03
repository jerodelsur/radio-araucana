// POST /api/extractos/admin/notify-client
//
// Disparado por el admin panel después de marcar una orden como pagada o
// cancelada. Verifica que el caller esté autenticado y tenga fila en
// public.admin_users, lee la orden y los settings, y envía el email
// correspondiente al cliente.
//
// Body: { orderNumber: string, eventType: "payment_confirmed" | "cancelled" }
// Auth: header `Authorization: Bearer <jwt>` del admin (Supabase auth).
//
// Nota (Bertha, 2026-05-15): el evento "broadcast_complete" no manda email
// — el cliente recibe directamente el certificado + factura que envía la
// operadora luego de difundir.

import { getSupabaseAdmin, isSupabaseConfigured, isSupabaseUnreachable } from "../_lib/supabase.js";
import { sendEmail, isMailerConfigured } from "../_lib/mailer.js";
import {
  paymentConfirmedEmail,
  orderCancelledEmail,
} from "../_lib/email-templates.js";

export const config = { runtime: "nodejs" };

const ALLOWED_EVENTS = new Set(["payment_confirmed", "cancelled"]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "method_not_allowed" });
  }

  // Body parse
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "invalid_json" }); }
  }
  const orderNumber = String(body?.orderNumber || "").trim();
  const eventType = String(body?.eventType || "").trim();

  if (!orderNumber || !ALLOWED_EVENTS.has(eventType)) {
    return res.status(400).json({ error: "invalid_payload", message: "orderNumber y eventType son requeridos" });
  }

  if (!isSupabaseConfigured()) {
    return res.status(503).json({ error: "system_not_configured" });
  }

  // Verificar JWT del admin
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  const token = String(authHeader).replace(/^Bearer\s+/i, "").trim();
  if (!token) {
    return res.status(401).json({ error: "no_token" });
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    // Fallo de red ≠ token inválido: con la BD caída, un 401 manda a la
    // operadora a revisar su clave cuando el problema es el servicio.
    if (isSupabaseUnreachable(authError)) {
      return res.status(503).json({
        error: "auth_unavailable",
        message: "La base de datos no está disponible en este momento. Espera unos minutos y reintenta.",
      });
    }
    return res.status(401).json({ error: "invalid_token" });
  }

  // Verificar que es admin/operator
  const { data: adminRow, error: adminErr } = await supabase
    .from("admin_users")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();
  if (adminErr || !adminRow) {
    if (isSupabaseUnreachable(adminErr)) {
      return res.status(503).json({
        error: "auth_unavailable",
        message: "La base de datos no está disponible en este momento. Espera unos minutos y reintenta.",
      });
    }
    return res.status(403).json({ error: "not_admin" });
  }

  // Cargar orden completa
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (orderErr || !order) {
    return res.status(404).json({ error: "order_not_found", message: orderErr?.message });
  }

  // Cargar extractos del bundle (orden con 1..20 extractos).
  const { data: extracts } = await supabase
    .from("order_extracts")
    .select("*")
    .eq("order_id", order.id)
    .order("extract_index", { ascending: true });

  // Cargar settings
  const settings = await fetchSettings(supabase);

  // Construir email según evento
  let msg;
  switch (eventType) {
    case "payment_confirmed":
      msg = paymentConfirmedEmail({ order, extracts: extracts || [], settings });
      break;
    case "cancelled":
      msg = orderCancelledEmail({ order, settings });
      break;
  }

  if (!isMailerConfigured()) {
    console.warn("[notify-client] mailer no configurado, no se envía email para", orderNumber, eventType);
    return res.status(200).json({ ok: false, sent: false, reason: "mailer_not_configured" });
  }

  const result = await sendEmail({
    to: order.client_email,
    subject: msg.subject,
    html: msg.html,
    text: msg.text,
    replyTo: process.env.GMAIL_USER || process.env.EMAIL_FROM,
  });

  if (!result.ok) {
    console.warn("[notify-client] error enviando email", orderNumber, eventType, result.error);
    return res.status(200).json({ ok: false, sent: false, reason: result.error });
  }

  return res.status(200).json({ ok: true, sent: true, messageId: result.messageId });
}

async function fetchSettings(supabase) {
  try {
    const { data } = await supabase.from("settings").select("key, value");
    if (!data) return {};
    const out = {};
    for (const row of data) out[row.key] = row.value;
    return out;
  } catch (err) {
    console.warn("[notify-client] error leyendo settings:", err?.message);
    return {};
  }
}
