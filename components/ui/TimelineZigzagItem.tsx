"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { radius, typography } from "@/theme/tokens";

export interface TimelineZigzagItemProps {
  year: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Foto a la derecha (default) o a la izquierda — alterna hito a hito. */
  reverse?: boolean;
}

/**
 * Variante con foto de `TimelineItem` (D015) para la página completa de
 * Historia (`/historia`, fase 07, D043) — foto grande + texto, alternando
 * de lado en lado ("zigzag"). El año conserva el mismo tratamiento
 * tipográfico (Sora 800, color de marca) que la versión sin foto usada en
 * el resumen de Home, pero en `secondary.main` fijo en vez del gradiente
 * cronológico — con solo 2 posiciones por fila (izquierda/derecha) un
 * degradado de color por hito no se lee con la misma claridad que en la
 * lista vertical compacta de Home.
 */
export function TimelineZigzagItem({
  year,
  title,
  description,
  imageUrl,
  reverse = false,
}: TimelineZigzagItemProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: reverse ? "row-reverse" : "row" },
        alignItems: "center",
        gap: { xs: 4, md: 7 },
      }}
    >
      <Box
        sx={{
          flex: 1,
          width: "100%",
          height: { xs: 220, md: 280 },
          borderRadius: `${radius.lg}px`,
          flexShrink: 0,
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
          backgroundColor: imageUrl ? undefined : theme.palette.primary.dark,
          backgroundSize: "cover",
          // "top" en vez de "center" (fase 07, ajuste post-entrega): en fotos
          // de personas/grupos el sujeto suele estar en el tercio superior —
          // centrar el crop lo cortaba. Mismo criterio para las 6 fotos del
          // zigzag, sin excepción por hito.
          backgroundPosition: "center top",
        }}
      />

      <Box sx={{ flex: 1, textAlign: { xs: "center", md: "left" } }}>
        <Typography
          component="span"
          sx={{
            display: "block",
            fontFamily: typography.fontFamily.heading,
            fontWeight: 800,
            fontSize: "34px",
            lineHeight: 1,
            color: theme.palette.secondary.main,
            mb: 1.5,
          }}
        >
          {year}
        </Typography>
        <Typography
          component="h3"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 700,
            fontSize: "20px",
            color: theme.palette.text.primary,
            mb: 1.5,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: theme.typography.body2.fontSize,
            lineHeight: 1.65,
            color: theme.palette.text.secondary,
            maxWidth: 440,
            mx: { xs: "auto", md: 0 },
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
