"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowUp, Folder, Pencil, Trash2 } from "lucide-react";
import { type ComponentProps, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import type { ProjectStatus } from "./ProjectCard";

/**
 * Antes era un `<Table>` semántico de MUI. El cliente pidió una animación de
 * layout al crear/eliminar filas (mismo lenguaje que el toggle lista/grilla
 * de `/proyectos`, D052) — animar `<tr>` con `framer-motion` es poco
 * confiable entre navegadores (los transforms que usa `layout` para el FLIP
 * no se aplican de forma consistente sobre elementos de tabla), así que se
 * pasa a una "tabla" armada con CSS Grid (encabezado + filas como `div`
 * `display: grid` con las mismas columnas), donde `layout` + `AnimatePresence`
 * sí funcionan igual que en el resto del sitio. `role="table"/"row"/"cell"`
 * mantiene la semántica de tabla para lectores de pantalla.
 *
 * Migrada a shadcn (D135): el orden es un botón dentro de cada cabecera, que
 * lleva `aria-sort`; cada botón de ícono (también en las tarjetas de móvil)
 * tiene nombre accesible con el título del proyecto.
 */

export interface DashboardProjectRow {
  id: string;
  title: string;
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
  deadline: string;
  deadlineLabel: string;
}

export interface DashboardTableProps {
  projects: DashboardProjectRow[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** Fase 09 (D067) — muestra filas skeleton en vez de datos mientras carga. */
  loading?: boolean;
  /** CTA del empty state cuando no hay ningún proyecto todavía (no confundir
   * con "sin resultados de búsqueda", que resuelve la página que la monta). */
  onCreate?: () => void;
}

type SortColumn = "title" | "status" | "progress" | "deadline";
type SortDirection = "asc" | "desc";

const EASE = [0.2, 0.8, 0.2, 1] as const;
/** Proyecto · Estado · Progreso · Cierre · Acciones (sin token de columnas). */
const GRID_COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_130px_200px_130px_96px] items-center";

const SORT_COLUMNS: { column: SortColumn; label: string }[] = [
  { column: "title", label: "Proyecto" },
  { column: "status", label: "Estado" },
  { column: "progress", label: "Progreso" },
  { column: "deadline", label: "Cierre" },
];

/**
 * Botón de ícono con borde: el `IconButton size="small"` de MUI (ícono de
 * 20 px + 5 px de relleno + 1 px de borde = 32 px).
 */
const ROW_ACTION_CLASS = "size-8 rounded-sm border border-border p-1.25";
const EDIT_ACTION_CLASS = cn(
  ROW_ACTION_CLASS,
  "text-primary hover:border-secondary hover:text-secondary dark:text-primary dark:hover:text-secondary",
);
const DELETE_ACTION_CLASS = cn(
  ROW_ACTION_CLASS,
  "text-muted-foreground hover:border-destructive hover:text-destructive dark:text-muted-foreground dark:hover:text-destructive",
);

/** Píldora de estado: fondo sólido + texto blanco (D060/D061). */
function statusPillClass(isCompleted: boolean) {
  return cn(
    "inline-block rounded-pill font-semibold whitespace-nowrap text-white",
    isCompleted ? "bg-success-filled" : "bg-secondary-700",
  );
}

/** Barra de la fila: verde si se completó, naranja si sigue activo. */
const PROGRESS_CLASS = "h-1.25 rounded-pill bg-accent";

function progressOf(row: DashboardProjectRow) {
  // Fase QA (functional-qa): acota a 0-100. Sin el piso en 0, un
  // `currentAmount` negativo mostraba "-80%" en la tabla; sin el techo, uno
  // mayor a la meta pasaba de 100. Un `goalAmount` de 0 daría NaN → 0.
  const raw = (row.currentAmount / row.goalAmount) * 100;
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 100) : 0;
}

const SKELETON_ROWS = [0, 1, 2];

/*
 * Piezas de la "tabla" de grilla: `div` con los roles de tabla (D052; un
 * `<table>` real rompe la animación de filas). Ninguna es interactiva: el
 * foco lo llevan los botones de dentro.
 */
type DivProps = ComponentProps<"div">;
function GridTable(props: DivProps) {
  // biome-ignore lint/a11y/useSemanticElements: grilla con rol de tabla (D052).
  return <div role="table" {...props} />;
}
function GridRow(props: DivProps) {
  // biome-ignore lint/a11y/useSemanticElements: fila de la grilla, sin foco propio.
  // biome-ignore lint/a11y/useFocusableInteractive: fila de la grilla, sin foco propio.
  return <div role="row" {...props} />;
}
function GridColumnHeader(props: DivProps) {
  // biome-ignore lint/a11y/useSemanticElements: cabecera de la grilla; el foco va al botón de orden.
  // biome-ignore lint/a11y/useFocusableInteractive: cabecera de la grilla; el foco va al botón de orden.
  return <div role="columnheader" {...props} />;
}
function GridCell(props: DivProps) {
  // biome-ignore lint/a11y/useSemanticElements: celda de la grilla (D052).
  return <div role="cell" {...props} />;
}

/** Línea de texto en gris (el `Skeleton variant="text"` de MUI: 60 % del alto). */
function SkeletonText({ className }: { className: string }) {
  return (
    <Skeleton className={cn("origin-left scale-y-60 rounded-xs", className)} />
  );
}

export function DashboardTable({
  projects,
  onEdit,
  onDelete,
  loading,
  onCreate,
}: DashboardTableProps) {
  const reduceMotion = useReducedMotion();
  const [sortColumn, setSortColumn] = useState<SortColumn>("deadline");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [deleteTarget, setDeleteTarget] = useState<DashboardProjectRow | null>(
    null,
  );

  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  const sortedProjects = useMemo(() => {
    const factor = sortDirection === "asc" ? 1 : -1;
    return [...projects].sort((a, b) => {
      switch (sortColumn) {
        case "title":
          return a.title.localeCompare(b.title) * factor;
        case "status":
          return a.status.localeCompare(b.status) * factor;
        case "progress":
          return (progressOf(a) - progressOf(b)) * factor;
        default: // "deadline"
          return (
            (new Date(a.deadline).getTime() - new Date(b.deadline).getTime()) *
            factor
          );
      }
    });
  }, [projects, sortColumn, sortDirection]);

  // Fase 09 (D067) — sin proyectos y sin estar cargando: empty state en vez
  // de una tabla vacía con solo encabezados. Distinto del caso "sin
  // resultados de búsqueda", que resuelve cada página que filtra antes de
  // pasarle `projects` a este componente.
  if (!loading && projects.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState
          icon={Folder}
          title="Todavía no hay proyectos"
          description="Crea el primero para empezar a hacerle seguimiento desde aquí."
          ctaLabel={onCreate ? "Crear proyecto" : undefined}
          onCtaClick={onCreate}
        />
      </div>
    );
  }

  return (
    <>
      {/*
        Fase 08 (mobile): el grid de 5 columnas (~560px mínimo) no cabe en
        pantallas angostas. Por debajo de `sm` se oculta esta tabla y se
        muestra en su lugar la lista de tarjetas apiladas de más abajo —
        mismos datos, mismas acciones, elegido por el cliente entre 3
        opciones (tarjetas / scroll horizontal / columnas ocultas) vistas en
        un comparador visual. Desde `sm` en adelante esta tabla no cambia.
      */}
      <GridTable
        aria-label="Proyectos"
        className="relative hidden overflow-hidden rounded-lg border border-border bg-card sm:block"
      >
        <GridRow
          className={cn(
            GRID_COLUMNS,
            "border-b border-border bg-black/4 px-3 py-1 dark:bg-white/2",
          )}
        >
          {SORT_COLUMNS.map(({ column, label }) => {
            const active = sortColumn === column;
            const direction = active ? sortDirection : "asc";
            const Arrow = direction === "asc" ? ArrowUp : ArrowDown;
            return (
              <GridColumnHeader
                key={column}
                aria-sort={
                  active
                    ? sortDirection === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
              >
                <button
                  type="button"
                  onClick={() => handleSort(column)}
                  className={cn(
                    "group inline-flex cursor-pointer items-center rounded-xs font-body text-13 font-medium",
                    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                  <Arrow
                    aria-hidden="true"
                    className={cn(
                      "mr-1 ml-1 size-4.5 shrink-0 transition-opacity duration-150",
                      active
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50",
                    )}
                  />
                </button>
              </GridColumnHeader>
            );
          })}
          <GridColumnHeader className="text-right text-13 font-medium text-muted-foreground">
            Acciones
          </GridColumnHeader>
        </GridRow>

        {loading ? (
          // Fase 09 (D067) — patrón de loading elegido por el cliente:
          // skeleton screens (en vez de spinner de botón o barra superior).
          // 3 filas placeholder que imitan la forma real de la fila (título,
          // chip, barra+%, fecha, acciones) para que el salto al llegar el
          // contenido real sea mínimo.
          SKELETON_ROWS.map((key) => (
            <GridRow
              key={key}
              className={cn(
                GRID_COLUMNS,
                "border-b border-border px-3 py-2 last:border-b-0",
              )}
            >
              <GridCell className="pr-2">
                <SkeletonText className="h-5 w-7/10" />
              </GridCell>
              <GridCell>
                <Skeleton className="h-5 w-16 rounded-pill" />
              </GridCell>
              <GridCell className="flex items-center gap-2">
                <Skeleton className="h-1.25 w-20 rounded-pill" />
                <SkeletonText className="h-4 w-6" />
              </GridCell>
              <GridCell>
                <SkeletonText className="h-4 w-3/5" />
              </GridCell>
              <GridCell className="flex justify-end gap-1">
                <Skeleton className="size-7" />
                <Skeleton className="size-7" />
              </GridCell>
            </GridRow>
          ))
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {sortedProjects.map((row) => {
              const isCompleted = row.status === "completed";
              const percent = progressOf(row);

              return (
                <motion.div
                  key={row.id}
                  role="row"
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
                  className={cn(
                    GRID_COLUMNS,
                    "border-b border-border px-3 py-2 last:border-b-0",
                  )}
                >
                  <GridCell className="truncate pr-2 text-14 font-medium text-foreground">
                    {row.title}
                  </GridCell>
                  <GridCell>
                    <span
                      className={cn(
                        statusPillClass(isCompleted),
                        "px-2.25 py-0.5 text-11",
                      )}
                    >
                      {isCompleted ? "Completado" : "Activo"}
                    </span>
                  </GridCell>
                  <GridCell>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={percent}
                        aria-label={`${row.title}: ${Math.round(percent)}% recaudado`}
                        color={isCompleted ? "success" : "secondary"}
                        className={cn(PROGRESS_CLASS, "w-20")}
                      />
                      <span className="text-11 text-muted-foreground">
                        {Math.round(percent)}%
                      </span>
                    </div>
                  </GridCell>
                  <GridCell className="text-13 text-muted-foreground">
                    {row.deadlineLabel}
                  </GridCell>
                  <GridCell>
                    <div className="flex justify-end gap-1">
                      {/* Un proyecto completado ya no se puede editar — pedido
                          del cliente; Eliminar sigue disponible en cualquier
                          estado. */}
                      {!isCompleted && (
                        <Button
                          variant="plain"
                          size="icon"
                          onClick={() => onEdit(row.id)}
                          aria-label={`Editar ${row.title}`}
                          className={EDIT_ACTION_CLASS}
                        >
                          <Pencil aria-hidden="true" className="size-5" />
                        </Button>
                      )}
                      <Button
                        variant="plain"
                        size="icon"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Eliminar ${row.title}`}
                        className={DELETE_ACTION_CLASS}
                      >
                        <Trash2 aria-hidden="true" className="size-5" />
                      </Button>
                    </div>
                  </GridCell>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </GridTable>

      {/* Vista mobile — tarjetas apiladas (Opción A del comparador de /design,
          elegida por el cliente). Mismos datos/acciones que la tabla de
          arriba, en una tarjeta vertical por proyecto: título + estado,
          barra de progreso, fecha de cierre, acciones. Antes sus botones de
          ícono no tenían nombre (crítico de axe a 320 px): ahora llevan el
          mismo `aria-label` que los de la tabla. */}
      <GridTable
        aria-label="Proyectos"
        className="relative flex flex-col gap-2 sm:hidden"
      >
        {loading ? (
          SKELETON_ROWS.map((key) => (
            <div
              key={key}
              className="rounded-md border border-border bg-card p-3"
            >
              <div className="mb-2 flex justify-between">
                <SkeletonText className="h-5 w-1/2" />
                <Skeleton className="h-4.5 w-14 rounded-pill" />
              </div>
              <Skeleton className="mb-1.5 h-1.25 rounded-pill" />
              <SkeletonText className="mb-2 h-4 w-2/5" />
              <div className="flex justify-end gap-1">
                <Skeleton className="size-7" />
                <Skeleton className="size-7" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout" initial={false}>
            {sortedProjects.map((row) => {
              const isCompleted = row.status === "completed";
              const percent = progressOf(row);

              return (
                <motion.div
                  key={row.id}
                  role="row"
                  layout={!reduceMotion}
                  initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                  transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
                  className="rounded-md border border-border bg-card p-3"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <GridCell className="min-w-0 text-14 font-semibold text-foreground">
                      {row.title}
                    </GridCell>
                    <GridCell
                      className={cn(
                        statusPillClass(isCompleted),
                        "shrink-0 px-1.75 py-0.5 text-10.5",
                      )}
                    >
                      {isCompleted ? "Completado" : "Activo"}
                    </GridCell>
                  </div>

                  <GridCell className="mb-1.5 flex items-center gap-2">
                    <Progress
                      value={percent}
                      aria-label={`${row.title}: ${Math.round(percent)}% recaudado`}
                      color={isCompleted ? "success" : "secondary"}
                      className={cn(PROGRESS_CLASS, "flex-1")}
                    />
                    <span className="shrink-0 text-11 text-muted-foreground">
                      {Math.round(percent)}%
                    </span>
                  </GridCell>

                  <GridCell className="mb-2 text-12 text-muted-foreground">
                    Cierre: {row.deadlineLabel}
                  </GridCell>

                  <GridCell className="flex justify-end gap-1">
                    {!isCompleted && (
                      <Button
                        variant="plain"
                        size="icon"
                        onClick={() => onEdit(row.id)}
                        aria-label={`Editar ${row.title}`}
                        className={EDIT_ACTION_CLASS}
                      >
                        <Pencil aria-hidden="true" className="size-5" />
                      </Button>
                    )}
                    <Button
                      variant="plain"
                      size="icon"
                      onClick={() => setDeleteTarget(row)}
                      aria-label={`Eliminar ${row.title}`}
                      className={DELETE_ACTION_CLASS}
                    >
                      <Trash2 aria-hidden="true" className="size-5" />
                    </Button>
                  </GridCell>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </GridTable>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar proyecto"
        description={
          deleteTarget ? (
            <>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <span className="font-bold text-foreground">
                &quot;{deleteTarget.title}&quot;
              </span>{" "}
              permanentemente.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => {
          if (deleteTarget) onDelete(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
