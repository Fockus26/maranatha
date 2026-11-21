import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { DashboardStatBand } from "../DashboardStatBand";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SkeletonButton,
  SkeletonContent,
  SkeletonHeading,
  SkeletonLine,
} from "./skeletonParts";

const STATS = [
  { label: "Pendientes de verificar", value: "", accent: true },
  { label: "Confirmado este mes", value: "" },
  { label: "Aportes confirmados este mes", value: "" },
];
const FILTERS = [
  "Pendientes",
  "Confirmados",
  "Rechazados",
  "Cancelados",
  "Todos",
] as const;
const CARDS = [0, 1, 2] as const;
const CARD_FIELDS = [0, 1, 2, 3] as const;

/** Esqueleto de `/dashboard/pagos`: banda, filtros y tarjetas de pago. */
export function PagosSkeleton() {
  return (
    <SkeletonFrame label="pagos">
      <DashboardStatBand loading stats={STATS} />
      <SkeletonContent maxWidthClass="max-w-panel">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 shrink grow basis-80">
            <SkeletonHeading
              title="Pagos"
              subtitle="Verifica cada reporte contra tu banco o app antes de confirmarlo. Solo los pagos confirmados suman a lo recaudado."
            />
          </div>
          <SkeletonButton widthClass="w-40" />
        </div>

        <div className="mb-3 flex flex-wrap gap-1">
          {FILTERS.map((label, index) => (
            <span
              key={label}
              className={cn(
                "rounded-pill border px-2 py-0.75 font-medium text-13",
                index === 0
                  ? "border-secondary text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="grid gap-2">
          {CARDS.map((card) => (
            <div
              key={card}
              className="rounded-md border border-border bg-card p-2.5 md:p-3"
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 shrink grow basis-60">
                  <SkeletonLine size="text-15" className="w-11/20" />
                  <SkeletonLine size="text-12" className="w-3/4" />
                </div>
                <div className="flex items-center gap-1.5">
                  <SkeletonLine size="text-20" className="w-18" />
                  <Skeleton className="h-5.5 w-19 rounded-pill" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {CARD_FIELDS.map((field) => (
                  <div key={field}>
                    <SkeletonLine size="text-11" className="w-2/5" />
                    <SkeletonLine size="text-14" className="w-7/10" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SkeletonContent>
    </SkeletonFrame>
  );
}
