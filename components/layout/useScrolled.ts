"use client";

import * as React from "react";

/**
 * `true` cuando la página bajó más de `threshold` px. Reemplaza al
 * `useScrollTrigger({ disableHysteresis: true, threshold })` de MUI (D122):
 * el navbar solo cambia de borde a sombra al despegarse de arriba.
 */
export function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);

  return scrolled;
}
