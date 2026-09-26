"use client";

import InstagramIcon from "@mui/icons-material/Instagram";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { primary, radius, semantic, typography } from "@/theme/tokens";
import type { ProjectStatus } from "./ProjectCard";

export interface Encargado {
  name: string;
  role: string;
  imageUrl: string;
  instagramUrl?: string;
}

export interface ProjectSidebarProps {
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
  deadlineLabel: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  encargados: Encargado[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectSidebar({
  status,
  currentAmount,
  goalAmount,
  deadlineLabel,
  ctaLabel,
  onCtaClick,
  encargados,
}: ProjectSidebarProps) {
  const theme = useTheme();
  const isCompleted = status === "completed";
  const percent = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);

  return (
    <Box
      sx={{
        position: "sticky",
        top: 20,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        backgroundColor: theme.palette.background.paper,
        p: 4,
      }}
    >
      <Box
        sx={{
          display: "inline-block",
          fontSize: "11px",
          fontWeight: 700,
          letterSpacing: "0.03em",
          borderRadius: "20px",
          px: 2.25,
          py: 0.75,
          // Navy fijo (no `primary.main`, que en modo oscuro es un azul claro
          // "lavado" — mismo criterio de fondo fijo que el date block de
          // Agenda/AgendaItem, D014/D025). Revisión: en modo oscuro el navy
          // más profundo (`primary[700]`, `#101B45`) queda casi del mismo
          // valor que la superficie del card (`gray[800]`, `#1D2032`) y no
          // resaltaba lo suficiente (feedback directo del cliente) — en modo
          // oscuro sube un peldaño en la escala (`primary[600]`, más claro y
          // saturado) y se suma un borde sutil claro para marcar el borde del
          // chip incluso cuando el contraste tonal es bajo. "Completado" se
          // queda en success (verde), ya lo suficientemente distintivo.
          backgroundColor: isCompleted
            ? semantic.successFilled
            : theme.palette.mode === "dark"
              ? primary[600]
              : primary[700],
          color: isCompleted ? "#FFFFFF" : "#F5F6FA",
          border: isCompleted ? "none" : `1px solid ${alpha("#F5F6FA", 0.14)}`,
        }}
      >
        {isCompleted ? "Completado" : "Activo"}
      </Box>

      <Typography
        sx={{
          fontFamily: typography.fontFamily.heading,
          fontWeight: 800,
          fontSize: "22px",
          color: theme.palette.text.primary,
          mt: 3,
          mb: 0.5,
        }}
      >
        {formatCurrency(currentAmount)}
      </Typography>
      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "12px",
          color: theme.palette.text.secondary,
          mb: 2.5,
        }}
      >
        recaudado de {formatCurrency(goalAmount)}
      </Typography>

      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`${percent}% recaudado de la meta`}
        color={isCompleted ? "success" : "secondary"}
        sx={{
          height: 6,
          borderRadius: "20px",
          mb: 1.5,
          backgroundColor: theme.palette.action.hover,
        }}
      />
      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "11px",
          color: theme.palette.text.secondary,
          mb: 4,
        }}
      >
        {percent}% · {deadlineLabel}
      </Typography>

      {/* "Ver proyecto" (completado): mismo tratamiento que el CTA del Hero —
          neutro en reposo, acento azul al interactuar — aplicado también acá
          (fase 07, ronda de feedback siguiente a D049; antes solo se había
          actualizado la instancia de `ProjectCard.tsx`, esta quedó pendiente). */}
      <Button
        onClick={onCtaClick}
        fullWidth
        variant={isCompleted ? "outlined" : "contained"}
        color={isCompleted ? "primary" : "secondary"}
        sx={{
          mb: 4.5,
          ...(isCompleted && {
            borderColor: theme.palette.divider,
            color: theme.palette.text.secondary,
            "&:hover": {
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              backgroundColor: alpha(theme.palette.primary.main, 0.08),
            },
          }),
        }}
      >
        {ctaLabel ?? (isCompleted ? "Ver proyecto" : "Aportar")}
      </Button>

      {encargados.length > 0 && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 3.5 }}>
          <Typography
            sx={{
              fontFamily: typography.fontFamily.body,
              fontSize: "11px",
              // Fase QA (a11y): antes `text.disabled` (~2.7:1 sobre `background.paper`)
              // — es un encabezado de sección real, no texto inhabilitado.
              color: theme.palette.text.secondary,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              mb: 2.5,
            }}
          >
            Encargados
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {encargados.map((encargado) => (
              <Box
                key={encargado.name}
                sx={{ display: "flex", alignItems: "center", gap: 2.5 }}
              >
                <Avatar
                  src={encargado.imageUrl}
                  alt={encargado.name}
                  sx={{ width: 48, height: 48, flexShrink: 0 }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontFamily: typography.fontFamily.heading,
                      fontWeight: 600,
                      fontSize: "13px",
                      color: theme.palette.text.primary,
                    }}
                  >
                    {encargado.name}
                  </Typography>
                  <Typography
                    sx={{
                      fontFamily: typography.fontFamily.body,
                      fontSize: "11px",
                      color: theme.palette.text.secondary,
                    }}
                  >
                    {encargado.role}
                  </Typography>
                </Box>
                {encargado.instagramUrl && (
                  <IconButton
                    component="a"
                    href={encargado.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Instagram de ${encargado.name}`}
                    size="small"
                    sx={{
                      width: 26,
                      height: 26,
                      flexShrink: 0,
                      borderRadius: `${radius.sm}px`,
                      border: `1px solid ${theme.palette.divider}`,
                      color: theme.palette.primary.main,
                      "&:hover": {
                        borderColor: theme.palette.secondary.main,
                        color: theme.palette.secondary.main,
                        backgroundColor: alpha(
                          theme.palette.secondary.main,
                          0.08,
                        ),
                      },
                    }}
                  >
                    <InstagramIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                )}
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
