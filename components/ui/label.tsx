"use client";

import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Etiqueta fija encima del campo (D114, la de `DateField`/`TimeField` desde
 * D062): 12 px, peso medio, texto atenuado. Dentro de un `Field` inválido
 * pasa a `--destructive` (el texto de error dice el motivo: no es solo color).
 */
function Label({
  className,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "block select-none font-body font-medium text-12 text-muted-foreground",
        "group-data-[invalid=true]/field:text-destructive",
        "group-data-[disabled=true]/field:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
