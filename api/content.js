// Public endpoint: returns the editable site content as JSON.
// Reads from Vercel Blob; falls back to the bundled defaults if the
// Blob hasn't been seeded yet (first-run, before the editor saves once).

import { list } from "@vercel/blob";
import defaultContent from "../src/content/site.json" with { type: "json" };

const BLOB_KEY = "site-content.json";

export const config = {
  runtime: "nodejs",
};

// Cachear la URL pública del blob en memoria del lambda. Sólo el primer
// request tras un cold start hace `list()` (advanced op); los warm hits
// reutilizan la URL y van directo al fetch del CDN (simple op).
let cachedBlobUrl = null;

export default async function handler(req, res) {
  // CDN cache de 60s con stale-while-revalidate: la mayoría de los page
  // loads se sirven desde el edge sin invocar esta función. Edits en /admin
  // tardan hasta ~60s en propagarse (antes era inmediato), trade-off
  // necesario para no quemar la cuota de "Advanced Operations" de Hobby
  // (2k/mes — el `list()` en cada page load llegaba a 3k+).
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
      // URL pudo haber cambiado (improbable con addRandomSuffix:false, pero
      // por seguridad invalidamos para que el próximo request re-liste).
      cachedBlobUrl = null;
    }
  } catch (err) {
    cachedBlobUrl = null;
    console.error("[/api/content] blob read failed:", err?.message ?? err);
  }

  return res.status(200).json(defaultContent);
}
