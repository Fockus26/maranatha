"use client";

import { Tooltip as TooltipPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tooltip (D112): `shadcn add tooltip` con el aspecto del `Tooltip` de MUI del
 * sitio (fondo gris oscuro, texto blanco, `text-small`, radio `sm`) sobre la
 * capa `dropdown` (el `zIndex.tooltip` del tema).
 *
 * Radix exige un `TooltipProvider` encima o falla en runtime; aquí `Tooltip`
 * trae el suyo, así que se usa suelto, sin montar nada en el layout:
 * `<Tooltip><TooltipTrigger asChild>…</TooltipTrigger><TooltipContent>…</TooltipContent></Tooltip>`.
 * `TooltipProvider` queda exportado por si se quiere un retardo compartido.
 */
const TOOLTIP_DELAY_MS = 100;

function TooltipProvider({
  delayDuration = TOOLTIP_DELAY_MS,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delayDuration={delayDuration}
      {...props}
    />
  );
}

function Tooltip(props: React.ComponentProps<typeof TooltipPrimitive.Root>) {
  return (
    <TooltipProvider>
      <TooltipPrimitive.Root data-slot="tooltip" {...props} />
    </TooltipProvider>
  );
}

function TooltipTrigger(
  props: React.ComponentProps<typeof TooltipPrimitive.Trigger>,
) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  sideOffset = 6,
  children,
  ...props
}: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        className={cn(
          "z-dropdown w-fit max-w-64 origin-(--radix-tooltip-content-transform-origin) rounded-sm bg-gray-800 px-2 py-1 font-body text-small text-white dark:bg-gray-700",
          "data-open:fade-in-0 data-open:animate-in data-closed:fade-out-0 data-closed:animate-out",
          className,
        )}
        {...props}
      >
        {children}
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger };
