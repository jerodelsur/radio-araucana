// Admin endpoint: writes the full site-content.json blob.
// Auth: Authorization: Bearer <ADMIN_PASSWORD>
// Body: the full content JSON (must match the shape of src/content/site.json)

import { put } from "@vercel/blob";
import { rateLimit, tooManyRequests, safeEqual } from "../_lib/security.js";

const BLOB_KEY = "site-content.json";

// Top-level keys we accept. Anything else gets dropped, so a compromised
// editor can't sneak in extra fields the renderer might trip on.
const ALLOWED_KEYS = new Set([
  "settings",
  "news",
  "videos",
  "programs",
  "regions",
  "whatsappOptions",
  "frontera",
]);

const REQUIRED_SETTINGS = [
  "streamAraucana",
  "streamFrontera",
  "whatsappNumber",
  "address",
  "contactEmail",
  "adminEmail",
  "adminPhone",
  "adminHours",
];

export const config = {
  runtime: "nodejs",
};

function unauthorized(res) {
  return res.status(401).json({ error: "Unauthorized" });
}

function badRequest(res, message) {
  return res.status(400).json({ error: message });
}

function authOk(req) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && safeEqual(token, expected);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // 20/min por IP alcanza de sobra para uso normal del editor y frena
  // fuerza bruta contra el Bearer.
  if (!rateLimit(req, { key: "admin", limit: 20 })) return tooManyRequests(res);
  if (!authOk(req)) return unauthorized(res);

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return badRequest(res, "Body must be an object");
  }

  // Whitelist top-level keys
  const clean = {};
  for (const key of ALLOWED_KEYS) {
    if (key in body) clean[key] = body[key];
  }

  // Validate settings shape (the only required block)
  if (!clean.settings || typeof clean.settings !== "object") {
    return badRequest(res, "Missing settings block");
  }
  for (const f of REQUIRED_SETTINGS) {
    const val = clean.settings[f];
    if (typeof val !== "string" || val.trim().length === 0) {
      return badRequest(res, `settings.${f} is required`);
    }
  }

  // Arrays must be arrays (when present)
  for (const arr of ["news", "videos", "programs", "regions", "whatsappOptions"]) {
    if (arr in clean && !Array.isArray(clean[arr])) {
      return badRequest(res, `${arr} must be an array`);
    }
  }

  try {
    const json = JSON.stringify(clean, null, 2);
    const result = await put(BLOB_KEY, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return res.status(200).json({ ok: true, url: result.url, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error("[/api/admin/save] blob write failed:", err);
    return res.status(500).json({ error: "Failed to save" });
  }
}
