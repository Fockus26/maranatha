"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { fontScale, radius } from "@/theme/tokens";
import { outlinedActionSx } from "./outlinedActionSx";

export interface SocialLinkCardProps {
  platform: string;
  handle: string;
  href: string;
  icon: SvgIconComponent;
  ctaLabel: string;
  /**
   * Cuando es `true`, omite el border/radius/fondo/padding propios del
   * card — para embeberlo dentro de otro contenedor que ya resuelve esos
   * estilos (ej. el panel de cuenta activa en `SocialLinks.tsx`, D036).
   * Por defecto `false`: se comporta exactamente igual que antes (D013).
   */
  bare?: boolean;
  /** Foto de perfil real (feed de Behold); si falta, se muestra `icon`. */
  avatarUrl?: string;
  /** Dato extra tras el handle, p. ej. "7,3 mil seguidores". */
  meta?: string;
}

export function SocialLinkCard({
  platform,
  handle,
  href,
  icon: Icon,
  ctaLabel,
  bare = false,
  avatarUrl,
  meta,
}: SocialLinkCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        ...(bare
          ? {}
          : {
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: `${radius.lg}px`,
              p: 2,
              backgroundColor: "background.paper",
            }),
      }}
    >
      <Box
        sx={{
          width: 40,
          height: 40,
          borderRadius: `${radius.md}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          backgroundColor: (t) =>
            t.palette.mode === "light" ? "primary.50" : "primary.dark",
        }}
      >
        {avatarUrl ? (
          <Box
            component="img"
            src={avatarUrl}
            alt=""
            sx={{
              width: "100%",
              height: "100%",
              borderRadius: "inherit",
              objectFit: "cover",
            }}
          />
        ) : (
          <Icon
            sx={{
              fontSize: fontScale[20],
              color: (t) =>
                t.palette.mode === "light" ? "primary.main" : "primary.light",
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          component="p"
          sx={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: fontScale[13],
            color: "text.primary",
          }}
        >
          {platform}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-body)",
            fontSize: fontScale[12],
            color: "text.secondary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {handle}
          {meta && ` · ${meta}`}
        </Typography>
      </Box>

      {/* Outlined con contraste real en reposo y relleno al hover (D084). */}
      <Button
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        variant="outlined"
        size="small"
        sx={(t) => ({
          ...outlinedActionSx(t),
          flexShrink: 0,
          minHeight: 44, // área táctil (design-qa fase 09)
        })}
      >
        {ctaLabel}
      </Button>
    </Box>
  );
}
