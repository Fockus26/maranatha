import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Caja de campo del proyecto (D114): el `TextField` outlined `size="small"`
 * con `SMALL_FIELD_SX` de MUI — 40 px de alto, texto de 14 px, radio `xs`,
 * borde del `OutlinedInput` (negro/blanco al 23 %; en piezas navy, `--input`),
 * hover con el color del texto y foco de D085: borde 2 px `--focus-ring`, sin
 * outline exterior (el segundo píxel es un `inset-ring`, así el contenido no
 * salta). Error: `aria-invalid` → borde `--destructive`. El borde de foco en
 * `forced-colors` (D086) y la anulación del anillo global de los `<button>`
 * viven en `app/globals.css` (`[data-field-control]`).
 *
 * La comparten `Input`, `SelectTrigger` y los disparadores de `DateField` /
 * `TimeField`, que son `<button>`.
 */
const fieldControlClasses = [
  "flex h-10 w-full min-w-0 items-center rounded-xs border bg-card px-3.5",
  "font-body text-small text-foreground outline-none",
  "border-black/23 dark:border-white/23 navy:border-input",
  "transition-[border-color,box-shadow] duration-150",
  "hover:border-foreground",
  "focus-visible:border-ring focus-visible:inset-ring-1 focus-visible:inset-ring-ring",
  // Disparadores con lista o panel abierto (selector, fecha, hora).
  "data-[state=open]:border-ring data-[state=open]:inset-ring-1 data-[state=open]:inset-ring-ring",
  "aria-invalid:border-destructive aria-invalid:hover:border-destructive",
  "aria-invalid:focus-visible:border-destructive aria-invalid:focus-visible:inset-ring-destructive",
  "aria-invalid:data-[state=open]:border-destructive aria-invalid:data-[state=open]:inset-ring-destructive",
  "disabled:pointer-events-none disabled:cursor-default",
  "disabled:border-black/26 disabled:text-black/38 dark:disabled:border-white/30 dark:disabled:text-white/50",
];

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      data-field-control=""
      className={cn(
        fieldControlClasses,
        "placeholder:text-muted-foreground",
        "file:me-3 file:border-0 file:bg-transparent file:font-medium file:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { fieldControlClasses, Input };
