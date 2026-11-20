import type * as React from "react";
import { cn } from "@/lib/utils";
import { fieldControlClasses } from "./input";

/**
 * Campo de varias líneas (D114): la caja de `Input` (borde, hover, foco de
 * D085, error) con alto libre — crece con el contenido desde 4 líneas
 * (`field-sizing-content`), como el `TextField multiline` de MUI.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      data-field-control=""
      className={cn(
        fieldControlClasses,
        "field-sizing-content h-auto min-h-24 items-start py-2",
        "placeholder:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
