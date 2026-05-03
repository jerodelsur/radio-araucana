// Schema de validación server-side para POST /api/extractos/orders.
// Es independiente del schema del cliente: el server siempre valida.

import { z } from "zod";
import { isValidRUT } from "../../../src/extractos/lib/chilean/rut.js";

export const createOrderInputSchema = z.object({
  extractText: z.string().trim().min(10, "El texto del extracto es muy corto").max(50000, "Máximo 50.000 caracteres"),
  procedureType: z.enum(["dga_subterraneas", "dga_superficiales", "dia_seia", "otro"]),
  comuna: z.string().trim().min(2),
  provincia: z.string().trim().min(2),
  region: z.string().trim().min(2),
  publicationDay: z.union([z.literal(1), z.literal(15)]),
  publicationMonth: z.string().regex(/^\d{4}-\d{2}$/),
  clientName: z.string().trim().min(2).max(200),
  clientRUT: z.string().refine(isValidRUT, "RUT inválido"),
  clientEmail: z.string().email(),
  clientPhone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 8, "Teléfono incompleto"),
  clientOrganization: z.string().trim().max(120).optional().or(z.literal("")),
  gender: z.enum(["sr", "sra", "ambos"]),
});
