import { DASHBOARD_CONTENT_CLASS } from "@/components/layout/DashboardShell";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DashboardStatBand } from "../DashboardStatBand";
import { SkeletonFrame } from "./SkeletonFrame";
import { SkeletonLine } from "./skeletonParts";

const STATS = [
  { label: "Total recaudado", value: "", accent: true },
  { label: "Proyectos activos", value: "" },
  { label: "Proyectos completados", value: "" },
];
const ROWS = [0, 1, 2, 3] as const;

const CARD = "rounded-lg border border-border bg-card p-3 md:p-4";
const CARD_TITLE = "font-heading text-18 font-bold text-foreground";

/** Esqueleto de `/dashboard`: banda de KPIs y las dos tarjetas del Resumen. */
export function ResumenSkeleton() {
  return (
    <SkeletonFrame label="el resumen">
      <h1 className="sr-only">Resumen del dashboard</h1>
      <DashboardStatBand loading stats={STATS} />
      <div className={cn(DASHBOARD_CONTENT_CLASS, "py-5")}>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr]">
          <div className={CARD}>
            <p className={cn(CARD_TITLE, "mb-0.75")}>Próximos cierres</p>
            <p className="mb-3.5 font-body text-13 text-muted-foreground">
              Proyectos activos ordenados por fecha de cierre.
            </p>
            <div className="flex flex-col">
              {ROWS.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <SkeletonLine size="text-14" className="w-1/2" />
                    <Skeleton className="mt-1 h-1.25 rounded-pill" />
                  </div>
                  <div className="min-w-27.5 shrink-0">
                    <SkeletonLine size="text-13" className="ml-auto w-7/10" />
                    <SkeletonLine size="text-12" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={CARD}>
            <p className={cn(CARD_TITLE, "mb-2.5")}>Acciones rápidas</p>
            <Skeleton className="mb-1.5 h-12" />
            <Skeleton className="h-12" />
            <div className="mt-3.5 border-t border-border pt-3">
              <p className="mb-0.5 text-12 text-muted-foreground">
                Meta acumulada
              </p>
              <SkeletonLine size="text-20" className="w-30" />
            </div>
          </div>
        </div>
      </div>
    </SkeletonFrame>
  );
}
