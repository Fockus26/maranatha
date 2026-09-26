"use client";

import { motion } from "framer-motion";
import * as React from "react";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Transición entre páginas (fase 07, pedido del cliente) — fade + slide-up
 * corto en la entrada de cada página, mismo timing/curva que el resto de
 * animaciones del sitio (`Reveal.tsx`, `Agenda.tsx`: easing
 * `[0.2, 0.8, 0.2, 1]`), pero más rápida (0.3s) por ser navegación y no
 * entrada de contenido en scroll.
 *
 * Se usa desde `app/template.tsx` (no desde `app/layout.tsx`) — a
 * diferencia de un layout, Next.js vuelve a montar un `template.tsx` en
 * cada navegación, así que basta con animar el MONTAJE de este componente
 * para tener la sensación de transición, sin necesidad de `AnimatePresence`
 * ni de coordinar una animación de salida.
 *
 * Primer intento (D055): se envolvía `{children}` directo en
 * `app/layout.tsx` con `AnimatePresence` + `key={pathname}` para animar
 * también la SALIDA de la página anterior. Se revirtió — la página de
 * Proyectos ya trae su propio `AnimatePresence` (`mode="popLayout"`, para
 * animar tabs/lista↔cuadrícula) y anidarlo dentro de otro `AnimatePresence`
 * en `mode="wait"` dejaba esa página en un estado a medio montar (el
 * cliente reportó tener que recargar para ver las tarjetas). Este enfoque
 * más simple —solo animar la entrada, vía `template.tsx`— no depende de
 * `AnimatePresence` a nivel de página y no choca con animaciones internas
 * de ninguna ruta.
 *
 * Respeta `prefers-reduced-motion` (mismo criterio que el scroll suave
 * global en `app/globals.css`): en ese caso no hay fade ni slide.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);

    const handleChange = (event: MediaQueryListEvent) =>
      setReduceMotion(event.matches);
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
