"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Plus, Search, SearchX } from "lucide-react";
import { useMemo, useState } from "react";
import {
  DASHBOARD_CONTENT_CLASS,
  DashboardShell,
} from "@/components/layout/DashboardShell";
import { Button } from "@/components/ui/button";
import {
  type DashboardProjectRow,
  DashboardTable,
} from "@/components/ui/DashboardTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import { cn } from "@/lib/utils";

/**
 * Página "Dashboard — Proyectos" (`/dashboard/proyectos`) — Opción B ("Panel
 * Superior"), implementada tras el comparativo de `/design`. La tabla
 * (`DashboardTable`, D022) no cambia de lugar — lo que cambió es el shell
 * alrededor: ya no hay sidebar (D024), así que la página arranca con su
 * propio encabezado (título + conteo real de activos/completados) y gana un
 * buscador por título que filtra la tabla en el cliente — el mock de
 * `/design` mostraba un buscador en esta página, así que se conecta a algo
 * real en vez de dejarlo decorativo.
 *
 * Revisión (feedback del cliente): el modal de crear/editar proyecto ya no
 * es estado local de esta página — pasó a `DashboardProjectModal`, montado
 * globalmente en `app/dashboard/layout.tsx` y controlado vía
 * `useDashboardProjectModal` (D059), para que el botón "Nuevo proyecto" de
 * Resumen también pueda abrirlo sin depender de un query param ni navegar
 * primero acá.
 */

export default function DashboardProyectosPage() {
  const reduceMotion = useReducedMotion();
  const { projects, isLoading, deleteProject } = useDashboardProjects();
  const { openCreate, openEdit } = useDashboardProjectModal();
  const [query, setQuery] = useState("");

  const rows: DashboardProjectRow[] = useMemo(
    () =>
      projects.map((project) => ({
        id: project.id,
        title: project.title,
        status: project.status,
        currentAmount: project.currentAmount,
        goalAmount: project.goalAmount,
        deadline: project.deadline,
        deadlineLabel: project.deadlineLabel,
      })),
    [projects],
  );

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return rows;
    return rows.filter((row) => row.title.toLowerCase().includes(normalized));
  }, [rows, query]);

  const activos = projects.filter(
    (project) => project.status === "active",
  ).length;
  const completados = projects.filter(
    (project) => project.status === "completed",
  ).length;

  return (
    <DashboardShell>
      <div className={cn(DASHBOARD_CONTENT_CLASS, "pt-8 pb-5 md:pt-12")}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h1 className="mb-0.5 font-heading text-26 font-extrabold text-foreground">
              Proyectos
            </h1>
            <p className="text-13 text-muted-foreground">
              {projects.length} proyectos · {activos} activos, {completados}{" "}
              completados
            </p>
          </div>
          <Button variant="contained" color="primary" onClick={openCreate}>
            <Plus aria-hidden="true" className="size-5" />
            Nuevo proyecto
          </Button>
        </div>

        {/* El campo no tenía nombre ni foco visible (outline: none): ahora
            lleva `aria-label` y el anillo de foco de D085 en el contenedor. */}
        <div className="mb-3 flex w-full items-center gap-1.5 rounded-sm border border-border bg-card px-2 py-1.25 text-muted-foreground focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring sm:w-80">
          <Search aria-hidden="true" className="size-5 shrink-0" />
          <input
            type="search"
            aria-label="Buscar proyecto"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar proyecto…"
            className="w-full border-none bg-transparent font-body text-13 text-foreground outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
          />
        </div>

        {/* Sin resultados de búsqueda (con proyectos existentes) — distinto
            del caso "sin ningún proyecto todavía", que resuelve el propio
            `DashboardTable` vía su prop `onCreate` (fase 09, D067). */}
        {!isLoading && query.trim() && filteredRows.length === 0 ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: [0.2, 0.8, 0.2, 1],
            }}
            className="rounded-lg border border-border bg-card"
          >
            <EmptyState
              icon={SearchX}
              title={`Ningún proyecto coincide con "${query}"`}
              description="Prueba con otro título o borra la búsqueda."
              ctaLabel="Limpiar búsqueda"
              onCtaClick={() => setQuery("")}
            />
          </motion.div>
        ) : (
          <DashboardTable
            projects={filteredRows}
            onEdit={openEdit}
            onDelete={deleteProject}
            loading={isLoading}
            onCreate={openCreate}
          />
        )}
      </div>
    </DashboardShell>
  );
}
