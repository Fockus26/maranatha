"use client";

import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Grupo de opciones (D114): `role="radiogroup"` con `role="radio"` y
 * `aria-checked` (Radix: flechas mueven y eligen, una sola parada de Tab).
 * El `Radio size="small"` de MUI: círculo de 20 px, gris de texto atenuado
 * sin marcar y `--primary` marcado (borde + punto: no solo color), área
 * táctil ampliada con `after:` y el anillo de foco de D085.
 */
function RadioGroup({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      data-slot="radio-group"
      className={cn("grid w-full gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof RadioGroupPrimitive.Item>) {
  return (
    <RadioGroupPrimitive.Item
      data-slot="radio-group-item"
      className={cn(
        "relative flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-pill",
        "border-2 border-muted-foreground bg-transparent",
        "after:absolute after:-inset-2.5 after:content-['']",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "data-checked:border-primary",
        "aria-invalid:border-destructive",
        "disabled:cursor-default disabled:border-black/26 dark:disabled:border-white/30",
        className,
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator
        data-slot="radio-group-indicator"
        className="size-2.5 rounded-pill bg-primary"
      />
    </RadioGroupPrimitive.Item>
  );
}

export { RadioGroup, RadioGroupItem };
