"use client";

import { Progress as ProgressPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Barra de progreso (D119): el `LinearProgress` de MUI. Pista `--muted`, barra
 * `--primary`, 4 px de alto. `value` 0–100 = determinada; sin `value` (o
 * `null`) = indeterminada, con la barra recorriendo la pista (con
 * `prefers-reduced-motion` queda quieta). Radix pone `role="progressbar"`:
 * el nombre accesible lo da quien la usa (`aria-label`). En `forced-colors`
 * pista y barra con colores de sistema (sus clases `forced-colors:`).
 *
 * `color` = primary (def.) | secondary | success: el color de la barra (D139).
 *
 *   <Progress value={42} aria-label="Avance de la meta" />
 *   <Progress color="secondary" aria-label="Cargando" />
 *   <Progress aria-label="Cargando" />
 */
const INDICATOR_COLOR = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
} as const;

function Progress({
  className,
  value,
  color = "primary",
  ...props
}: Omit<React.ComponentProps<typeof ProgressPrimitive.Root>, "color"> & {
  color?: "primary" | "secondary" | "success";
}) {
  const indeterminate = value == null;
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn(
        "relative block h-1 w-full overflow-hidden bg-muted",
        "forced-color-adjust-none forced-colors:border forced-colors:border-[CanvasText] forced-colors:bg-[Canvas]",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full forced-colors:bg-[Highlight]",
          INDICATOR_COLOR[color],
          indeterminate
            ? "w-2/5 animate-progress-indeterminate motion-reduce:animate-none"
            : "w-full transition-transform duration-300 motion-reduce:transition-none",
        )}
        style={
          indeterminate
            ? undefined
            : { transform: `translateX(-${100 - value}%)` }
        }
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
