import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";
import type { ReactNode } from "react";

/**
 * Envoltorio común de los esqueletos del panel (D102): marca la región como
 * ocupada, anuncia "Cargando <página>…" a lectores de pantalla y apaga el
 * pulso de todos los `Skeleton` de dentro con "reducir movimiento" (solo CSS,
 * así también cubre las piezas reutilizadas de `DashboardStatBand` y
 * `DashboardTable`).
 */
export function SkeletonFrame({
  label,
  children,
}: {
  /** Nombre de la página, para el aviso "Cargando <label>…". */
  label: string;
  children: ReactNode;
}) {
  return (
    <Box
      aria-busy="true"
      sx={{
        "@media (prefers-reduced-motion: reduce)": {
          "& .MuiSkeleton-root, & .MuiSkeleton-root::after": {
            animation: "none",
          },
        },
      }}
    >
      <Box role="status" sx={visuallyHidden}>
        Cargando {label}…
      </Box>
      {children}
    </Box>
  );
}
