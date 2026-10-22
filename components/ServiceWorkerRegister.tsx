"use client";

import * as React from "react";

/**
 * Registra `public/sw.js` (página "Sin conexión" al navegar sin red). Solo en
 * producción: en desarrollo un service worker deja respuestas viejas en caché.
 */
export function ServiceWorkerRegister() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Sin service worker el sitio funciona igual; solo falta la página offline.
    });
  }, []);

  return null;
}
