// Schema de validación server-side para POST /api/extractos/orders.
// Es independiente del schema del cliente: el server siempre valida.
//
// Toda difusión radial se factura — boleta a persona no es una opción.
// Por eso billing_* es siempre obligatorio.
//
// Multi-extracto (Bertha, 2026-05-15): una orden agrupa 1..20 extractos.
// Cada extracto tiene su propio texto, comuna, fecha y trámite. Cliente y
// facturación se completan una sola vez.

import { z } from "zod";
import { isValidRUT } from "../../../src/extractos/lib/chilean/rut.js";

export const extractInputSchema = z.object({
  extractText: z.string().trim().min(10, "El texto del extracto es muy corto").max(50000, "Máximo 50.000 caracteres"),
  procedureType: z.enum(["dga_subterraneas", "dga_superficiales", "dia_seia", "otro"]),
  comuna: z.string().trim().min(2),
  provincia: z.string().trim().min(2),
  region: z.string().trim().min(2),
  publicationDay: z.union([z.literal(1), z.literal(15)]),
  publicationMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

export const createOrderInputSchema = z.object({
  extracts: z.array(extractInputSchema).min(1, "Al menos 1 extracto").max(20, "Máximo 20 extractos por cotización"),
  clientName: z.string().trim().min(2).max(200),
  clientRUT: z.string().refine(isValidRUT, "RUT inválido"),
  clientEmail: z.string().email(),
  clientPhone: z.string().trim().refine((v) => v.replace(/\D/g, "").length >= 8, "Teléfono incompleto"),
  clientOrganization: z.string().trim().max(120).optional().or(z.literal("")),
  gender: z.enum(["sr", "sra", "ambos"]),
  billingLegalName: z.string().trim().min(2, "Razón social obligatoria").max(200),
  billingRUT: z.string().refine(isValidRUT, "RUT de empresa inválido"),
  billingAddress: z.string().trim().min(2, "Domicilio obligatorio").max(300),
  billingGiro: z.string().trim().min(2, "Giro obligatorio").max(120),
  billingEmail: z.string().email("Email de facturación inválido"),
});
