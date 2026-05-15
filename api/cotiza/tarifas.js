// GET: catálogo público de tarifas para el cotizador de Radio Araucana.
// Lee desde Vercel Blob (cotiza-tarifas.json) con fallback al JSON bundled.

import { list } from "@vercel/blob";
import defaultTarifas from "../../src/content/cotiza-tarifas.json" with { type: "json" };

const BLOB_KEY = "cotiza-tarifas.json";

export const config = { runtime: "nodejs" };

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store, max-age=0, must-revalidate");

  try {
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    const target = blobs.find((b) => b.pathname === BLOB_KEY);
    if (target) {
      const fetched = await fetch(target.url, { cache: "no-store" });
      if (fetched.ok) {
        const data = await fetched.json();
        return res.status(200).json(data);
      }
    }
  } catch (err) {
    console.error("[/api/cotiza/tarifas] blob read failed:", err?.message ?? err);
  }

  return res.status(200).json(defaultTarifas);
}
