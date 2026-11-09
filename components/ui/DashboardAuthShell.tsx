"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import type { ReactNode } from "react";
import { patternLayerSx } from "@/theme/patterns";
import { fontScale, radius, typography } from "@/theme/tokens";

/**
 * Marco de las pantallas de acceso del dashboard — opción C ("minimal
 * editorial") del comparativo de /design: sin tarjeta, alineado a la
 * izquierda, con acceso para volver al sitio. En desktop se amplía y la
 * mitad derecha lleva el patrón diagonal del sitio desvaneciéndose hacia el
 * formulario. Lo comparten el login, "recuperar" y "restablecer" (D082), así
 * que las tres se ven como una sola pantalla.
 */
export function DashboardAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        px: { xs: 3, md: 8 },
        py: { xs: 4, md: 6 },
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          ...patternLayerSx(alpha(theme.palette.text.primary, 0.07)),
          display: { xs: "none", md: "block" },
          left: "45%",
          maskImage: "linear-gradient(to right, transparent, black 45%)",
        }}
      />
      <Box
        component="header"
        sx={{
          position: "relative",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: { xs: 8, md: 0 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 18,
              height: 18,
              borderRadius: `${radius.xs}px`,
              bgcolor: "secondary.main",
            }}
          />
          <Typography
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 600,
              fontSize: fontScale[14],
            }}
          >
            Iglesia Maranatha
          </Typography>
        </Box>
        <Button
          component={Link}
          href="/"
          size="small"
          color="inherit"
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          sx={{ textTransform: "none", fontSize: fontScale[12] }}
        >
          Volver al sitio
        </Button>
      </Box>

      <Box
        component="main"
        id="main-content"
        sx={{
          position: "relative",
          flex: { md: 1 },
          display: "flex",
          alignItems: "center",
          width: "100%",
          maxWidth: { xs: 360, md: 440 },
          py: { md: 6 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: { xs: 2.5, md: 3 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              color: "secondary.main",
            }}
          >
            <ShieldOutlinedIcon
              sx={{ fontSize: fontScale[16] }}
              aria-hidden="true"
            />
            <Typography
              sx={{
                fontSize: fontScale[11],
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                fontWeight: 600,
              }}
            >
              Área privada
            </Typography>
          </Box>
          <Typography
            component="h1"
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 800,
              fontSize: {
                xs: typography.size.h2.mobile,
                md: typography.size.h1.desktop,
              },
              lineHeight: typography.lineHeight.h1,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              fontSize: {
                xs: typography.size.small,
                md: typography.size.bodyLarge,
              },
              color: theme.palette.text.secondary,
              mt: { xs: -1, md: -1.5 },
            }}
          >
            {subtitle}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

/** Columna del formulario dentro del marco (mismo espaciado que el encabezado). */
export const authFormSx = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  gap: { xs: 2.5, md: 3 },
} as const;
