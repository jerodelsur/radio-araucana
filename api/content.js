// Public endpoint: returns the editable site content as JSON.
// Reads from Vercel Blob; falls back to the bundled defaults if the
// Blob hasn't been seeded yet (first-run, before the editor saves once).

import { list } from "@vercel/blob";
import defaultContent from "../src/content/site.json" with { type: "json" };

const BLOB_KEY = "site-content.json";

export const config = {
  runtime: "nodejs",
};

export default async function handler(req, res) {
  // No caching: edits in /admin must show up on the next page load.
  // The traffic is low enough that hitting this function on every page
  // load fits comfortably in the Hobby plan's invocation quota.
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
    // Swallow: fall back to bundled defaults so the site never goes blank
    console.error("[/api/content] blob read failed:", err?.message ?? err);
  }

  return res.status(200).json(defaultContent);
}
