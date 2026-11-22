"use client";

import { usePathname } from "next/navigation";
import * as React from "react";

/**
 * Atrás tras un ancla nativa ("Saltar al contenido", `#agenda` del navbar).
 *
 * El navegador crea la entrada del historial de un `<a href="#…">` con
 * `state: null`, y el router de Next ignora el `popstate` de una entrada sin
 * su estado (`app-router.js`, `onPopState`: "if (!event.state) return"). Así,
 * ir a otra página y pulsar Atrás cambiaba la URL a `/#main-content` sin
 * volver a renderizar la página anterior.
 *
 * Arreglo: se guarda el último estado que dejó Next y, cuando un `hashchange`
 * deja la entrada sin estado, se le copia. La página no cambia con un ancla,
 * así que el árbol guardado es el correcto. `replaceState` con `__NA` pasa
 * directo por el parche de Next, sin otra navegación.
 */
export function HashHistorySync() {
  const pathname = usePathname();
  const lastState = React.useRef<unknown>(null);

  // Tras cada navegación de Next, su estado ya está en la entrada actual.
  // biome-ignore lint/correctness/useExhaustiveDependencies: se relee en cada cambio de ruta.
  React.useEffect(() => {
    if (window.history.state) lastState.current = window.history.state;
  }, [pathname]);

  React.useEffect(() => {
    const remember = () => {
      if (window.history.state) lastState.current = window.history.state;
    };
    const restore = () => {
      if (window.history.state === null && lastState.current)
        window.history.replaceState(
          lastState.current,
          "",
          window.location.href,
        );
      remember();
    };
    // Captura: antes de que el ancla cambie la entrada.
    document.addEventListener("click", remember, true);
    window.addEventListener("popstate", remember);
    window.addEventListener("hashchange", restore);
    return () => {
      document.removeEventListener("click", remember, true);
      window.removeEventListener("popstate", remember);
      window.removeEventListener("hashchange", restore);
    };
  }, []);

  return null;
}
