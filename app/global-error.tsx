"use client";

// No hereda el CSS del layout raíz (lo reemplaza): sin esto, ni Tailwind ni
// los roles por modo llegan a esta pantalla (D141).
import "./globals.css";
import { StatusScreen } from "@/components/status/StatusScreen";
import { errorCode } from "@/components/status/statusCopy";
import ColorModeProvider from "@/theme/ColorModeProvider";
import { ibmPlexSans, sora } from "@/theme/fonts";

/**
 * Error en el layout raíz (D079). Reemplaza el documento entero, así que trae
 * su propio `<html>`, fuentes y modo. El modo sale de la cookie `color-mode`
 * (D053), igual que en `app/layout.tsx`, y va en `data-color-mode`: de ese
 * atributo cuelgan los roles de `app/tokens.css` (D141).
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
  const mode = dark ? "dark" : "light";

  return (
    <html
      lang="es"
      className={`${sora.variable} ${ibmPlexSans.variable}`}
      data-color-mode={mode}
      suppressHydrationWarning
    >
      <body>
        <ColorModeProvider initialMode={mode}>
          <StatusScreen
            variant="500"
            code={errorCode(error.digest)}
            onRetry={retry}
          />
        </ColorModeProvider>
      </body>
    </html>
  );
}
