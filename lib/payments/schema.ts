import { z } from "zod";
import { EMAIL_RE } from "@/lib/validation";

/**
 * Esquemas de pagos compartidos por cliente y servidor. El cliente los usa
 * para UX; el servidor los vuelve a aplicar siempre — un atacante no pasa por
 * el formulario.
 */

export const PAYMENT_METHOD_IDS = [
  "paypal",
  "pagomovil",
  "zelle",
  "bancolombia",
  "binance",
  "zinli",
  "wally",
] as const;
export type PaymentMethodId = (typeof PAYMENT_METHOD_IDS)[number];

export const MANUAL_METHOD_IDS = [
  "pagomovil",
  "zelle",
  "bancolombia",
  "binance",
  "zinli",
  "wally",
] as const;
export type ManualMethodId = (typeof MANUAL_METHOD_IDS)[number];

export const PAYMENT_PURPOSES = ["diezmo", "ofrenda", "proyecto"] as const;
export type PaymentPurpose = (typeof PAYMENT_PURPOSES)[number];

export const PAYMENT_FREQUENCIES = ["once", "monthly"] as const;
export type PaymentFrequency = (typeof PAYMENT_FREQUENCIES)[number];

export const PAYMENT_STATUSES = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_CURRENCIES = ["USD", "VES", "COP", "USDT"] as const;
export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number];

/** Límites del monto en USD — mismos en cliente y servidor. */
export const MIN_AMOUNT_USD = 1;
export const MAX_AMOUNT_USD = 10000;

/** Lo que el paso 1 (formulario de aporte) entrega al paso de pago. */
export const contributionSchema = z
  .object({
    purpose: z.enum(PAYMENT_PURPOSES),
    projectSlug: z.string().trim().min(1).max(120).optional(),
    frequency: z.enum(PAYMENT_FREQUENCIES),
    amountUsd: z.coerce
      .number()
      .finite()
      .min(MIN_AMOUNT_USD)
      .max(MAX_AMOUNT_USD)
      .transform((v) => Math.round(v * 100) / 100),
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().max(254).regex(EMAIL_RE),
  })
  .refine((v) => (v.purpose === "proyecto") === Boolean(v.projectSlug), {
    message: "project_slug_mismatch",
    path: ["projectSlug"],
  })
  .refine((v) => v.purpose !== "proyecto" || v.frequency === "once", {
    message: "project_monthly_not_allowed",
    path: ["frequency"],
  });

export type Contribution = z.infer<typeof contributionSchema>;

/** Reporte de un pago manual (paso 2, métodos sin pasarela). */
export const manualReportSchema = z.object({
  method: z.enum(MANUAL_METHOD_IDS),
  reference: z
    .string()
    .trim()
    .min(3)
    .max(64)
    .regex(/^[A-Za-z0-9@._\- ]+$/),
  paidAt: z.iso.date(),
  amountPaid: z.coerce.number().finite().positive().max(1_000_000_000),
});

export type ManualReport = z.infer<typeof manualReportSchema>;

export type Result<T, E extends string = string> =
  | { ok: true; data: T }
  | { ok: false; error: E };
