import type { PaletteMode } from "@mui/material";
import { radius, scrollbar, selection } from "./tokens";

/**
 * Selección de texto y barra de scroll globales (adenda de diseño).
 *
 * Van por `MuiCssBaseline` en vez de `globals.css` para leer los tokens: el
 * tema ya se recalcula con el modo real (toggle + cookie, D053), así que los
 * colores siguen al modo elegido aunque difiera del del sistema.
 *
 * Las piezas navy fijas (D025) se marcan con `data-surface="navy"` y
 * redefinen las variables `--sb-*` y la selección para sus descendientes.
 */
const NAVY = '[data-surface="navy"]';

type ScrollbarSet = {
  track: string;
  thumb: string;
  hover: string;
  active: string;
};

function scrollbarVars(set: ScrollbarSet) {
  return {
    "--sb-track": set.track,
    "--sb-thumb": set.thumb,
    "--sb-hover": set.hover,
    "--sb-active": set.active,
  };
}

function thumbRules(
  size: number,
  inset: number,
  insetHover: number,
  round: number,
) {
  return {
    "&::-webkit-scrollbar": { width: size, height: size },
    "&::-webkit-scrollbar-track": { backgroundColor: "var(--sb-track)" },
    "&::-webkit-scrollbar-corner": { backgroundColor: "var(--sb-track)" },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "var(--sb-thumb)",
      border: `${inset}px solid transparent`,
      backgroundClip: "padding-box",
      borderRadius: round,
      minHeight: scrollbar.minThumb,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: "var(--sb-hover)",
      borderWidth: insetHover,
    },
    "&::-webkit-scrollbar-thumb:active": {
      backgroundColor: "var(--sb-active)",
      borderWidth: insetHover,
    },
  };
}

export function getGlobalStyles(mode: PaletteMode) {
  const sel = mode === "light" ? selection.light : selection.dark;
  const sb = mode === "light" ? scrollbar.light : scrollbar.dark;
  const { size, inset } = scrollbar;

  return {
    // `forced-colors`: no se pinta nada; manda el sistema.
    "@media not all and (forced-colors: active)": {
      html: {
        ...scrollbarVars(sb),
        // Reserva el riel siempre: el layout no salta cuando aparece.
        scrollbarGutter: "stable",
        ...thumbRules(size.page, inset.page, inset.pageHover, radius.sm),
      },
      // Cajas internas (tablas, modales, sidebar): riel más fino.
      "body *": thumbRules(
        size.inner,
        inset.inner,
        inset.innerHover,
        radius.xs,
      ),
      [NAVY]: scrollbarVars(scrollbar.navy),

      "::selection": { backgroundColor: sel.bg, color: sel.text },
      [`${NAVY} ::selection`]: {
        backgroundColor: selection.dark.bg,
        color: selection.dark.text,
      },

      // Firefox: solo `scrollbar-color` / `scrollbar-width`. Va dentro de
      // `@supports` porque Chrome 121+ ignora las reglas -webkit si ve estas.
      "@supports not selector(::-webkit-scrollbar)": {
        html: {
          scrollbarColor: "var(--sb-thumb) var(--sb-track)",
          scrollbarWidth: "auto",
        },
        "body *": {
          scrollbarColor: "var(--sb-thumb) var(--sb-track)",
          scrollbarWidth: "thin",
        },
      },
    },
  };
}
