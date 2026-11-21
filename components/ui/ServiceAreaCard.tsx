"use client";

import type { ReactNode } from "react";
import { PhotoOverlayCard } from "./PhotoOverlayCard";

/**
 * Revisión (fase 07): a pedido del cliente se quitó el badge de ícono
 * (`topLeftSlot`) y el CTA "Conocer más" (`bottomSlot`) — la card ahora
 * solo muestra nombre + descripción sobre la foto. `icon`/`ctaLabel` se
 * mantienen en la interfaz (y `ServiceAreas.tsx` sigue pasando `icon` al
 * spread `{...area}`) para no forzar un cambio en el llamador; quedan sin
 * usar en el render.
 */
export interface ServiceAreaCardProps {
  name: string;
  description: string;
  icon: ReactNode;
  imageUrl: string;
  ctaLabel?: string;
  onClick?: () => void;
}

export function ServiceAreaCard({
  name,
  description,
  imageUrl,
  onClick,
}: ServiceAreaCardProps) {
  return (
    <PhotoOverlayCard
      imageUrl={imageUrl}
      onClick={onClick}
      bottomSlot={
        <>
          <p className="mb-0.5 font-bold font-heading text-19 text-gray-50 tracking-tight">
            {name}
          </p>
          <p className="font-body text-13 text-gray-200 leading-normal">
            {description}
          </p>
        </>
      }
    />
  );
}
