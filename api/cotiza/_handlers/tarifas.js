// GET: catálogo público de tarifas para el cotizador de Radio Araucana.
// Lee desde Vercel Blob (cotiza-tarifas.json) con fallback al JSON bundled.

import { list } from "@vercel/blob";
import defaultTarifas from "../../../src/content/cotiza-tarifas.json" with { type: "json" };

const BLOB_KEY = "cotiza-tarifas.json";

export const config = { runtime: "nodejs" };

// Mismo patrón que api/content.js: cachear la URL pública del blob en memoria
// del lambda para que sólo el primer request tras un cold start haga `list()`
// (advanced op del Blob — fue lo que agotó la cuota en mayo); los warm hits
// van directo al fetch. El CDN absorbe el resto con s-maxage.
let cachedBlobUrl = null;

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Ediciones de tarifas desde el admin tardan hasta ~60s en propagarse.
  res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=600"
  );

  try {
    if (!cachedBlobUrl) {
      const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
      const target = blobs.find((b) => b.pathname === BLOB_KEY);
      if (target) cachedBlobUrl = target.url;
    }

    if (cachedBlobUrl) {
      const fetched = await fetch(cachedBlobUrl, { cache: "no-store" });
      if (fetched.ok) {
        const data = await fetched.json();
        return res.status(200).json(data);
      }
      cachedBlobUrl = null;
    }
  } catch (err) {
    cachedBlobUrl = null;
    console.error("[/api/cotiza/tarifas] blob read failed:", err?.message ?? err);
  }

  return res.status(200).json(defaultTarifas);
}
