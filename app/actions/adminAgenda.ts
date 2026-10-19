"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  type AgendaRepoError,
  deleteAgendaEvent,
  insertAgendaEvent,
  updateAgendaEvent,
} from "@/lib/agenda/repository";
import { type AgendaEvent, agendaEventInputSchema } from "@/lib/agenda/schema";
import { getAdminStrict } from "@/lib/auth/admin";
import type { Result } from "@/lib/payments/schema";

/**
 * Server Actions de la agenda (`/dashboard/agenda`). Igual que las de pagos:
 * cada una verifica al admin con `getAdminStrict()` y revalida la entrada con
 * zod, porque se pueden llamar por POST directo sin pasar por la UI.
 */

export type AgendaActionError =
  | "unauthorized"
  | "invalid_input"
  | "not_found"
  | "server_error";

const idSchema = z.uuid();

function revalidateAgendaViews() {
  revalidatePath("/dashboard/agenda");
  revalidatePath("/");
}

function mapRepoError(error: AgendaRepoError): AgendaActionError {
  return error === "not_found" ? "not_found" : "server_error";
}

export async function createAgendaEvent(
  input: unknown,
): Promise<Result<AgendaEvent, AgendaActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = agendaEventInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const result = await insertAgendaEvent(parsed.data);
  if (!result.ok) return { ok: false, error: mapRepoError(result.error) };

  revalidateAgendaViews();
  return result;
}

export async function editAgendaEvent(
  id: string,
  input: unknown,
): Promise<Result<AgendaEvent, AgendaActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsedId = idSchema.safeParse(id);
  const parsed = agendaEventInputSchema.safeParse(input);
  if (!parsedId.success || !parsed.success)
    return { ok: false, error: "invalid_input" };

  const result = await updateAgendaEvent(parsedId.data, parsed.data);
  if (!result.ok) return { ok: false, error: mapRepoError(result.error) };

  revalidateAgendaViews();
  return result;
}

export async function removeAgendaEvent(
  id: string,
): Promise<Result<null, AgendaActionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const result = await deleteAgendaEvent(parsed.data);
  if (!result.ok) return { ok: false, error: mapRepoError(result.error) };

  revalidateAgendaViews();
  return result;
}
