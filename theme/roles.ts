import { gray, onNavy, primary, secondary, semantic } from "./tokens";

export type ColorMode = "light" | "dark";

/**
 * Roles de color por modo (D109): la única fuente de los colores semánticos.
 * La leen la paleta de MUI (`theme/theme.ts`) y el generador de CSS
 * (`scripts/tokens-css.ts` → `app/tokens.css`), así los componentes MUI y los
 * de shadcn pintan lo mismo mientras conviven.
 */
export function modeRoles(mode: ColorMode) {
  const isLight = mode === "light";
  return {
    primary: {
      main: isLight ? primary[700] : primary[400],
      light: isLight ? primary[500] : primary[300],
      dark: isLight ? primary[900] : primary[600],
      contrastText: isLight ? "#FFFFFF" : gray[900],
    },
    secondary: {
      // Modo claro: el naranja de marca (`#F9750D`) sobre fondo claro no
      // llega a AA como texto (2.6:1) ni como fondo con texto blanco (2.8:1).
      // En claro baja a `secondary[700]` (`#B34C02`, ~5.5:1). El modo oscuro
      // conserva el naranja pleno (sobre navy sí contrasta).
      main: isLight ? secondary[700] : secondary[500],
      light: secondary[300],
      dark: secondary[700],
      contrastText: "#FFFFFF",
    },
    success: { main: semantic.success, contrastText: "#FFFFFF" },
    error: {
      main: isLight ? semantic.errorOnLight : semantic.errorOnDark,
      contrastText: isLight ? "#FFFFFF" : gray[900],
    },
    warning: { main: semantic.warning, contrastText: gray[900] },
    info: { main: semantic.info, contrastText: "#FFFFFF" },
    background: {
      default: isLight ? gray[50] : primary[900],
      paper: isLight ? "#FFFFFF" : gray[800],
    },
    text: {
      primary: isLight ? gray[900] : gray[50],
      secondary: isLight ? gray[600] : gray[300],
    },
    divider: isLight ? gray[200] : gray[700],
  } as const;
}

/**
 * Piezas navy fijas (D025, `data-surface="navy"`): no siguen el modo.
 * Solo los roles que esas piezas pintan; el resto se hereda del modo.
 */
export const navyRoles = {
  background: primary[900],
  paper: primary[900],
  text: onNavy.text,
  textSecondary: onNavy.muted,
  divider: onNavy.divider,
} as const;
