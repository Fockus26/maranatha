import type { Theme } from "@mui/material/styles";
import { gray, primary } from "@/theme/tokens";

/**
 * Botón outlined con contraste real (D084): "Seguir" de `SocialLinkCard` y
 * "Dar like o comentar" del visor de Instagram. Reposo: borde y texto en
 * `primary[700]` (claro) / `primary[200]` (oscuro). Hover: relleno sólido con
 * texto invertido, así el cambio se nota sin depender solo del color del borde.
 *
 * Pares medidos (texto/borde sobre el fondo; hover texto sobre relleno):
 * claro 16.6:1 y 16.6:1 · oscuro 8.1:1 sobre paper, 9.3:1 en hover.
 *
 * Uso: `sx={(t) => ({ ...outlinedActionSx(t), minHeight: 44 })}`.
 */
export function outlinedActionSx(theme: Theme) {
  const light = theme.palette.mode === "light";
  const accent = light ? primary[700] : primary[200];
  return {
    textTransform: "none",
    fontWeight: 600,
    borderColor: accent,
    color: accent,
    "&:hover": {
      borderColor: accent,
      backgroundColor: accent,
      color: light ? theme.palette.common.white : gray[900],
    },
  } as const;
}
