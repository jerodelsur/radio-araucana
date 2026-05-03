// Schema de validación server-side para POST /api/extractos/orders.
// Es independiente del schema del cliente: el server siempre valida.

import { z } from "zod";
import { isValidRUT } from "../../../src/extractos/lib/chilean/rut.js";

export const createOrderInputSchema = z
  .object({
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
    // Facturación opcional a empresa distinta del cliente persona.
    requiresInvoice: z.boolean().default(false),
    billingLegalName: z.string().trim().max(200).optional().or(z.literal("")),
    billingRUT: z.string().optional().or(z.literal("")),
    billingAddress: z.string().trim().max(300).optional().or(z.literal("")),
    billingGiro: z.string().trim().max(120).optional().or(z.literal("")),
    billingEmail: z.string().email("Email de facturación inválido").optional().or(z.literal("")),
  })
  .superRefine((data, ctx) => {
    if (!data.requiresInvoice) return;
    const required = [
      ["billingLegalName", "Razón social"],
      ["billingRUT", "RUT de facturación"],
      ["billingAddress", "Domicilio"],
      ["billingGiro", "Giro"],
    ];
    for (const [key, label] of required) {
      if (!data[key] || String(data[key]).trim().length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${label} obligatorio cuando se solicita factura` });
      }
    }
    if (data.billingRUT && !isValidRUT(data.billingRUT)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["billingRUT"], message: "RUT de empresa inválido" });
    }
  });
