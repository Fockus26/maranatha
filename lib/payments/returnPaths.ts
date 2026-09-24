import "server-only";
import { getProjectBySlug } from "@/lib/projectsData";
import type { PaymentRow } from "./repository";

export type CheckoutOutcome =
  | "confirmado"
  | "suscrito"
  | "pendiente"
  | "cancelado"
  | "error";

/**
 * URL de la página de resultado tras volver de una pasarela. `volver` es el
 * slug del proyecto (validado contra el catálogo al leerlo) — nunca una URL
 * libre, para no abrir un redirect arbitrario.
 */
export function resultUrl(
  base: string,
  outcome: CheckoutOutcome,
  payment?: Pick<PaymentRow, "project_slug"> | null,
): URL {
  const url = new URL("/pago/resultado", base);
  url.searchParams.set("estado", outcome);
  if (payment?.project_slug && getProjectBySlug(payment.project_slug)) {
    url.searchParams.set("proyecto", payment.project_slug);
  }
  return url;
}
