"use client";

import { usePathname, useSearchParams } from "next/navigation";
import * as React from "react";
import { cn } from "@/lib/utils";
import { navProgress } from "@/theme/tokens";
import styles from "./NavigationProgress.module.css";

type Phase = "idle" | "loading" | "done";

/**
 * Barra de progreso al navegar (D095). `PageTransition` solo anima cuando la
 * página nueva ya montó; entre el clic y ese momento no pasaba nada. Next no
 * expone un evento global de navegación, así que se detecta en captura el clic
 * en un `<a>` interno que cambia de ruta (o `popstate` hacia una ruta distinta de
 * la renderizada) y se completa cuando
 * cambia `usePathname()`/`useSearchParams()`. Si en `navProgress.timeoutMs` no
 * llegó nada (ancla, descarga, navegación cancelada) se oculta sola.
 */
function NavigationProgressInner() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [phase, setPhase] = React.useState<Phase>("idle");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  // Navegación en curso. Es un ref y no `phase`: en atrás/adelante la ruta nueva
  // puede comprometerse antes de que el `setPhase("loading")` se pinte, y el
  // efecto de llegada vería "idle" y dejaría la barra colgada.
  const pendingRef = React.useRef(false);
  // Ruta ya renderizada (comprometida): `popstate` solo abre la barra si la URL
  // del navegador difiere de ella.
  const committedRef = React.useRef(`${pathname}?${search}`);

  React.useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(query.matches);
    const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  React.useEffect(() => {
    const start = () => {
      pendingRef.current = true;
      setPhase("loading");
    };
    const onClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }
      const anchor = (event.target as Element | null)?.closest?.("a");
      if (!anchor?.href || anchor.hasAttribute("download")) return;
      if (anchor.target && anchor.target !== "_self") return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search
      ) {
        return; // misma página o solo ancla: no es navegación
      }
      start();
    };
    // `popstate` también salta en navegación a `#ancla` y, en atrás/adelante,
    // Next puede haber renderizado ya la ruta nueva: en ambos casos la URL
    // coincide con lo renderizado y no hay nada que esperar.
    const onPop = (event: PopStateEvent) => {
      // Entrada sin estado (ancla nativa, p. ej. "Saltar al contenido"): el
      // router de Next la ignora, así que nunca llegará una ruta que cierre la barra.
      if (!event.state) return;
      const current = window.location.search.replace(/^\?/, "");
      if (`${window.location.pathname}?${current}` === committedRef.current) {
        return;
      }
      start();
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // Llegó la página nueva.
  React.useEffect(() => {
    committedRef.current = `${pathname}?${search}`;
    if (pendingRef.current) {
      pendingRef.current = false;
      setPhase("done");
    }
  }, [pathname, search]);

  React.useEffect(() => {
    if (phase === "loading") {
      const t = window.setTimeout(() => {
        pendingRef.current = false;
        setPhase("idle");
      }, navProgress.timeoutMs);
      return () => window.clearTimeout(t);
    }
    if (phase === "done") {
      const t = window.setTimeout(() => setPhase("idle"), navProgress.fadeMs);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  if (phase === "idle") return null;

  return (
    <div
      role="progressbar"
      aria-label="Cargando página"
      aria-busy={phase === "loading"}
      data-phase={phase}
      className="pointer-events-none fixed inset-x-0 top-0 z-progress"
      style={{
        height: navProgress.height,
        opacity: phase === "done" ? 0 : 1,
        transition: reduceMotion ? "none" : `opacity ${navProgress.fadeMs}ms`,
      }}
    >
      <div
        className={cn(
          "h-full origin-left bg-secondary",
          phase === "loading" && !reduceMotion && styles.advancing,
        )}
        style={{
          transform: phase === "done" || reduceMotion ? "scaleX(1)" : undefined,
          transition: reduceMotion ? "none" : "transform 150ms ease-out",
        }}
      />
    </div>
  );
}

export function NavigationProgress() {
  // `useSearchParams` exige Suspense en rutas estáticas.
  return (
    <React.Suspense fallback={null}>
      <NavigationProgressInner />
    </React.Suspense>
  );
}
