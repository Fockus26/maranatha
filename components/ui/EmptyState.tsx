"use client";

import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Empty state genérico — fase 09 (D067). Tratamiento elegido por el cliente
 * entre 3 opciones (ícono+mensaje+CTA / solo texto / ilustración custom por
 * contexto): un ícono outline en un bloque circular `action.hover`, un
 * mensaje breve en Sora, y un CTA opcional — mismo componente reutilizado en
 * cualquier lista vacía del sitio (`DashboardTable` sin proyectos o sin
 * resultados de búsqueda, `/proyectos` sin resultados de filtro, "Próximos
 * cierres" del Resumen sin proyectos activos) en vez de resolver cada caso
 * con texto suelto.
 *
 * Migrado a shadcn (D119–D121): `icon` es un ícono de lucide (o de
 * `brand-icons.tsx`), dimensionado con `size-*`.
 *
 * `compact` reduce el padding/tamaño de ícono para contextos donde el
 * empty state vive dentro de una tarjeta ya angosta (ej. "Próximos
 * cierres"), sin dejar de ser el mismo componente/lenguaje visual.
 */
export interface EmptyStateProps {
  icon: ComponentType<{
    className?: string;
    "aria-hidden"?: boolean | "true";
  }>;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  compact?: boolean;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  ctaLabel,
  onCtaClick,
  compact,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "px-3 text-center",
        compact ? "py-3" : "py-6 md:py-8",
        className,
      )}
    >
      <div
        className={cn(
          "inline-flex items-center justify-center rounded-pill bg-accent text-muted-foreground",
          compact ? "mb-1.5 size-10" : "mb-2.5 size-14",
        )}
      >
        <Icon aria-hidden className={compact ? "size-5" : "size-7"} />
      </div>
      <p
        className={cn(
          "font-heading font-semibold leading-body text-foreground",
          compact ? "text-14" : "text-16",
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            "mx-auto mt-0.75 max-w-90 font-body leading-body text-muted-foreground",
            compact ? "text-13" : "text-14",
          )}
        >
          {description}
        </p>
      )}
      {ctaLabel && onCtaClick && (
        <Button
          variant="outlined"
          color="primary"
          size={compact ? "small" : "medium"}
          onClick={onCtaClick}
          className={compact ? "mt-2" : "mt-3"}
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
}
