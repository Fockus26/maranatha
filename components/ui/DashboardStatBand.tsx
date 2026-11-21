"use client";

import { DASHBOARD_CONTENT_CLASS } from "@/components/layout/DashboardShell";
import { PatternLayer } from "@/components/ui/pattern-layer";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface DashboardStat {
  label: string;
  value: string;
  accent?: boolean;
}

export interface DashboardStatBandProps {
  stats: DashboardStat[];
  /** Fase 09 (D067) — skeleton en vez de las cifras mientras carga. */
  loading?: boolean;
}

/**
 * Banda de KPIs a pantalla completa, inmediatamente debajo de
 * `DashboardTopbar` — pieza central de la Opción B ("Panel Superior") del
 * comparativo de `/design`. Reutiliza el mismo navy sólido + patrón
 * geométrico en pan continuo ya usado en `TitheModal.tsx` (D048/D057) en
 * vez de inventar una textura nueva — mismo lenguaje "wow" de marca.
 */
export function DashboardStatBand({ stats, loading }: DashboardStatBandProps) {
  return (
    <div
      data-surface="navy"
      className="relative overflow-hidden bg-primary-900 py-3.5 md:py-4.5"
    >
      <PatternLayer />
      <div
        className={cn(
          DASHBOARD_CONTENT_CLASS,
          "relative flex flex-wrap gap-y-3",
        )}
      >
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={cn(
              "shrink grow basis-50",
              index > 0 && "sm:border-l sm:border-on-navy-divider sm:pl-4",
            )}
          >
            <p className="mb-1.25 font-body text-11 tracking-[0.08em] text-white/55 uppercase">
              {stat.label}
            </p>
            {loading ? (
              <div className="font-heading text-26 leading-body md:text-34">
                <Skeleton className="w-22.5 origin-left scale-y-60 bg-white/12">
                  &nbsp;
                </Skeleton>
              </div>
            ) : (
              <p
                className={cn(
                  "font-heading text-26 font-extrabold md:text-34",
                  stat.accent ? "text-secondary" : "text-gray-50",
                )}
              >
                {stat.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
