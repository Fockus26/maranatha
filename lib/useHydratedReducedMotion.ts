import { useReducedMotion } from "framer-motion";
import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * `useReducedMotion` de framer-motion, pero `false` en el servidor y en el
 * render de hidratación. El original da null en el servidor y true en el
 * cliente con "reducir movimiento": el HTML no coincide y React lanza un error
 * de hidratación (QA 20-10-2026). Úsalo en componentes que se renderizan en
 * el servidor; tras hidratar, devuelve la preferencia real.
 */
export function useHydratedReducedMotion(): boolean {
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const reduced = useReducedMotion();
  return hydrated && Boolean(reduced);
}
