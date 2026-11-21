"use client";

import { MotionConfig } from "framer-motion";
import * as React from "react";
import type { ColorMode } from "./roles";

const STORAGE_KEY = "color-mode";
const COOKIE_KEY = "color-mode";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

type ColorModeContextValue = {
  mode: ColorMode;
  toggleColorMode: () => void;
};

const ColorModeContext = React.createContext<ColorModeContextValue | null>(
  null,
);

export function useColorMode() {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx)
    throw new Error("useColorMode debe usarse dentro de <ColorModeProvider>");
  return ctx;
}

function persistMode(mode: ColorMode) {
  window.localStorage.setItem(STORAGE_KEY, mode);
  // La cookie es lo que le permite a `app/layout.tsx` resolver el modo en el
  // SERVIDOR (ver ese archivo) — sin ella, el HTML siempre sale en "light" y
  // el cliente lo corrige después, que es justo el flash que se reportó.
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API no está en Safari/Firefox estables; es una cookie propia sin datos sensibles.
  document.cookie = `${COOKIE_KEY}=${mode}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

interface ColorModeProviderProps {
  children: React.ReactNode;
  /**
   * Modo ya resuelto en el servidor (`app/layout.tsx`, leyendo la cookie
   * `color-mode`) — se usa tal cual como estado inicial, así el primer
   * render del cliente coincide exactamente con el HTML que ya llegó del
   * servidor y no hay ningún salto de color al cargar (el flash del divider
   * del navbar reportado por el cliente venía de que antes el estado
   * siempre arrancaba en "light" sin importar la preferencia real).
   */
  initialMode: ColorMode;
}

/**
 * Modo claro/oscuro del sitio (D053, D140): el toggle manda, no
 * `prefers-color-scheme`. Publica el modo en `data-color-mode` de `<html>`,
 * que leen los roles de `app/tokens.css` y la variante `dark:`; los colores,
 * la tipografía base, el scroll y la selección viven en CSS (`app/globals.css`,
 * D141), sin tema de JavaScript.
 */
export default function ColorModeProvider({
  children,
  initialMode,
}: ColorModeProviderProps) {
  const [mode, setMode] = React.useState<ColorMode>(initialMode);

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

    const saved = window.localStorage.getItem(STORAGE_KEY) as ColorMode | null;
    const resolved: ColorMode =
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
  // `<html>`: de él cuelgan los roles por modo de `app/tokens.css`, la
  // variante `dark:` y el scroll y la selección de `app/globals.css`.
  React.useEffect(() => {
    document.documentElement.setAttribute("data-color-mode", mode);
  }, [mode]);

  const contextValue = React.useMemo(
    () => ({ mode, toggleColorMode }),
    [mode, toggleColorMode],
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      {/* `reducedMotion="user"` — respeta `prefers-reduced-motion` en TODA
          animación de framer-motion sin tener que consultarlo componente
          por componente (fase QA — cubre los tabs de `/proyectos` y
          `DashboardTable`, que no lo hacían). */}
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ColorModeContext.Provider>
  );
}
