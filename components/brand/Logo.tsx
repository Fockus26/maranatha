"use client";

import { Box, type SxProps, type Theme, useTheme } from "@mui/material";
import type { ResponsiveStyleValue } from "@mui/system";
import { SITE_NAME } from "@/lib/siteConfig";
import { gray, primary, secondary, typography } from "@/theme/tokens";

/**
 * Logo provisional (D078). El símbolo es `public/brand/logo-mark.svg` (o su
 * `-inverse`): cambiar ese archivo cambia el logo en todo el sitio. El texto
 * se compone con Sora de `next/font`, por eso no se usa el SVG del logotipo
 * completo (dentro de un `<img>` no cargaría la fuente).
 *
 * Las proporciones replican las de `logo-horizontal.svg` (símbolo 64, texto a
 * 16 de separación, "IGLESIA" 12,5 y "Maranatha" 31) y `logo-compact.svg`
 * (símbolo 40, separación 12, "Maranatha" 24), en `em` del alto del símbolo.
 */
const PROPORTION = {
  horizontal: { gap: "0.25em", name: "0.484em", eyebrow: "0.195em" },
  compact: { gap: "0.3em", name: "0.6em" },
  eyebrowTracking: "0.256em",
  nameTracking: "-0.02em",
} as const;

type Variant = "horizontal" | "compact" | "mark" | "responsive";

interface LogoProps {
  /**
   * `responsive`: compacto por debajo de `sm` y horizontal desde `sm`
   * (navbar). `mark`: solo el símbolo.
   */
  variant?: Variant;
  /** `inverse` para fondos oscuros y las piezas navy fijas (D025). */
  tone?: "auto" | "inverse";
  /** Alto del símbolo en px; acepta valores por breakpoint. */
  size?: ResponsiveStyleValue<number>;
  sx?: SxProps<Theme>;
}

export function Logo({
  variant = "horizontal",
  tone = "auto",
  size = 40,
  sx,
}: LogoProps) {
  const theme = useTheme();
  const inverse = tone === "inverse" || theme.palette.mode === "dark";
  const nameColor = inverse ? gray[50] : primary[700];
  const eyebrowColor = inverse ? secondary[300] : secondary[700];

  const showText = variant !== "mark";
  const eyebrowDisplay =
    variant === "horizontal"
      ? "block"
      : variant === "responsive"
        ? { xs: "none", sm: "block" }
        : "none";
  const isHorizontal = (bp: "xs" | "sm") =>
    variant === "horizontal" || (variant === "responsive" && bp === "sm");
  const pick = (key: "gap" | "name") => ({
    xs: isHorizontal("xs")
      ? PROPORTION.horizontal[key]
      : PROPORTION.compact[key],
    sm: isHorizontal("sm")
      ? PROPORTION.horizontal[key]
      : PROPORTION.compact[key],
  });

  return (
    <Box
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          gap: pick("gap"),
          fontSize: size,
          lineHeight: 1,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Box
        component="img"
        src={inverse ? "/brand/logo-mark-inverse.svg" : "/brand/logo-mark.svg"}
        // Con texto al lado, el símbolo es decorativo: el nombre ya se lee.
        alt={showText ? "" : SITE_NAME}
        width={64}
        height={64}
        sx={{ width: "1em", height: "1em", display: "block", flexShrink: 0 }}
      />
      {showText && (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            fontFamily: typography.fontFamily.heading,
            whiteSpace: "nowrap",
          }}
        >
          <Box
            component="span"
            sx={{
              display: eyebrowDisplay,
              fontSize: PROPORTION.horizontal.eyebrow,
              fontWeight: typography.weight.h3,
              letterSpacing: PROPORTION.eyebrowTracking,
              textTransform: "uppercase",
              color: eyebrowColor,
              mb: "0.35em",
            }}
          >
            Iglesia
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: pick("name"),
              fontWeight: typography.weight.h2,
              letterSpacing: PROPORTION.nameTracking,
              color: nameColor,
            }}
          >
            Maranatha
          </Box>
        </Box>
      )}
    </Box>
  );
}
