import "server-only";
import { getRaisedBySlug } from "@/lib/payments/repository";
import type { ProjectRecord } from "@/lib/projectsData";

/**
 * Recaudado real de los proyectos: el monto base de `lib/projectsData.ts`
 * (lo recaudado antes del sitio / placeholder) + la suma de los pagos
 * confirmados de cada proyecto (vista `project_raised` en Supabase).
 *
 * Se devuelve como objeto plano (no `Map`) para poder pasarlo como prop a
 * componentes cliente. Si Supabase no responde, vale `{}` y el sitio muestra
 * solo los montos base en vez de romperse.
 */
export async function getRaisedRecord(): Promise<Record<string, number>> {
  return Object.fromEntries(await getRaisedBySlug());
}

export function withRaised<
  T extends Pick<ProjectRecord, "slug" | "currentAmount">,
>(project: T, raised: Record<string, number>): T {
  const extra = raised[project.slug] ?? 0;
  return extra
    ? { ...project, currentAmount: project.currentAmount + extra }
    : project;
}
