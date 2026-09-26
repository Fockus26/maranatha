"use client";

import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { radius, typography } from "@/theme/tokens";

export interface AgendaItemProps {
  day: string;
  month: string;
  title: string;
  schedule: string;
  location: string;
  onClick?: () => void;
}

const DATE_BLOCK_WIDTH = 72;

export function AgendaItem({
  day,
  month,
  title,
  schedule,
  location,
  onClick,
}: AgendaItemProps) {
  const theme = useTheme();
  const onPrimary = theme.palette.primary.contrastText;

  const fillTransition = theme.transitions.create("transform", {
    duration: 400,
    easing: theme.transitions.easing.easeInOut, // cubic-bezier(0.4, 0, 0.2, 1)
  });
  const colorTransition = theme.transitions.create("color", {
    duration: theme.transitions.duration.short,
    easing: theme.transitions.easing.easeInOut,
    delay: 50,
  });

  return (
    <Box
      onClick={onClick}
      sx={{
        position: "relative",
        display: "flex",
        overflow: "hidden",
        borderRadius: `${radius.md}px`,
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.background.paper,
        cursor: onClick ? "pointer" : "default",
        // Fill: arranca en el borde derecho del date block, nunca desde 0
        "& .agenda-fill": {
          position: "absolute",
          top: 0,
          bottom: 0,
          left: DATE_BLOCK_WIDTH,
          right: 0,
          backgroundColor: theme.palette.primary.main,
          transform: "scaleX(0)",
          transformOrigin: "left",
          transition: fillTransition,
          zIndex: 0,
        },
        "&:hover .agenda-fill": { transform: "scaleX(1)" },
        "&:hover .agenda-title": { color: onPrimary },
        "&:hover .agenda-meta": { color: alpha(onPrimary, 0.75) },
      }}
    >
      {/* Date block — fondo navy siempre fijo, no animado */}
      <Box
        sx={{
          position: "relative",
          zIndex: 2,
          width: DATE_BLOCK_WIDTH,
          flexShrink: 0,
          backgroundColor: theme.palette.primary.main,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 800,
            fontSize: "26px",
            lineHeight: 1,
            color: onPrimary,
          }}
        >
          {day}
        </Typography>
        <Typography
          component="span"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: theme.typography.caption.fontSize,
            color: alpha(onPrimary, 0.7),
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            mt: 0.25, // ~1px de ajuste óptico, no es un paso de la escala — intencional
          }}
        >
          {month}
        </Typography>
      </Box>

      {/* Fill animado */}
      <Box className="agenda-fill" />

      {/* Contenido — padding alineado a la escala: base (16px) / md (12px) */}
      <Box sx={{ position: "relative", zIndex: 1, py: 3, px: 4, flex: 1 }}>
        <Typography
          className="agenda-title"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 600,
            fontSize: "16px",
            color: theme.palette.text.primary,
            mb: 1, // xs (4px)
            transition: colorTransition,
          }}
        >
          {title}
        </Typography>
        <Typography
          className="agenda-meta"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.text.secondary,
            transition: colorTransition,
          }}
        >
          {schedule} &nbsp;·&nbsp; {location}
        </Typography>
      </Box>
    </Box>
  );
}
