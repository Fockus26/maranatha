"use client";

import { motion } from "framer-motion";
import { type ReactNode, useSyncExternalStore } from "react";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { breakpoints } from "@/theme/tokens";

// Por debajo de `sm` (el `down("sm")` de MUI: 0,05 px menos que el breakpoint).
const MOBILE_QUERY = `(max-width: ${breakpoints.sm - 0.05}px)`;

function subscribeMobile(onChange: () => void) {
  const query = window.matchMedia(MOBILE_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
}

/**
 * Animación de entrada al hacer scroll (fase 07, integrada a partir de la
 * Dirección A del comparador de "ritmo visual" — /design) — fade + slide-up
 * corto, disparado una sola vez cuando el bloque entra en viewport.
 *
 * Se usa para envolver el heading y el contenido principal de cada sección
 * de Home (grid de cards, timeline, mosaico de Agenda, etc.), con un
 * `delay` leve entre ambos para que el heading aparezca primero y el
 * contenido lo siga — mismo timing (0.7s, curva suave) que se mostró en el
 * comparador. No se aplica a `Hero.tsx` (que ya tiene su propia animación
 * de entrada por slide) ni a `PhotoAnchorBand.tsx` (que usa parallax en vez
 * de reveal).
 */
export function Reveal({ children, delay = 0, y = 18 }: RevealProps) {
  // a11y (WCAG 2.3.3): con "reducir movimiento" activo, el contenido aparece
  // directamente sin fade/slide — no se anima nada.
  const reduceMotion = useHydratedReducedMotion();
  // Feedback de cliente (ronda post-fase 08): en mobile las secciones suelen
  // ser más altas que el viewport — con el mismo `amount` que desktop (25%
  // del bloque visible antes de disparar) la animación tardaba en verse, o
  // el usuario ya había scrolleado de largo antes de que se cumpliera. Por
  // debajo de `sm` basta con que un 10% del bloque sea visible.
  // `useSyncExternalStore`: el servidor y el render de hidratación asumen
  // escritorio (sin `window`); tras hidratar lee el real, sin desajuste.
  const isMobile = useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
  const amount = isMobile ? 0.1 : 0.25;

  // Después de todos los hooks: salir antes violaría el orden de hooks.
  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
