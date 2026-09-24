"use client";

import { useMemo } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import LinearProgress from "@mui/material/LinearProgress";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import FolderOutlinedIcon from "@mui/icons-material/FolderOutlined";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import { DashboardShell } from "@/components/layout/DashboardShell";
import { DashboardStatBand } from "@/components/ui/DashboardStatBand";
import { EmptyState } from "@/components/ui/EmptyState";
import { primary, radius, typography } from "@/theme/tokens";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";

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
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export default function DashboardResumenPage() {
  const theme = useTheme();
  const { projects, isLoading } = useDashboardProjects();
  const { openCreate } = useDashboardProjectModal();

  const stats = useMemo(() => {
    const totalRecaudado = projects.reduce((sum, project) => sum + project.currentAmount, 0);
    const totalMeta = projects.reduce((sum, project) => sum + project.goalAmount, 0);
    const activos = projects.filter((project) => project.status === "active");
    const completados = projects.filter((project) => project.status === "completed");
    const proximosCierres = [...activos]
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 4);
    return { totalRecaudado, totalMeta, activos, completados, proximosCierres };
  }, [projects]);

  return (
    <DashboardShell>
      {/* La página no tiene un título visible (el diseño arranca directo con
          la banda de KPIs); un h1 accesible da el encabezado de la página. */}
      <Typography component="h1" sx={visuallyHidden}>
        Resumen del dashboard
      </Typography>
      <DashboardStatBand
        loading={isLoading}
        stats={[
          { label: "Total recaudado", value: formatCurrency(stats.totalRecaudado), accent: true },
          { label: "Proyectos activos", value: String(stats.activos.length) },
          { label: "Proyectos completados", value: String(stats.completados.length) },
        ]}
      />

      <Box sx={{ px: { xs: 3, md: 5 }, py: 5, maxWidth: 1400, mx: "auto" }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" }, gap: 3 }}>
          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.lg}px`,
              backgroundColor: theme.palette.background.paper,
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography sx={{ fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: 18, color: theme.palette.text.primary, mb: 0.75 }}>
              Próximos cierres
            </Typography>
            <Typography sx={{ fontFamily: typography.fontFamily.body, fontSize: 13, color: theme.palette.text.secondary, mb: 3.5 }}>
              Proyectos activos ordenados por fecha de cierre.
            </Typography>

            {isLoading ? (
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {[0, 1, 2].map((key) => (
                  <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 3, py: 1 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ height: 14, width: "50%", mb: 1, borderRadius: 1, backgroundColor: theme.palette.action.hover }} />
                      <Box sx={{ height: 5, borderRadius: "20px", backgroundColor: theme.palette.action.hover }} />
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : stats.proximosCierres.length === 0 ? (
              <EmptyState compact icon={EventBusyRoundedIcon} title="No hay proyectos activos" description="Cuando crees uno, sus próximos cierres van a aparecer acá." />
            ) : (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                {stats.proximosCierres.map((project) => {
                  const percent = Math.min(Math.round((project.currentAmount / project.goalAmount) * 100), 100);
                  return (
                    <Box
                      key={project.id}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                        py: 2.5,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                        "&:last-of-type": { borderBottom: "none", pb: 0 },
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontFamily: typography.fontFamily.heading,
                            fontWeight: 600,
                            fontSize: 14,
                            color: theme.palette.text.primary,
                            mb: 1,
                          }}
                        >
                          {project.title}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percent}
                          aria-label={`${project.title}: ${percent}% recaudado`}
                          color="secondary"
                          sx={{ height: 5, borderRadius: "20px", backgroundColor: theme.palette.action.hover }}
                        />
                      </Box>
                      <Box sx={{ textAlign: "right", flexShrink: 0, minWidth: 110 }}>
                        <Typography sx={{ fontSize: 13, fontWeight: 500, color: theme.palette.text.primary }}>
                          {project.deadlineLabel}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary }}>
                          {formatCurrency(project.currentAmount)} / {formatCurrency(project.goalAmount)}
                        </Typography>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.lg}px`,
              backgroundColor: theme.palette.background.paper,
              p: { xs: 3, md: 4 },
            }}
          >
            <Typography sx={{ fontFamily: typography.fontFamily.heading, fontWeight: 700, fontSize: 18, color: theme.palette.text.primary, mb: 2.5 }}>
              Acciones rápidas
            </Typography>

            {/*
              Antes navegaba a `/dashboard/proyectos?new=1` para abrir el
              formulario ahí — el cliente pidió que este botón abra el modal
              directamente (para eso ya está "Ver todos los proyectos" abajo),
              así que ahora usa el modal global (`useDashboardProjectModal`,
              montado una sola vez en `app/dashboard/layout.tsx`, D059) y ya
              no navega.
            */}
            <Box
              component="button"
              type="button"
              onClick={openCreate}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                width: "100%",
                border: "none",
                // Navy fijo (no `primary.main`, que en oscuro es claro y con
                // blanco da 3.7:1).
                backgroundColor: primary[700],
                color: "#FFFFFF",
                borderRadius: `${radius.sm}px`,
                px: 2.25,
                py: 1.5,
                fontSize: 14,
                fontFamily: typography.fontFamily.body,
                fontWeight: 500,
                cursor: "pointer",
                mb: 1.5,
                transition: theme.transitions.create(["background-color"], { duration: theme.transitions.duration.shortest }),
                "&:hover": { backgroundColor: primary[800] },
              }}
            >
              <AddIcon fontSize="small" />
              Nuevo proyecto
            </Box>

            <Box
              component={Link}
              href="/dashboard/proyectos"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                border: `1px solid ${theme.palette.divider}`,
                color: theme.palette.text.primary,
                borderRadius: `${radius.sm}px`,
                px: 2.25,
                py: 1.5,
                fontSize: 14,
                fontWeight: 500,
                textDecoration: "none",
                transition: theme.transitions.create(["border-color", "color"], { duration: theme.transitions.duration.shortest }),
                "&:hover": { borderColor: theme.palette.secondary.main, color: theme.palette.secondary.main },
              }}
            >
              <FolderOutlinedIcon fontSize="small" />
              Ver todos los proyectos
            </Box>

            <Box sx={{ mt: 3.5, pt: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: 12, color: theme.palette.text.secondary, mb: 0.5 }}>
                Meta acumulada
              </Typography>
              <Typography sx={{ fontFamily: typography.fontFamily.heading, fontWeight: 800, fontSize: 20, color: theme.palette.text.primary }}>
                {formatCurrency(stats.totalMeta)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </DashboardShell>
  );
}
