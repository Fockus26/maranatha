"use client";

import { cn } from "@/lib/utils";

export interface TimelineZigzagItemProps {
  year: string;
  title: string;
  description: string;
  imageUrl?: string;
  /** Foto a la derecha (default) o a la izquierda — alterna hito a hito. */
  reverse?: boolean;
}

/**
 * Variante con foto de `TimelineItem` (D015) para la página completa de
 * Historia (`/historia`, fase 07, D043) — foto grande + texto, alternando
 * de lado en lado ("zigzag"). El año conserva el mismo tratamiento
 * tipográfico (Sora 800, color de marca) que la versión sin foto usada en
 * el resumen de Home, pero en `secondary` fijo en vez del gradiente
 * cronológico — con solo 2 posiciones por fila (izquierda/derecha) un
 * degradado de color por hito no se lee con la misma claridad que en la
 * lista vertical compacta de Home.
 */
export function TimelineZigzagItem({
  year,
  title,
  description,
  imageUrl,
  reverse = false,
}: TimelineZigzagItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4",
        reverse ? "md:flex-row-reverse" : "md:flex-row",
        "md:gap-7",
      )}
    >
      <div
        // "top" en vez de "center" (fase 07, ajuste post-entrega): en fotos
        // de personas/grupos el sujeto suele estar en el tercio superior —
        // centrar el crop lo cortaba. Mismo criterio para las 6 fotos del
        // zigzag, sin excepción por hito.
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
        className={cn(
          "h-55 w-full flex-1 shrink-0 rounded-lg bg-cover bg-position-[center_top] md:h-70",
          !imageUrl && "bg-primary-dark",
        )}
      />

      <div className="flex-1 text-center md:text-left">
        <span className="mb-1.5 block font-extrabold font-heading text-34 text-secondary leading-none">
          {year}
        </span>
        <h3 className="mb-1.5 font-bold font-heading text-20 text-foreground">
          {title}
        </h3>
        <p className="mx-auto max-w-110 font-body text-body text-muted-foreground leading-[1.65] md:mx-0">
          {description}
        </p>
      </div>
    </div>
  );
}
