"use client";

import {
  CircleAlertIcon,
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  TriangleAlertIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Aviso emergente del proyecto (D118): reemplaza los `Snackbar` + `Alert
 * filled` de MUI. Se monta UNA vez en `app/layout.tsx`; las zonas solo llaman
 * `toast.success("…")` / `toast.error("…")` (import `{ toast } from "sonner"`).
 *
 * Sonner con estilos propios (no `unstyled`: perdería ancho y pila). Se
 * rellena con los mismos colores AA de los avisos rellenos del sitio y se fija
 * lo que el `Snackbar` traía: ancho, separación de la pila, `z-toast`, abajo
 * al centro (24 px del borde en escritorio, 8 px en móvil) y 5 s de duración.
 */
export const TOAST_WIDTH = 448;
export const TOAST_DURATION_MS = 5000;

const Toaster = (props: ToasterProps) => (
  <Sonner
    position="bottom-center"
    duration={TOAST_DURATION_MS}
    closeButton
    gap={8}
    offset={24}
    mobileOffset={8}
    visibleToasts={3}
    containerAriaLabel="Avisos"
    className="toaster group font-body"
    icons={{
      success: <CircleCheckIcon className="size-5" aria-hidden="true" />,
      info: <InfoIcon className="size-5" aria-hidden="true" />,
      warning: <TriangleAlertIcon className="size-5" aria-hidden="true" />,
      error: <CircleAlertIcon className="size-5" aria-hidden="true" />,
      loading: (
        <Loader2Icon className="size-5 animate-spin" aria-hidden="true" />
      ),
    }}
    richColors
    toastOptions={{
      closeButtonAriaLabel: "Cerrar aviso",
      classNames: { toast: "text-14!" },
    }}
    style={
      {
        "--width": `${TOAST_WIDTH}px`,
        "--z-index": "var(--z-index-toast)",
        "--border-radius": "var(--radius-sm)",
        "--normal-bg": "var(--card)",
        "--normal-text": "var(--card-foreground)",
        "--normal-border": "var(--border)",
        "--success-bg": "var(--color-success-filled)",
        "--success-text": "#fff",
        "--success-border": "var(--color-success-filled)",
        "--error-bg": "var(--destructive)",
        "--error-text": "var(--destructive-foreground)",
        "--error-border": "var(--destructive)",
        "--info-bg": "var(--info)",
        "--info-text": "var(--info-foreground)",
        "--info-border": "var(--info)",
        "--warning-bg": "var(--warning)",
        "--warning-text": "var(--warning-foreground)",
        "--warning-border": "var(--warning)",
      } as React.CSSProperties
    }
    {...props}
  />
);

export { Toaster };
