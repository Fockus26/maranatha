"use client";

import * as React from "react";
import { StatusScreen } from "@/components/status/StatusScreen";

/**
 * La página la sirve el service worker en lugar de la URL que se pidió, así
 * que reintentar es recargar: vuelve a pedir esa URL a la red. Al volver la
 * conexión se recarga sola.
 */
export function OfflineScreen() {
  React.useEffect(() => {
    const onOnline = () => window.location.reload();
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, []);

  return (
    <StatusScreen variant="offline" onRetry={() => window.location.reload()} />
  );
}
