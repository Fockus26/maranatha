import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { fontScale, radius, typography } from "@/theme/tokens";

/** Alto de un botón de acción del panel (MUI `medium`, texto 14 px). */
export const SKELETON_BUTTON_HEIGHT = 40;
/** Alto de la fila de acción "Nuevo proyecto" / "Ver todos" del Resumen. */
export const SKELETON_ACTION_HEIGHT = 48;

/** Contenedor de contenido del panel: mismo padding que las páginas reales. */
export function skeletonContentSx(maxWidth: number) {
  return {
    px: { xs: 3, md: 5 },
    pt: { xs: "32px", md: "48px" },
    pb: 5,
    maxWidth,
    mx: "auto",
  } as const;
}

/** Título h1 real de la página (no cambia entre carga y contenido). */
export function SkeletonHeading({
  title,
  subtitle,
}: {
  title: string;
  /** Texto fijo; sin él se pinta una línea gris. */
  subtitle?: ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="h1"
        sx={{
          fontFamily: typography.fontFamily.heading,
          fontWeight: 800,
          fontSize: fontScale[26],
          color: "text.primary",
          mb: 0.5,
        }}
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography sx={{ fontSize: fontScale[13], color: "text.secondary" }}>
          {subtitle}
        </Typography>
      ) : (
        <Skeleton variant="text" width={220} sx={{ fontSize: fontScale[13] }} />
      )}
    </Box>
  );
}

/** Botón en gris del encabezado. */
export function SkeletonButton({ width }: { width: number }) {
  return (
    <Skeleton
      variant="rounded"
      width={width}
      height={SKELETON_BUTTON_HEIGHT}
      sx={{ borderRadius: `${radius.sm}px` }}
    />
  );
}
