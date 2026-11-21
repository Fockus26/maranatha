import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface DonationFormCardProps {
  /** Ancho desde `sm` en px; por debajo la tarjeta ocupa el 100 %. */
  width?: number;
  className?: string;
  children: ReactNode;
}

export function DonationFormCard({
  width = 320,
  className,
  children,
}: DonationFormCardProps) {
  return (
    <div
      data-slot="donation-form-card"
      // El ancho llega por prop (440 en diezmo, 320 en proyectos): va como
      // variable y la clase la lee, sin una clase por valor.
      style={{ "--donation-card-width": `${width}px` } as CSSProperties}
      className={cn(
        // Antes `width` era un número fijo en cualquier tamaño de pantalla —
        // en mobile (viewports más angostos que el propio card, ej. 320-390px)
        // esto desbordaba el modal en vez de encogerse (fase 08). Por debajo
        // de `sm` el card ocupa el 100% de su contenedor; desde `sm` en
        // adelante recupera el ancho fijo original.
        "w-full rounded-lg border border-border bg-card p-4 text-card-foreground sm:w-(--donation-card-width) sm:p-5.5",
        // Dentro de un diálogo a poca altura (teléfono en horizontal), la
        // tarjeta dentro de la tarjeta del diálogo comía ~50px útiles
        // (design-qa fase 09): se quita su borde, fondo y padding.
        "[@media(max-height:500px)]:in-data-[slot=dialog-content]:border-0",
        "[@media(max-height:500px)]:in-data-[slot=dialog-content]:bg-transparent",
        "[@media(max-height:500px)]:in-data-[slot=dialog-content]:p-0",
        className,
      )}
    >
      {children}
    </div>
  );
}
