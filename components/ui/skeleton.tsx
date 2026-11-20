import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton (D119): `shadcn add skeleton` con el fondo de `--muted` (el
 * `Skeleton` de MUI: texto al 11 % claro, 13 % oscuro; sobre navy, blanco al
 * 13 %) y sin pulso con `prefers-reduced-motion`. El tamaño lo pone quien lo
 * usa: `<Skeleton className="h-5 w-56" />`.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-sm bg-muted motion-reduce:animate-none",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
