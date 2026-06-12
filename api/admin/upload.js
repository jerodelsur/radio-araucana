// Admin endpoint: uploads a single image to the public Blob store.
// Auth: Authorization: Bearer <ADMIN_PASSWORD>
// Body: raw image bytes (Content-Type set by client: image/jpeg, image/png, etc.)
// Query: filename=<original-name.ext> (sanitized server-side)
//
// Returns: { url: "https://...blob.vercel-storage.com/..." }

import { put } from "@vercel/blob";

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export const config = {
  runtime: "nodejs",
  api: {
    bodyParser: false, // we read raw bytes ourselves
  },
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
  // Solo aceptamos la contraseña vía header Authorization. El querystring queda
  // expuesto en logs de servidor/CDN, historial y cabeceras Referer, así que ya
  // no se admite ?password=.
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token === expected;
}

function sanitizeFilename(name) {
  if (!name || typeof name !== "string") return `upload-${Date.now()}.bin`;
  // strip path segments, normalize, only allow [a-z0-9._-]
  const base = name.split(/[\\/]/).pop() ?? "";
  const cleaned = base
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
  if (!cleaned || cleaned === "." || cleaned === "..") return `upload-${Date.now()}.bin`;
  return cleaned;
}

async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BYTES) throw new Error("Image too large (max 5MB)");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST" && req.method !== "PUT") {
    res.setHeader("Allow", "POST, PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!authOk(req)) return unauthorized(res);

  const contentType = (req.headers["content-type"] || "").split(";")[0].trim();
  if (!ALLOWED_MIME.has(contentType)) {
    return badRequest(res, `Unsupported content type: ${contentType}`);
  }

  const url = new URL(req.url, "http://localhost");
  const filename = sanitizeFilename(url.searchParams.get("filename"));

  let bytes;
  try {
    bytes = await readBody(req);
  } catch (err) {
    return badRequest(res, err?.message ?? "Failed to read body");
  }

  if (bytes.length === 0) return badRequest(res, "Empty body");

  try {
    const result = await put(`uploads/${Date.now()}-${filename}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return res.status(200).json({ url: result.url, pathname: result.pathname });
  } catch (err) {
    console.error("[/api/admin/upload] blob write failed:", err);
    return res.status(500).json({ error: "Failed to upload" });
  }
}
