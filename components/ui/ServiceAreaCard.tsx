"use client";

import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { gray } from "@/theme/tokens";
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
          <Typography
            component="p"
            sx={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "19px",
              color: gray[50],
              mb: 0.5,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              color: gray[200],
              lineHeight: 1.4,
            }}
          >
            {description}
          </Typography>
        </>
      }
    />
  );
}
