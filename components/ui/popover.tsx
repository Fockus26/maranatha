"use client";

import { Popover as PopoverPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/**
 * Panel flotante (D115): el `Paper` del `Popper` de MUI — `--popover`, borde
 * `--border`, radio `md`, sombra `md` (la `shadows[8]` del tema) y `z-modal`
 * (sobre los diálogos). Se porta a `body` salvo que se pase `container`: dentro
 * de un diálogo con trampa de foco propia (no Radix) va el elemento
 * `role="dialog"` que lo contiene, o esa trampa le roba el foco al panel. La animación de entrada se
 * apaga con `prefers-reduced-motion`.
 */
function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  container,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content> & {
  container?: HTMLElement | null;
}) {
  return (
    <PopoverPrimitive.Portal container={container ?? undefined}>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "z-modal w-70 max-w-[calc(100vw-var(--spacing-xl))] origin-(--radix-popover-content-transform-origin)",
          "rounded-md border border-border bg-popover p-4 text-popover-foreground shadow-md outline-hidden",
          "duration-150 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-98",
          "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
          "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-98",
          "motion-reduce:animate-none",
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };
