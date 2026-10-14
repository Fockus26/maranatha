"use client";

import * as React from "react";
import { StatusScreen } from "@/components/status/StatusScreen";
import { errorCode } from "@/components/status/statusCopy";

/**
 * Error de una página (D079). Si el navegador está sin red, el fallo casi
 * siempre es eso: se muestra "Sin conexión" y se reintenta solo al volver la
 * red. Si no, 500 con el código del `digest` (el mismo de los logs).
 */
export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [offline, setOffline] = React.useState(false);

  React.useEffect(() => {
    console.error(error);
  }, [error]);

  React.useEffect(() => {
    setOffline(!navigator.onLine);
    const onOnline = () => {
      setOffline(false);
      retry();
    };
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [retry]);

  return offline ? (
    <StatusScreen variant="offline" onRetry={retry} />
  ) : (
    <StatusScreen
      variant="500"
      code={errorCode(error.digest)}
      onRetry={retry}
    />
  );
}
