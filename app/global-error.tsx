"use client";

import { StatusScreen } from "@/components/status/StatusScreen";
import { errorCode } from "@/components/status/statusCopy";
import { ibmPlexSans, sora } from "@/theme/fonts";
import ThemeRegistry from "@/theme/ThemeRegistry";

/**
 * Error en el layout raíz (D079). Reemplaza el documento entero, así que trae
 * su propio `<html>`, fuentes y tema. El modo sale de la cookie `color-mode`
 * (D053), igual que en `app/layout.tsx`.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const dark =
    typeof document !== "undefined" &&
    document.cookie.split("; ").includes("color-mode=dark");

  return (
    <html lang="es" className={`${sora.variable} ${ibmPlexSans.variable}`}>
      <body>
        <ThemeRegistry initialMode={dark ? "dark" : "light"}>
          <StatusScreen
            variant="500"
            code={errorCode(error.digest)}
            onRetry={retry}
          />
        </ThemeRegistry>
      </body>
    </html>
  );
}
