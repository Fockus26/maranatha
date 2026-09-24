"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import AddIcon from "@mui/icons-material/Add";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import SearchOffRoundedIcon from "@mui/icons-material/SearchOffRounded";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardTable, type DashboardProjectRow } from "@/components/ui/DashboardTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { radius, typography } from "@/theme/tokens";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";

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
  const theme = useTheme();
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

  const activos = projects.filter((project) => project.status === "active").length;
  const completados = projects.filter((project) => project.status === "completed").length;

  return (
    <DashboardShell>
      <Box sx={{ px: { xs: 3, md: 5 }, pt: { xs: "32px", md: "48px" }, pb: 5, maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 4, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography component="h1" sx={{ fontFamily: typography.fontFamily.heading, fontWeight: 800, fontSize: 26, color: theme.palette.text.primary, mb: 0.5 }}>
              Proyectos
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.palette.text.secondary }}>
              {projects.length} proyectos · {activos} activos, {completados} completados
            </Typography>
          </Box>
          {/* `color="primary"` + modo oscuro usa `primary.contrastText`
              (`gray[900]`, casi negro — D0XX del theme) como color de texto,
              que no es lo que se quiere para este botón puntual: el cliente
              pidió texto blanco fijo sin importar el modo. */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={openCreate}
            sx={{ color: "#FFFFFF" }}
          >
            Nuevo proyecto
          </Button>
        </Box>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: `${radius.sm}px`,
            backgroundColor: theme.palette.background.paper,
            px: 2,
            py: 1.25,
            width: { xs: "100%", sm: 320 },
            mb: 3,
            color: theme.palette.text.secondary,
          }}
        >
          <SearchRoundedIcon fontSize="small" />
          <Box
            component="input"
            value={query}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Buscar proyecto…"
            sx={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontFamily: typography.fontFamily.body,
              fontSize: 13,
              color: theme.palette.text.primary,
              width: "100%",
              "&::placeholder": { color: theme.palette.text.secondary },
            }}
          />
        </Box>

        {/* Sin resultados de búsqueda (con proyectos existentes) — distinto
            del caso "sin ningún proyecto todavía", que resuelve el propio
            `DashboardTable` vía su prop `onCreate` (fase 09, D067). */}
        {!isLoading && query.trim() && filteredRows.length === 0 ? (
          <Box sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: `${radius.lg}px`, backgroundColor: theme.palette.background.paper }}>
            <EmptyState
              icon={SearchOffRoundedIcon}
              title={`Ningún proyecto coincide con "${query}"`}
              description="Probá con otro título o borrá la búsqueda."
              ctaLabel="Limpiar búsqueda"
              onCtaClick={() => setQuery("")}
            />
          </Box>
        ) : (
          <DashboardTable projects={filteredRows} onEdit={openEdit} onDelete={deleteProject} loading={isLoading} onCreate={openCreate} />
        )}
      </Box>
    </DashboardShell>
  );
}
