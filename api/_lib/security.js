// Helpers de seguridad compartidos por los endpoints de /api.
//
// rateLimit: limitador en memoria por instancia de lambda. En serverless cada
// instancia tiene su propio Map (un cold start resetea el contador), así que
// esto NO es un límite global exacto — pero las ráfagas de un mismo cliente
// caen casi siempre en la misma instancia warm, y para frenar fuerza bruta y
// spam de formularios eso basta. Límite global real requeriría un store
// externo (KV/Upstash); no lo necesitamos todavía.

import { createHash, timingSafeEqual } from "node:crypto";

const buckets = new Map();

export function clientIp(req) {
  const fwd = String(req.headers["x-forwarded-for"] || "");
  return fwd.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

export function rateLimit(req, { key = "global", limit = 5, windowMs = 60_000 } = {}) {
  const k = `${key}:${clientIp(req)}`;
  const now = Date.now();
  let bucket = buckets.get(k);
  if (!bucket || now - bucket.start >= windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(k, bucket);
  }
  bucket.count += 1;
  if (buckets.size > 5000) {
    for (const [bk, bv] of buckets) {
      if (now - bv.start >= windowMs) buckets.delete(bk);
    }
  }
  return bucket.count <= limit;
}

export function tooManyRequests(res) {
  res.setHeader("Retry-After", "60");
  return res.status(429).json({ error: "too_many_requests" });
}

// Comparación de secretos en tiempo constante. Se comparan los SHA-256 de
// ambos valores para que ni el largo del password se filtre por timing.
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || !a || !b) return false;
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}
