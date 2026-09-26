"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { radius } from "@/theme/tokens";

export interface DonationFormCardProps {
  width?: number;
  children: ReactNode;
}

export function DonationFormCard({
  width = 320,
  children,
}: DonationFormCardProps) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        // Antes `width` era un número fijo en cualquier tamaño de pantalla —
        // en mobile (viewports más angostos que el propio card, ej. 320-390px)
        // esto desbordaba el modal en vez de encogerse (fase 08). Por debajo
        // de `sm` el card ocupa el 100% de su contenedor; desde `sm` en
        // adelante recupera el ancho fijo original, sin cambiar nada en
        // tablet/desktop.
        width: { xs: "100%", sm: width },
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.lg}px`,
        backgroundColor: theme.palette.background.paper,
        p: { xs: 4, sm: 5.5 },
      }}
    >
      {children}
    </Box>
  );
}
