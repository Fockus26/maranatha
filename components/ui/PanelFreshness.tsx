"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getPanelVersion } from "@/app/actions/panelVersion";
import {
  afterQuery,
  decideFreshness,
  type KnownVersion,
  type PanelScope,
  type PanelVersion,
} from "@/lib/panelFreshness";

// Lo último sabido por scope, compartido por todas las páginas del panel y
// vivo mientras dure la pestaña: así volver a un filtro cacheado se compara
// contra lo que ya se supo sin otra consulta (D104).
const knownByScope = new Map<PanelScope, KnownVersion>();
const inFlight = new Set<PanelScope>();

/**
 * Chequeo de frescura de una página del panel (D104). La caché del router
 * (D103) muestra al instante una página o un filtro visitado hace poco; esto
 * cubre lo que cambió por fuera (webhook de PayPal/Binance, otro admin): al
 * montarse, al volver el foco a la ventana o la pestaña a primer plano,
 * compara la versión con la que se renderizó la página contra la del servidor
 * —como mucho una consulta cada 15 s por scope— y solo si difiere hace
 * `router.refresh()`. No pinta nada y no deja timers corriendo.
 */
export function PanelFreshness({
  scope,
  version,
}: {
  scope: PanelScope;
  /** `null` si la página no pudo leer la versión (base caída): no se chequea. */
  version: PanelVersion | null;
}) {
  const router = useRouter();
  const token = version?.token;
  const at = version?.at;

  useEffect(() => {
    if (token === undefined || at === undefined) return;
    const rendered = { token, at };
    let cancelled = false;

    async function check() {
      if (document.visibilityState !== "visible" || inFlight.has(scope)) return;
      const decision = decideFreshness(
        rendered,
        knownByScope.get(scope) ?? null,
        Date.now(),
      );
      knownByScope.set(scope, decision.known);
      if (decision.action === "refresh") {
        router.refresh();
        return;
      }
      if (decision.action === "fresh") return;

      inFlight.add(scope);
      let result: PanelVersion | null = null;
      try {
        const response = await getPanelVersion(scope);
        result = response.ok ? response.data : null;
      } catch {
        // Sin red: se reintenta en el próximo foco, pasado el throttle.
      } finally {
        inFlight.delete(scope);
      }
      const known = afterQuery(decision.known, result, Date.now());
      knownByScope.set(scope, known);
      if (!cancelled && known.token !== rendered.token) router.refresh();
    }

    function onVisibility() {
      if (document.visibilityState === "visible") void check();
    }

    void check();
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [scope, token, at, router]);

  return null;
}
