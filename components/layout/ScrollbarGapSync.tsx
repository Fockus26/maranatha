"use client";

import * as React from "react";

/**
 * Publica en `--scrollbar-gap` (en `<html>`) el ancho del riel que reserva
 * `scrollbar-gutter: stable` (D141): 12 px con barras clásicas (Windows), 0
 * con barras superpuestas (móvil, macOS).
 *
 * Con un Dialog o Sheet abierto, `app/globals.css` suelta el riel para que el
 * velo llegue al borde, y compensa el `body` con esta medida. La compensación
 * de react-remove-scroll no sirve: en las páginas que no desbordan (gran parte
 * del panel) la calcula en 0 y el contenido de detrás se ensancharía 12 px
 * (QA de versión 09). Con el riel siempre reservado, el ancho no depende del
 * contenido: basta medir al montar y al cambiar el tamaño de la ventana, nunca
 * con el scroll bloqueado (el riel ya está suelto y daría 0).
 */
export function ScrollbarGapSync() {
  React.useEffect(() => {
    const root = document.documentElement;
    const measure = () => {
      if (document.body.hasAttribute("data-scroll-locked")) return;
      const gap = Math.max(0, window.innerWidth - root.clientWidth);
      root.style.setProperty("--scrollbar-gap", `${gap}px`);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return null;
}
