"use client";

import type { ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SocialLinkCardProps {
  platform: string;
  handle: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  ctaLabel: string;
  /**
   * Cuando es `true`, omite el border/radius/fondo/padding propios del
   * card — para embeberlo dentro de otro contenedor que ya resuelve esos
   * estilos (ej. el panel de cuenta activa en `SocialLinks.tsx`, D036).
   * Por defecto `false`: se comporta exactamente igual que antes (D013).
   */
  bare?: boolean;
  /** Foto de perfil real (feed de Behold); si falta, se muestra `icon`. */
  avatarUrl?: string;
  /** Dato extra tras el handle, p. ej. "7,3 mil seguidores". */
  meta?: string;
}

export function SocialLinkCard({
  platform,
  handle,
  href,
  icon: Icon,
  ctaLabel,
  bare = false,
  avatarUrl,
  meta,
}: SocialLinkCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5",
        !bare && "rounded-lg border border-border bg-card p-2",
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-50 dark:bg-primary-dark">
        {avatarUrl ? (
          // biome-ignore lint/performance/noImgElement: foto de perfil externa (feed de Behold), sin dominio fijo para `next/image`
          <img
            src={avatarUrl}
            alt=""
            className="size-full rounded-[inherit] object-cover"
          />
        ) : (
          <Icon className="size-5 text-primary dark:text-primary-light" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-heading font-semibold text-13 text-foreground">
          {platform}
        </p>
        <p className="truncate font-body text-12 text-muted-foreground">
          {handle}
          {meta && ` · ${meta}`}
        </p>
      </div>

      {/* Outlined con contraste real en reposo y relleno al hover (D084). */}
      <Button
        asChild
        variant="action"
        size="small"
        className="min-h-11 shrink-0" // área táctil (design-qa fase 09)
      >
        <a href={href} target="_blank" rel="noopener noreferrer">
          {ctaLabel}
        </a>
      </Button>
    </div>
  );
}
