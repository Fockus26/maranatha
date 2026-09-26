"use client";

import { CssBaseline, type PaletteMode, ThemeProvider } from "@mui/material";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { MotionConfig } from "framer-motion";
import * as React from "react";
import { getTheme } from "./theme";

const STORAGE_KEY = "color-mode";
const COOKIE_KEY = "color-mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

type ColorModeContextValue = {
  mode: PaletteMode;
  toggleColorMode: () => void;
};

const ColorModeContext = React.createContext<ColorModeContextValue | null>(
  null,
);

export function useColorMode() {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx)
    throw new Error("useColorMode debe usarse dentro de <ThemeRegistry>");
  return ctx;
}

function persistMode(mode: PaletteMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  // La cookie es lo que le permite a `app/layout.tsx` resolver el modo en el
  // SERVIDOR (ver ese archivo) — sin ella, el HTML siempre sale en "light" y
  // el cliente lo corrige después, que es justo el flash que se reportó.
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API no está en Safari/Firefox estables; es una cookie propia sin datos sensibles.
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface ThemeRegistryProps {
  children: React.ReactNode;
  /**
   * Modo ya resuelto en el servidor (`app/layout.tsx`, leyendo la cookie
   * `color-mode`) — se usa tal cual como estado inicial, así el primer
   * render del cliente coincide exactamente con el HTML que ya llegó del
   * servidor y no hay ningún salto de color al cargar (el flash del divider
   * del navbar reportado por el cliente venía de que antes el estado
   * siempre arrancaba en "light" sin importar la preferencia real).
   */
  initialMode: PaletteMode;
}

export default function ThemeRegistry({
  children,
  initialMode,
}: ThemeRegistryProps) {
  const [mode, setMode] = React.useState<PaletteMode>(initialMode);

  // Migración de una sola vez: alguien que ya tenía una preferencia guardada
  // en `localStorage` de antes de este cambio (o cuyo sistema pide oscuro)
  // pero todavía no tiene la cookie nueva, la sincroniza ahora para que la
  // SIGUIENTE carga ya la resuelva el servidor sin flash. En esta carga en
  // particular sí puede alcanzar a verse un salto (mismo costo que una
  // primera visita) — es un costo de migración único, no algo que se repita
  // en cargas posteriores.
  React.useEffect(() => {
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith(`${COOKIE_KEY}=`));
    if (hasCookie) return;

    const saved = window.localStorage.getItem(
      STORAGE_KEY,
    ) as PaletteMode | null;
    const resolved: PaletteMode =
      saved === "light" || saved === "dark"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    persistMode(resolved);
    setMode((prev) => (prev === resolved ? prev : resolved));
  }, []);

  const toggleColorMode = React.useCallback(() => {
    setMode((prev) => {
      const next = prev === "light" ? "dark" : "light";
      persistMode(next);
      return next;
    });
  }, []);

  // Publica el modo real (no el de `prefers-color-scheme`) como atributo en
  // `<html>` — lo usa `app/globals.css` para el color del scroll
  // personalizado, que debe coincidir con el toggle de la app y no solo con
  // la preferencia del sistema operativo.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", mode);
  }, [mode]);

  const theme = React.useMemo(() => getTheme(mode), [mode]);
  const contextValue = React.useMemo(
    () => ({ mode, toggleColorMode }),
    [mode, toggleColorMode],
  );

  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ColorModeContext.Provider value={contextValue}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {/* `reducedMotion="user"` — respeta `prefers-reduced-motion` en TODA
              animación de framer-motion sin tener que consultarlo componente
              por componente (fase QA — cubre los tabs de `/proyectos` y
              `DashboardTable`, que no lo hacían). */}
          <MotionConfig reducedMotion="user">{children}</MotionConfig>
        </ThemeProvider>
      </ColorModeContext.Provider>
    </AppRouterCacheProvider>
  );
}
