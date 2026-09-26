"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { typography as typographyTokens } from "@/theme/tokens";

/**
 * Empty state genérico — fase 09 (D067). Tratamiento elegido por el cliente
 * entre 3 opciones (ícono+mensaje+CTA / solo texto / ilustración custom por
 * contexto): un ícono outline en un bloque circular `action.hover`, un
 * mensaje breve en Sora, y un CTA opcional — mismo componente reutilizado en
 * cualquier lista vacía del sitio (`DashboardTable` sin proyectos o sin
 * resultados de búsqueda, `/proyectos` sin resultados de filtro, "Próximos
 * cierres" del Resumen sin proyectos activos) en vez de resolver cada caso
 * con texto suelto.
 *
 * `compact` reduce el padding/tamaño de ícono para contextos donde el
 * empty state vive dentro de una tarjeta ya angosta (ej. "Próximos
 * cierres"), sin dejar de ser el mismo componente/lenguaje visual.
 */
export interface EmptyStateProps {
  icon: SvgIconComponent;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  compact,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{ textAlign: "center", py: compact ? 3 : { xs: 6, md: 8 }, px: 3 }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: compact ? 40 : 56,
          height: compact ? 40 : 56,
          borderRadius: "50%",
          backgroundColor: theme.palette.action.hover,
          color: theme.palette.text.secondary,
          mb: compact ? 1.5 : 2.5,
        }}
      >
        <Icon sx={{ fontSize: compact ? 20 : 28 }} />
      </Box>
      <Typography
        sx={{
          fontFamily: typographyTokens.fontFamily.heading,
          fontWeight: 600,
          fontSize: compact ? 14 : 16,
          color: theme.palette.text.primary,
        }}
      >
        {title}
      </Typography>
      {description && (
        <Typography
          sx={{
            fontFamily: typographyTokens.fontFamily.body,
            fontSize: compact ? 13 : 14,
            color: theme.palette.text.secondary,
            maxWidth: 360,
            mx: "auto",
            mt: 0.75,
          }}
        >
          {description}
        </Typography>
      )}
      {ctaLabel && onCtaClick && (
        <Button
          variant="outlined"
          color="primary"
          size={compact ? "small" : "medium"}
          onClick={onCtaClick}
          sx={{ mt: compact ? 2 : 3 }}
        >
          {ctaLabel}
        </Button>
      )}
    </Box>
  );
}
