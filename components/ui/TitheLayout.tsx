import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { layout } from "@/theme/tokens";

// Mismo ancho que tenía el modal (D105); token desde D109.
const LAYOUT_MAX_WIDTH = layout.contentNarrow;

interface TitheLayoutProps {
  /** Columna de texto (icono, eyebrow, título, párrafo, contador). */
  text: ReactNode;
  /** Columna del formulario / paso de pago. */
  form: ReactNode;
}

/**
 * Fila texto + formulario compartida por la sección Ofrendar del inicio y por
 * el modal, para que la separación no vuelva a divergir (D105).
 */
export function TitheLayout({ text, form }: TitheLayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: { xs: "center", md: "flex-start" },
        justifyContent: "center",
        gap: { xs: 6, md: 10 },
        maxWidth: LAYOUT_MAX_WIDTH,
        mx: "auto",
        width: "100%",
      }}
    >
      <Box
        sx={{
          maxWidth: 480,
          textAlign: { xs: "center", md: "left" },
          pt: { md: 2 },
        }}
      >
        {text}
      </Box>
      <Box sx={{ flexShrink: 0, width: "100%", maxWidth: 440 }}>{form}</Box>
    </Box>
  );
}
