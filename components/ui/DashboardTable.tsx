"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import Skeleton from "@mui/material/Skeleton";
import { useTheme } from "@mui/material/styles";
import TableSortLabel from "@mui/material/TableSortLabel";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { radius, secondary, semantic } from "@/theme/tokens";
import { ConfirmDialog } from "./ConfirmDialog";
import { EmptyState } from "./EmptyState";
import type { ProjectStatus } from "./ProjectCard";

/**
 * Antes era un `<Table>` semántico de MUI. El cliente pidió una animación de
 * layout al crear/eliminar filas (mismo lenguaje que el toggle lista/grilla
 * de `/proyectos`, D052) — animar `<tr>` con `framer-motion` es poco
 * confiable entre navegadores (los transforms que usa `layout` para el FLIP
 * no se aplican de forma consistente sobre elementos de tabla), así que se
 * pasa a una "tabla" armada con CSS Grid (encabezado + filas como `Box`
 * `display: grid` con las mismas columnas), donde `layout` + `AnimatePresence`
 * sí funcionan igual que en el resto del sitio. `role="table"/"row"/"cell"`
 * mantiene la semántica de tabla para lectores de pantalla.
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
const GRID_COLUMNS = "minmax(0,1fr) 130px 200px 130px 96px";

function progressOf(row: DashboardProjectRow) {
  // Fase QA (functional-qa): acota a 0-100. Sin el piso en 0, un
  // `currentAmount` negativo mostraba "-80%" en la tabla; sin el techo, uno
  // mayor a la meta pasaba de 100. Un `goalAmount` de 0 daría NaN → 0.
  const raw = (row.currentAmount / row.goalAmount) * 100;
  return Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 100) : 0;
}

const SKELETON_ROWS = [0, 1, 2];

export function DashboardTable({
  projects,
  onEdit,
  onDelete,
  loading,
  onCreate,
}: DashboardTableProps) {
  const theme = useTheme();
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
      <Box
        sx={{
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${radius.lg}px`,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <EmptyState
          icon={FolderOutlinedIcon}
          title="Todavía no hay proyectos"
          description="Creá el primero para empezar a hacerle seguimiento desde acá."
          ctaLabel={onCreate ? "Crear proyecto" : undefined}
          onCtaClick={onCreate}
        />
      </Box>
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
      <Box
        role="table"
        aria-label="Proyectos"
        sx={{
          display: { xs: "none", sm: "block" },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${radius.lg}px`,
          backgroundColor: theme.palette.background.paper,
          overflow: "hidden",
        }}
      >
        <Box
          role="row"
          sx={{
            display: "grid",
            gridTemplateColumns: GRID_COLUMNS,
            alignItems: "center",
            borderBottom: `1px solid ${theme.palette.divider}`,
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.02)"
                : theme.palette.action.hover,
            px: 3,
            py: 1,
          }}
        >
          {/* Antes sin `fontSize` propio: al dejar de estar dentro de un
              `<TableCell>` (que MUI dimensiona a ~14px por defecto, D0XX),
              estos encabezados heredaban el tamaño de cuerpo ambiente (16px)
              y se veían desproporcionados frente al resto de la tabla. */}
          {[
            { column: "title" as const, label: "Proyecto" },
            { column: "status" as const, label: "Estado" },
            { column: "progress" as const, label: "Progreso" },
            { column: "deadline" as const, label: "Cierre" },
          ].map(({ column, label }) => (
            <Box
              key={column}
              role="columnheader"
              sx={{
                fontSize: 13,
                color: theme.palette.text.secondary,
                "& .MuiTableSortLabel-root": { fontSize: 13, fontWeight: 500 },
              }}
            >
              <TableSortLabel
                active={sortColumn === column}
                direction={sortColumn === column ? sortDirection : "asc"}
                onClick={() => handleSort(column)}
              >
                {label}
              </TableSortLabel>
            </Box>
          ))}
          <Box
            role="columnheader"
            sx={{
              textAlign: "right",
              fontSize: 13,
              fontWeight: 500,
              color: theme.palette.text.secondary,
            }}
          >
            Acciones
          </Box>
        </Box>

        {loading ? (
          // Fase 09 (D067) — patrón de loading elegido por el cliente:
          // skeleton screens (en vez de spinner de botón o barra superior).
          // 3 filas placeholder que imitan la forma real de la fila (título,
          // chip, barra+%, fecha, acciones) para que el salto al llegar el
          // contenido real sea mínimo.
          SKELETON_ROWS.map((key) => (
            <Box
              key={key}
              role="row"
              sx={{
                display: "grid",
                gridTemplateColumns: GRID_COLUMNS,
                alignItems: "center",
                px: 3,
                py: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
                "&:last-of-type": { borderBottom: "none" },
              }}
            >
              <Box role="cell" sx={{ pr: 2 }}>
                <Skeleton variant="text" width="70%" height={20} />
              </Box>
              <Box role="cell">
                <Skeleton
                  variant="rounded"
                  width={64}
                  height={20}
                  sx={{ borderRadius: "20px" }}
                />
              </Box>
              <Box
                role="cell"
                sx={{ display: "flex", alignItems: "center", gap: 2 }}
              >
                <Skeleton
                  variant="rounded"
                  width={80}
                  height={5}
                  sx={{ borderRadius: "20px" }}
                />
                <Skeleton variant="text" width={24} height={16} />
              </Box>
              <Box role="cell">
                <Skeleton variant="text" width="60%" height={16} />
              </Box>
              <Box
                role="cell"
                sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
              >
                <Skeleton
                  variant="rounded"
                  width={28}
                  height={28}
                  sx={{ borderRadius: `${radius.sm}px` }}
                />
                <Skeleton
                  variant="rounded"
                  width={28}
                  height={28}
                  sx={{ borderRadius: `${radius.sm}px` }}
                />
              </Box>
            </Box>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {sortedProjects.map((row) => {
              const isCompleted = row.status === "completed";
              const percent = progressOf(row);

              return (
                <Box
                  key={row.id}
                  role="row"
                  component={motion.div}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: GRID_COLUMNS,
                    alignItems: "center",
                    px: 3,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    "&:last-of-type": { borderBottom: "none" },
                  }}
                >
                  <Box
                    role="cell"
                    sx={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: theme.palette.text.primary,
                      pr: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {row.title}
                  </Box>
                  <Box role="cell">
                    <Box
                      sx={{
                        display: "inline-block",
                        fontSize: "11px",
                        fontWeight: 600,
                        borderRadius: "20px",
                        px: 2.25,
                        py: 0.5,
                        // Antes: fondo translúcido ("26" ≈ 15% opacidad) con
                        // texto en el color de acento — subir la opacidad no fue
                        // suficiente (el cliente lo siguió viendo apagado), así
                        // que se pasa a fondo sólido + texto blanco, mismo
                        // criterio de contraste que la píldora del topbar
                        // (D060/D061).
                        backgroundColor: isCompleted
                          ? semantic.successFilled
                          : secondary[700],
                        color: "#FFFFFF",
                      }}
                    >
                      {isCompleted ? "Completado" : "Activo"}
                    </Box>
                  </Box>
                  <Box role="cell">
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <LinearProgress
                        variant="determinate"
                        value={percent}
                        aria-label={`${row.title}: ${Math.round(percent)}% recaudado`}
                        color={isCompleted ? "success" : "secondary"}
                        sx={{
                          width: 80,
                          height: 5,
                          borderRadius: "20px",
                          backgroundColor: theme.palette.action.hover,
                        }}
                      />
                      <Box
                        component="span"
                        sx={{
                          fontSize: "11px",
                          color: theme.palette.text.secondary,
                        }}
                      >
                        {Math.round(percent)}%
                      </Box>
                    </Box>
                  </Box>
                  <Box
                    role="cell"
                    sx={{ fontSize: 13, color: theme.palette.text.secondary }}
                  >
                    {row.deadlineLabel}
                  </Box>
                  <Box role="cell">
                    <Box
                      sx={{
                        display: "flex",
                        gap: 1,
                        justifyContent: "flex-end",
                      }}
                    >
                      {/* Un proyecto completado ya no se puede editar — pedido
                          del cliente; Eliminar sigue disponible en cualquier
                          estado. */}
                      {!isCompleted && (
                        <IconButton
                          size="small"
                          onClick={() => onEdit(row.id)}
                          aria-label={`Editar ${row.title}`}
                          sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: `${radius.sm}px`,
                            color: theme.palette.primary.main,
                            "&:hover": {
                              borderColor: theme.palette.secondary.main,
                              color: theme.palette.secondary.main,
                            },
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(row)}
                        aria-label={`Eliminar ${row.title}`}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: `${radius.sm}px`,
                          color: theme.palette.text.secondary,
                          "&:hover": {
                            borderColor: theme.palette.error.main,
                            color: theme.palette.error.main,
                          },
                        }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </AnimatePresence>
        )}
      </Box>

      {/* Vista mobile — tarjetas apiladas (Opción A del comparador de /design,
          elegida por el cliente). Mismos datos/acciones que la tabla de
          arriba, en una tarjeta vertical por proyecto: título + estado,
          barra de progreso, fecha de cierre, acciones. */}
      <Box
        role="table"
        aria-label="Proyectos"
        sx={{
          display: { xs: "flex", sm: "none" },
          flexDirection: "column",
          gap: 2,
        }}
      >
        {loading ? (
          SKELETON_ROWS.map((key) => (
            <Box
              key={key}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: `${radius.md}px`,
                backgroundColor: theme.palette.background.paper,
                p: 3,
              }}
            >
              <Box
                sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}
              >
                <Skeleton variant="text" width="50%" height={20} />
                <Skeleton
                  variant="rounded"
                  width={56}
                  height={18}
                  sx={{ borderRadius: "20px" }}
                />
              </Box>
              <Skeleton
                variant="rounded"
                height={5}
                sx={{ borderRadius: "20px", mb: 1.5 }}
              />
              <Skeleton variant="text" width="40%" height={16} sx={{ mb: 2 }} />
              <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                <Skeleton
                  variant="rounded"
                  width={28}
                  height={28}
                  sx={{ borderRadius: `${radius.sm}px` }}
                />
                <Skeleton
                  variant="rounded"
                  width={28}
                  height={28}
                  sx={{ borderRadius: `${radius.sm}px` }}
                />
              </Box>
            </Box>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {sortedProjects.map((row) => {
              const isCompleted = row.status === "completed";
              const percent = progressOf(row);

              return (
                <Box
                  key={row.id}
                  role="row"
                  component={motion.div}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.28, ease: EASE }}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${radius.md}px`,
                    backgroundColor: theme.palette.background.paper,
                    p: 3,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      role="cell"
                      sx={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        minWidth: 0,
                      }}
                    >
                      {row.title}
                    </Box>
                    <Box
                      role="cell"
                      sx={{
                        display: "inline-block",
                        flexShrink: 0,
                        fontSize: "10.5px",
                        fontWeight: 600,
                        borderRadius: "20px",
                        px: 1.75,
                        py: 0.4,
                        whiteSpace: "nowrap",
                        backgroundColor: isCompleted
                          ? semantic.successFilled
                          : secondary[700],
                        color: "#FFFFFF",
                      }}
                    >
                      {isCompleted ? "Completado" : "Activo"}
                    </Box>
                  </Box>

                  <Box
                    role="cell"
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1.5,
                    }}
                  >
                    <LinearProgress
                      variant="determinate"
                      value={percent}
                      aria-label={`${row.title}: ${Math.round(percent)}% recaudado`}
                      color={isCompleted ? "success" : "secondary"}
                      sx={{
                        flex: 1,
                        height: 5,
                        borderRadius: "20px",
                        backgroundColor: theme.palette.action.hover,
                      }}
                    />
                    <Box
                      component="span"
                      sx={{
                        fontSize: "11px",
                        color: theme.palette.text.secondary,
                        flexShrink: 0,
                      }}
                    >
                      {Math.round(percent)}%
                    </Box>
                  </Box>

                  <Box
                    role="cell"
                    sx={{
                      fontSize: 12,
                      color: theme.palette.text.secondary,
                      mb: 2,
                    }}
                  >
                    Cierre: {row.deadlineLabel}
                  </Box>

                  <Box
                    role="cell"
                    sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}
                  >
                    {!isCompleted && (
                      <IconButton
                        size="small"
                        onClick={() => onEdit(row.id)}
                        sx={{
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: `${radius.sm}px`,
                          color: theme.palette.primary.main,
                          "&:hover": {
                            borderColor: theme.palette.secondary.main,
                            color: theme.palette.secondary.main,
                          },
                        }}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(row)}
                      sx={{
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: `${radius.sm}px`,
                        color: theme.palette.text.secondary,
                        "&:hover": {
                          borderColor: theme.palette.error.main,
                          color: theme.palette.error.main,
                        },
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              );
            })}
          </AnimatePresence>
        )}
      </Box>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Eliminar proyecto"
        description={
          deleteTarget ? (
            <>
              Esta acción no se puede deshacer. Se eliminará{" "}
              <Box
                component="span"
                sx={{ fontWeight: 700, color: theme.palette.text.primary }}
              >
                &quot;{deleteTarget.title}&quot;
              </Box>{" "}
              permanentemente.
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => deleteTarget && onDelete(deleteTarget.id)}
        onClose={() => setDeleteTarget(null)}
      />
    </>
  );
}
