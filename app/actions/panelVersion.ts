"use server";

import { z } from "zod";
import { getAgendaVersion } from "@/lib/agenda/repository";
import { getAdminStrict } from "@/lib/auth/admin";
import type { PanelVersion } from "@/lib/panelFreshness";
import { getPaymentsVersion } from "@/lib/payments/repository";
import type { Result } from "@/lib/payments/schema";

/**
 * Versión actual de los datos de un panel (D104), para que
 * `components/ui/PanelFreshness.tsx` sepa si la página sacada de la caché del
 * router sigue al día. Solo lectura, pero alcanzable por POST directo como
 * toda Server Action: verifica al admin con `getAdminStrict()` y revalida el
 * scope. No devuelve datos, solo un token opaco.
 */

export type PanelVersionError =
  | "unauthorized"
  | "invalid_input"
  | "server_error";

const scopeSchema = z.enum(["payments", "agenda"]);

export async function getPanelVersion(
  scope: unknown,
): Promise<Result<PanelVersion, PanelVersionError>> {
  const admin = await getAdminStrict();
  if (!admin) return { ok: false, error: "unauthorized" };
  const parsed = scopeSchema.safeParse(scope);
  if (!parsed.success) return { ok: false, error: "invalid_input" };

  const result =
    parsed.data === "payments"
      ? await getPaymentsVersion()
      : await getAgendaVersion();
  return result.ok ? result : { ok: false, error: "server_error" };
}
