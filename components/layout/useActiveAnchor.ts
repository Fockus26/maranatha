"use client";

import { useEffect, useState } from "react";

/**
 * Scroll-spy para el Navbar de Home (D023): observa las secciones cuyo
 * `id` está en `ids` y devuelve el id de la que está actualmente "activa"
 * según cuál cruza la franja de activación del viewport.
 *
 * La franja (`rootMargin`) arranca un poco por debajo del navbar sticky y
 * termina antes del final del viewport, para que el link se sienta
 * sincronizado con lo que la persona está leyendo, no con el borde exacto
 * de la sección.
 */
export function useActiveAnchor(ids: string[]): string | null {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Empaquetamos el array para no re-suscribir el observer si el llamador
  // pasa un literal nuevo en cada render con el mismo contenido.
  const key = ids.join("|");

  useEffect(() => {
    const elements = key
      .split("|")
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-15% 0px -55% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [key]);

  return activeId;
}
