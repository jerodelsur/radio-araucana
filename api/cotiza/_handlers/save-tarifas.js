// POST: guarda el catálogo de tarifas en Vercel Blob.
// Auth: Authorization: Bearer <ADMIN_PASSWORD>
// Body: el JSON completo de tarifas (mismo shape que src/content/cotiza-tarifas.json)

import { put } from "@vercel/blob";
import { authOk } from "../_lib/auth.js";

const BLOB_KEY = "cotiza-tarifas.json";

export const config = { runtime: "nodejs" };

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n) && n >= 0;
}

function validar(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Body must be an object";
  }
  if (!isFiniteNumber(body.iva) || body.iva < 0 || body.iva > 1) {
    return "iva must be a number between 0 and 1";
  }
  if (!Array.isArray(body.formatos) || body.formatos.length === 0) {
    return "formatos must be a non-empty array";
  }
  for (const [i, f] of body.formatos.entries()) {
    if (!f.id || !f.titulo) return `formatos[${i}]: id y titulo son requeridos`;
    if (f.horarios) {
      if (!Array.isArray(f.horarios) || f.horarios.length === 0) {
        return `formatos[${i}].horarios debe ser arreglo no vacío`;
      }
      for (const [j, h] of f.horarios.entries()) {
        if (!Array.isArray(h.packs) || h.packs.length === 0) {
          return `formatos[${i}].horarios[${j}].packs vacío`;
        }
        for (const [k, p] of h.packs.entries()) {
          if (!isFiniteNumber(p.precioUnitario)) {
            return `formatos[${i}].horarios[${j}].packs[${k}].precioUnitario inválido`;
          }
          if (!isFiniteNumber(p.frases)) {
            return `formatos[${i}].horarios[${j}].packs[${k}].frases inválido`;
          }
        }
      }
    } else if (f.unidades) {
      if (!Array.isArray(f.unidades) || f.unidades.length === 0) {
        return `formatos[${i}].unidades debe ser arreglo no vacío`;
      }
      for (const [j, u] of f.unidades.entries()) {
        if (!isFiniteNumber(u.precio)) {
          return `formatos[${i}].unidades[${j}].precio inválido`;
        }
      }
      if (f.permiteDespacho && (!isFiniteNumber(f.recargoDespacho) || f.recargoDespacho < 0 || f.recargoDespacho > 5)) {
        return `formatos[${i}].recargoDespacho debe ser un número entre 0 y 5`;
      }
    } else {
      return `formatos[${i}]: debe tener horarios o unidades`;
    }
  }
  if (body.cupones && !Array.isArray(body.cupones)) {
    return "cupones must be an array";
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  if (!(await authOk(req))) return res.status(401).json({ error: "Unauthorized" });

  const error = validar(req.body);
  if (error) return res.status(400).json({ error });

  const clean = {
    iva: req.body.iva,
    moneda: req.body.moneda || "CLP",
    actualizado: new Date().toISOString().slice(0, 10),
    formatos: req.body.formatos,
    cupones: req.body.cupones || [],
  };

  try {
    const result = await put(BLOB_KEY, JSON.stringify(clean, null, 2), {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return res.status(200).json({ ok: true, url: result.url, savedAt: clean.actualizado });
  } catch (err) {
    console.error("[/api/cotiza/save-tarifas] blob write failed:", err);
    return res.status(500).json({ error: "Failed to save", detail: String(err?.message ?? err) });
  }
}
