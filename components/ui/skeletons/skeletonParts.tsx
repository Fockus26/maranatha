import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/** Alto de un botón de acción del panel (MUI `medium`, texto 14 px): `h-10`. */
export const SKELETON_BUTTON_HEIGHT = 40;
/** Alto de la fila de acción "Nuevo proyecto" / "Ver todos" del Resumen: `h-12`. */
export const SKELETON_ACTION_HEIGHT = 48;

/**
 * Contenedor de contenido del panel: mismo padding que las páginas reales.
 * `maxWidthClass`: el tope (`max-w-agenda` Agenda, `max-w-panel` el
 * resto; sin token, como en las páginas).
 */
export function SkeletonContent({
  maxWidthClass,
  children,
}: {
  maxWidthClass: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn("mx-auto px-3 pt-8 pb-5 md:px-5 md:pt-12", maxWidthClass)}
    >
      {children}
    </div>
  );
}

/**
 * Línea de texto en gris: el `Skeleton variant="text"` de MUI (una línea del
 * alto del texto, la barra al 60 % de ese alto). `size` = clases de tamaño de
 * letra de la línea (`text-13`); `className` = ancho (`w-1/2`).
 */
export function SkeletonLine({
  size,
  className,
}: {
  size: string;
  className?: string;
}) {
  return (
    <div className={cn("leading-body", size)}>
      <Skeleton className={cn("origin-left scale-y-60", className)}>
        &nbsp;
      </Skeleton>
    </div>
  );
}

/** Título h1 real de la página (no cambia entre carga y contenido). */
export function SkeletonHeading({
  title,
  subtitle,
}: {
  title: string;
  /** Texto fijo; sin él se pinta una línea gris. */
  subtitle?: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <h1 className="mb-1 font-heading text-26 font-extrabold text-foreground">
        {title}
      </h1>
      {subtitle ? (
        <p className="text-13 text-muted-foreground">{subtitle}</p>
      ) : (
        <SkeletonLine size="text-13" className="w-55" />
      )}
    </div>
  );
}

/** Botón en gris del encabezado (`width`: clase de ancho, p. ej. `w-40`). */
export function SkeletonButton({ widthClass }: { widthClass: string }) {
  return <Skeleton className={cn("h-10", widthClass)} />;
}
