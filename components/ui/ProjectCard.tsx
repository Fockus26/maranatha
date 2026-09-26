"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Image from "next/image";
import type { ReactNode } from "react";
import { primary, radius, semantic, typography } from "@/theme/tokens";

export type ProjectStatus = "active" | "completed";

export interface ProjectCardProps {
  layout?: "vertical" | "horizontal";
  title: string;
  description: string;
  imageUrl?: string;
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
  ctaLabel?: string;
  onCtaClick?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectCard({
  layout = "vertical",
  title,
  description,
  imageUrl,
  status,
  currentAmount,
  goalAmount,
  ctaLabel,
  onCtaClick,
}: ProjectCardProps) {
  const theme = useTheme();
  const isCompleted = status === "completed";
  const percent = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);
  const resolvedCtaLabel =
    ctaLabel ?? (isCompleted ? "Ver proyecto" : "Aportar");

  // Foto de la card vía `next/image` (optimización/AVIF/tamaños por
  // dispositivo). `sx` da el marco (medida, radios, fallback navy); la
  // imagen la cubre con `fill`.
  const CardPhoto = ({
    sx,
    sizes,
    children,
  }: {
    sx: object;
    sizes: string;
    children?: ReactNode;
  }) => (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
        backgroundColor: theme.palette.primary.dark,
        ...sx,
      }}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          style={{ objectFit: "cover" }}
        />
      )}
      {children}
    </Box>
  );

  // Chip "Activo" (rama sin foto, layout `horizontal` del listado): navy
  // fijo en vez de `theme.palette.primary.main`, mismo motivo que el chip de
  // `ProjectSidebar.tsx` — `primary.main` se ve "lavado" en modo oscuro y no
  // resaltaba lo suficiente (feedback directo del cliente); en modo oscuro
  // sube un peldaño en la escala (`primary[600]`) + borde sutil para marcar
  // el borde del chip. La rama `inverted` (sobre foto, con overlay navy) no
  // tiene este problema — se queda con el fondo blanco de siempre.
  const StatusChip = ({ inverted }: { inverted: boolean }) => (
    <Box
      sx={{
        display: "inline-block",
        flexShrink: 0,
        fontSize: "11px",
        fontWeight: 500,
        borderRadius: "20px",
        px: 2.25,
        py: 0.75,
        whiteSpace: "nowrap",
        backgroundColor: isCompleted
          ? semantic.successFilled
          : inverted
            ? alpha(theme.palette.common.white, 0.92)
            : theme.palette.mode === "dark"
              ? primary[600]
              : primary[700],
        color: isCompleted
          ? "#FFFFFF"
          : inverted
            ? theme.palette.primary.main
            : "#F5F6FA",
        border:
          !isCompleted && !inverted
            ? `1px solid ${alpha("#F5F6FA", 0.14)}`
            : "none",
      }}
    >
      {isCompleted ? "Completado" : "Activo"}
    </Box>
  );

  const ProgressBlock = ({ light }: { light: boolean }) => (
    <>
      <LinearProgress
        variant="determinate"
        value={percent}
        aria-label={`${percent}% recaudado de la meta`}
        color={isCompleted ? "success" : "secondary"}
        sx={{
          height: 6,
          borderRadius: "20px",
          mb: 2,
          backgroundColor: light
            ? alpha(theme.palette.common.white, 0.2)
            : theme.palette.action.hover,
        }}
      />
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "12px",
          mb: 4,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontWeight: 500,
            fontSize: "12px",
            color: light ? "#F5F6FA" : theme.palette.text.primary,
          }}
        >
          {formatCurrency(currentAmount)}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: "12px",
            color: light ? "#A6AEC7" : theme.palette.text.secondary,
          }}
        >
          de {formatCurrency(goalAmount)}
        </Typography>
      </Box>
    </>
  );

  // "Ver proyecto" (completado): antes un outlined `color="primary"` plano
  // (D048 lo señaló como "el mismo botón repetido" en Proyectos/Historia/
  // Prédicas). Ahora imita el CTA del Hero — neutro en reposo, y al
  // interactuar toma color, aquí azul en vez del naranja del Hero (fase 07).
  // "Aportar" (activo) no cambia: sigue siendo el CTA de alta prioridad
  // contained/secondary reservado por D011.
  const CtaButton = ({ sx = {} }: { sx?: object }) => (
    <Button
      onClick={onCtaClick}
      variant={isCompleted ? "outlined" : "contained"}
      color={isCompleted ? "primary" : "secondary"}
      sx={{
        ...(isCompleted && {
          borderColor: theme.palette.divider,
          color: theme.palette.text.secondary,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.08),
          },
        }),
        ...sx,
      }}
    >
      {resolvedCtaLabel}
    </Button>
  );

  if (layout === "horizontal") {
    return (
      <Box
        sx={{
          display: "flex",
          // Fase 08: por debajo de `sm` la fila (foto lateral + texto) se
          // apila en columna — el layout `horizontal` original (fila fija,
          // foto 200px) no cabía en mobile. Desde `sm` en adelante queda
          // exactamente igual que antes.
          flexDirection: { xs: "column", sm: "row" },
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: `${radius.lg}px`,
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <CardPhoto
          sx={{
            width: { xs: "100%", sm: 200 },
            height: { xs: 180, sm: "auto" },
          }}
          sizes="(max-width: 600px) 100vw, 200px"
        />
        <Box
          sx={{
            p: { xs: 4, sm: 5 },
            flex: 1,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 3, sm: 7 },
            alignItems: { xs: "stretch", sm: "flex-start" },
          }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "flex-start",
                mb: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontFamily: typography.fontFamily.heading,
                  fontWeight: 600,
                  fontSize: "17px",
                  color: theme.palette.text.primary,
                }}
              >
                {title}
              </Typography>
              <StatusChip inverted={false} />
            </Box>
            <Typography
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: theme.typography.body2.fontSize,
                color: theme.palette.text.secondary,
                mb: 3,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </Typography>
            <ProgressBlock light={false} />
          </Box>
          <CtaButton sx={{ width: { xs: "100%", sm: 120 }, flexShrink: 0 }} />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        overflow: "hidden",
        backgroundColor: theme.palette.background.paper,
        height: "100%",
      }}
    >
      <CardPhoto sx={{ height: 140 }} sizes="(max-width: 900px) 100vw, 400px">
        <Box sx={{ position: "absolute", top: 3, left: 3, zIndex: 1 }}>
          <StatusChip inverted={true} />
        </Box>
      </CardPhoto>

      <Box sx={{ p: 4, display: "flex", flexDirection: "column", flex: 1 }}>
        <Typography
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 600,
            fontSize: "17px",
            color: theme.palette.text.primary,
            mb: 1.5,
            minHeight: "calc(1.3em * 2)",
            lineHeight: 1.3,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.text.secondary,
            mb: 4,
            minHeight: "calc(1.5em * 3)",
            lineHeight: 1.5,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {description}
        </Typography>

        <Box sx={{ mt: "auto" }}>
          <ProgressBlock light={false} />
          <CtaButton sx={{ width: "100%" }} />
        </Box>
      </Box>
    </Box>
  );
}
