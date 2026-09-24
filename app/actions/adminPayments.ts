"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminStrict } from "@/lib/auth/admin";
import { getReceiptUrl } from "@/lib/payments/receipts";
import {
  getPayment,
  type PaymentRow,
  setSetting,
  transitionPayment,
} from "@/lib/payments/repository";
import type { Result } from "@/lib/payments/schema";

/**
 * Server Actions del panel de pagos. Cada una verifica al admin con
 * `getAdminStrict()` (consulta a Supabase Auth, detecta sesiones revocadas):
 * estas funciones son alcanzables por POST directo, sin pasar por la UI.
 */

export type AdminActionError =
  | "unauthorized"
  | "invalid_input"
  | "not_found"
  | "already_processed"
  | "server_error";

const idSchema = z.uuid();

function revalidatePaymentViews(payment: PaymentRow) {
  revalidatePath("/dashboard/pagos");
  if (payment.project_slug) {
    revalidatePath(`/proyectos/${payment.project_slug}`);
    revalidatePath("/proyectos");
    revalidatePath("/");
  }
}

function mapRepoError(
  error: string,
): Exclude<AdminActionError, "unauthorized" | "invalid_input"> {
  if (error === "invalid_state") return "already_processed";
  if (error === "not_found") return "not_found";
  return "server_error";
}

export async function approvePayment(
  id: string,
): Promise<Result<null, AdminActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const result = await transitionPayment(parsed.data, "confirmed", {
    confirmed_by: admin.email,
  });
  if (!result.ok) return { ok: false, error: mapRepoError(result.error) };

  revalidatePaymentViews(result.data);
  return { ok: true, data: null };
}

const rejectSchema = z.object({
  id: z.uuid(),
  note: z.string().trim().max(500).optional(),
});

export async function rejectPayment(
  id: string,
  note?: string,
): Promise<Result<null, AdminActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = rejectSchema.safeParse({ id, note: note || undefined });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const result = await transitionPayment(parsed.data.id, "rejected", {
    confirmed_by: admin.email,
    notes: parsed.data.note ?? null,
  });
  if (!result.ok) return { ok: false, error: mapRepoError(result.error) };

  revalidatePaymentViews(result.data);
  return { ok: true, data: null };
}

/** URL firmada (5 min) del comprobante — se pide al hacer clic, no se lista. */
export async function getReceiptLink(
  id: string,
): Promise<Result<string, AdminActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const payment = await getPayment(parsed.data);
  if (!payment.ok) return { ok: false, error: mapRepoError(payment.error) };
  if (!payment.data.receipt_path) return { ok: false, error: "not_found" };

  const url = await getReceiptUrl(payment.data.receipt_path);
  if (!url) return { ok: false, error: "server_error" };
  return { ok: true, data: url };
}

const ratesSchema = z.object({
  VES: z.coerce.number().finite().positive().max(1_000_000).optional(),
  COP: z.coerce.number().finite().positive().max(1_000_000).optional(),
});

/**
 * Tasas de respaldo (`settings.exchange_rates`): solo se usan si DolarApi no
 * responde. Un campo vacío se guarda como "sin respaldo" para esa moneda.
 */
export async function saveFallbackRates(
  formData: FormData,
): Promise<Result<null, AdminActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = ratesSchema.safeParse({
    VES: formData.get("VES") || undefined,
    COP: formData.get("COP") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const saved = await setSetting("exchange_rates", parsed.data);
  if (!saved.ok) return { ok: false, error: "server_error" };
  revalidatePath("/dashboard/pagos");
  return { ok: true, data: null };
}
