"use client";

import { CalendarX, Folder, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import {
  DASHBOARD_CONTENT_CLASS,
  DashboardShell,
} from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import { DashboardStatBand } from "@/components/ui/DashboardStatBand";
import { EmptyState } from "@/components/ui/EmptyState";
import { Progress } from "@/components/ui/progress";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import { cn } from "@/lib/utils";

/**
 * Página "Dashboard — Resumen" (`/dashboard`) — Opción B ("Panel Superior"),
 * implementada tras el comparativo de `/design` (el cliente no estaba
 * conforme con el diseño anterior, D045/D024). Arranca directo con
 * `DashboardStatBand`, la banda navy a pantalla completa con los KPIs
 * principales, pegada al `DashboardTopbar`; el resto del contenido
 * (próximos cierres + acciones rápidas) vive debajo con su propio padding.
 *
 * Se mantienen solo los 3 KPI que ya se calculaban antes (D045) — total
 * recaudado, activos, completados — sin agregar métricas nuevas que no
 * tengan un dato real detrás (el mock de `/design` incluía un 4º KPI de
 * ejemplo, "Aportes este mes", que no corresponde a nada que el store
 * actual registre).
 */

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

const CARD = "rounded-lg border border-border bg-card p-3 md:p-4";
const CARD_TITLE = "font-heading text-18 font-bold text-foreground";
// Filas de "Acciones rápidas": misma altura que antes (34,4 px; 36,4 con el borde del enlace), no los 44 px del botón.
const ACTION_ROW =
  "min-h-0 w-full justify-start gap-1.25 rounded-sm px-2.25 py-1.5 leading-body";

export default function DashboardResumenPage() {
  const { projects, isLoading } = useDashboardProjects();
  const { openCreate } = useDashboardProjectModal();

  const stats = useMemo(() => {
    const totalRecaudado = projects.reduce(
      (sum, project) => sum + project.currentAmount,
      0,
    );
    const totalMeta = projects.reduce(
      (sum, project) => sum + project.goalAmount,
      0,
    );
    const activos = projects.filter((project) => project.status === "active");
    const completados = projects.filter(
      (project) => project.status === "completed",
    );
    const proximosCierres = [...activos]
      .sort(
        (a, b) =>
          new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      )
      .slice(0, 4);
    return { totalRecaudado, totalMeta, activos, completados, proximosCierres };
  }, [projects]);

  return (
    <DashboardShell>
      {/* La página no tiene un título visible (el diseño arranca directo con
          la banda de KPIs); un h1 accesible da el encabezado de la página. */}
      <h1 className="sr-only">Resumen del dashboard</h1>
      <DashboardStatBand
        loading={isLoading}
        stats={[
          {
            label: "Total recaudado",
            value: formatCurrency(stats.totalRecaudado),
            accent: true,
          },
          { label: "Proyectos activos", value: String(stats.activos.length) },
          {
            label: "Proyectos completados",
            value: String(stats.completados.length),
          },
        ]}
      />

      <div className={cn(DASHBOARD_CONTENT_CLASS, "py-5")}>
        {/* valor único: proporción tabla + lateral del resumen (la misma en ResumenSkeleton) */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1.6fr_1fr]">
          <div className={CARD}>
            <p className={cn(CARD_TITLE, "mb-0.75")}>Próximos cierres</p>
            <p className="mb-3.5 font-body text-13 text-muted-foreground">
              Proyectos activos ordenados por fecha de cierre.
            </p>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((key) => (
                  <div key={key} className="flex items-center gap-3 py-1">
                    <div className="flex-1">
                      <div className="mb-1 h-3.5 w-1/2 rounded-xs bg-muted" />
                      <div className="h-1.25 rounded-pill bg-muted" />
                    </div>
                  </div>
                ))}
              </div>
            ) : stats.proximosCierres.length === 0 ? (
              <EmptyState
                compact
                icon={CalendarX}
                title="No hay proyectos activos"
                description="Cuando crees uno, sus próximos cierres van a aparecer acá."
              />
            ) : (
              <div className="flex flex-col">
                {stats.proximosCierres.map((project) => {
                  const percent = Math.min(
                    Math.round(
                      (project.currentAmount / project.goalAmount) * 100,
                    ),
                    100,
                  );
                  return (
                    <div
                      key={project.id}
                      className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0 last:pb-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 font-heading text-14 font-semibold text-foreground">
                          {project.title}
                        </p>
                        <Progress
                          value={percent}
                          aria-label={`${project.title}: ${percent}% recaudado`}
                          color="secondary"
                          className="h-1.25 rounded-pill"
                        />
                      </div>
                      <div className="min-w-27.5 shrink-0 text-right">
                        <p className="font-medium text-13 text-foreground">
                          {project.deadlineLabel}
                        </p>
                        <p className="text-12 text-muted-foreground">
                          {formatCurrency(project.currentAmount)} /{" "}
                          {formatCurrency(project.goalAmount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={CARD}>
            <p className={cn(CARD_TITLE, "mb-2.5")}>Acciones rápidas</p>

            {/*
              Antes navegaba a `/dashboard/proyectos?new=1` para abrir el
              formulario ahí — el cliente pidió que este botón abra el modal
              directamente (para eso ya está "Ver todos los proyectos" abajo),
              así que ahora usa el modal global (`useDashboardProjectModal`,
              montado una sola vez en `app/dashboard/layout.tsx`, D059) y ya
              no navega.
            */}
            {/* Navy fijo (no `primary` por modo, que en oscuro es claro y con
                blanco da 3.7:1). */}
            <Button
              onClick={openCreate}
              className={cn(
                ACTION_ROW,
                "mb-1.5 bg-primary-700 hover:bg-primary-800 dark:bg-primary-700 dark:hover:bg-primary-800",
              )}
            >
              <Plus className="size-5" aria-hidden="true" />
              Nuevo proyecto
            </Button>

            <Button
              asChild
              variant="outlined"
              className={cn(
                ACTION_ROW,
                "border-border text-foreground hover:border-secondary hover:bg-transparent hover:text-secondary dark:hover:bg-transparent",
              )}
            >
              <Link href="/dashboard/proyectos">
                <Folder className="size-5" aria-hidden="true" />
                Ver todos los proyectos
              </Link>
            </Button>

            <div className="mt-3.5 border-t border-border pt-3">
              <p className="mb-0.5 text-12 text-muted-foreground">
                Meta acumulada
              </p>
              <p className="font-heading text-20 font-extrabold text-foreground">
                {formatCurrency(stats.totalMeta)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
