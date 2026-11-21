"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type ProjectStatus = "active" | "completed";

export interface ProjectCardProps {
  layout?: "vertical" | "horizontal";
  title: string;
  description: string;
  imageUrl?: string;
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
  ctaLabel?: string;
  onCtaClick?: () => void;
  /** Si navega, enlace real (D101): semántica de `<a>` y la barra de carga lo detecta. */
  ctaHref?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Foto de la card vía `next/image` (optimización/AVIF/tamaños por
 * dispositivo). `className` da el marco (medida, fallback navy); la imagen la
 * cubre con `fill`.
 */
function CardPhoto({
  imageUrl,
  className,
  sizes,
  children,
}: {
  imageUrl?: string;
  className?: string;
  sizes: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-primary-dark",
        className,
      )}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes={sizes}
          className="object-cover"
        />
      )}
      {children}
    </div>
  );
}

/**
 * Chip "Activo" (rama sin foto, layout `horizontal` del listado): navy
 * fijo en vez de `primary.main`, mismo motivo que el chip de
 * `ProjectSidebar.tsx` — `primary.main` se ve "lavado" en modo oscuro y no
 * resaltaba lo suficiente (feedback directo del cliente); en modo oscuro
 * sube un peldaño en la escala (`primary[600]`) + borde sutil para marcar
 * el borde del chip. La rama `inverted` (sobre foto, con overlay navy) no
 * tiene este problema — se queda con el fondo blanco de siempre.
 */
function StatusChip({
  inverted,
  isCompleted,
}: {
  inverted: boolean;
  isCompleted: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-block shrink-0 whitespace-nowrap rounded-pill px-2.25 py-0.75 font-body font-medium text-11",
        isCompleted
          ? "bg-success-filled text-white"
          : inverted
            ? "bg-white/92 text-primary"
            : "border border-gray-50/14 bg-primary-700 text-gray-50 dark:bg-primary-600",
      )}
    >
      {isCompleted ? "Completado" : "Activo"}
    </span>
  );
}

function ProgressBlock({
  percent,
  isCompleted,
  currentAmount,
  goalAmount,
}: {
  percent: number;
  isCompleted: boolean;
  currentAmount: number;
  goalAmount: number;
}) {
  return (
    <>
      <Progress
        value={percent}
        aria-label={`${percent}% recaudado de la meta`}
        className={cn(
          "mb-2 h-1.5 rounded-pill",
          isCompleted
            ? "[&>[data-slot=progress-indicator]]:bg-success"
            : "[&>[data-slot=progress-indicator]]:bg-secondary",
        )}
      />
      <div className="mb-4 flex justify-between font-body text-12">
        <span className="font-medium text-foreground">
          {formatCurrency(currentAmount)}
        </span>
        <span className="text-muted-foreground">
          de {formatCurrency(goalAmount)}
        </span>
      </div>
    </>
  );
}

export function ProjectCard({
  layout = "vertical",
  title,
  description,
  imageUrl,
  status,
  currentAmount,
  goalAmount,
  ctaLabel,
  onCtaClick,
  ctaHref,
}: ProjectCardProps) {
  const isCompleted = status === "completed";
  const percent = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);
  const resolvedCtaLabel =
    ctaLabel ?? (isCompleted ? "Ver proyecto" : "Aportar");

  const progress = (
    <ProgressBlock
      percent={percent}
      isCompleted={isCompleted}
      currentAmount={currentAmount}
      goalAmount={goalAmount}
    />
  );

  // "Ver proyecto" (completado): mismo botón outlined con contraste que
  // "Seguir" (D084, `variant="action"`). El estilo neutro anterior (borde
  // `divider`, texto gris) no llegaba a 3:1 en el borde.
  // "Aportar" (activo) no cambia: sigue siendo el CTA de alta prioridad
  // contained/secondary reservado por D011. Con `ctaHref` es un enlace real
  // (D101): `asChild` + `next/link`.
  const ctaProps = {
    variant: isCompleted ? ("action" as const) : ("contained" as const),
    color: isCompleted ? ("primary" as const) : ("secondary" as const),
    onClick: onCtaClick,
  };
  const cta = (className: string) =>
    ctaHref ? (
      <Button {...ctaProps} asChild className={className}>
        <Link href={ctaHref}>{resolvedCtaLabel}</Link>
      </Button>
    ) : (
      <Button {...ctaProps} className={className}>
        {resolvedCtaLabel}
      </Button>
    );

  if (layout === "horizontal") {
    return (
      // Fase 08: por debajo de `sm` la fila (foto lateral + texto) se apila en
      // columna — el layout `horizontal` original (fila fija, foto 200px) no
      // cabía en mobile. Desde `sm` en adelante queda exactamente igual.
      <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card sm:flex-row">
        <CardPhoto
          imageUrl={imageUrl}
          className="h-45 w-full sm:h-auto sm:w-50"
          sizes="(max-width: 600px) 100vw, 200px"
        />
        <div className="flex flex-1 flex-col items-stretch gap-3 p-4 sm:flex-row sm:items-start sm:gap-7 sm:p-5">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex items-start gap-2">
              <p className="m-0 font-heading font-semibold text-17 text-foreground leading-body">
                {title}
              </p>
              <StatusChip inverted={false} isCompleted={isCompleted} />
            </div>
            <p className="m-0 mb-3 line-clamp-3 overflow-hidden font-body text-body text-muted-foreground leading-body">
              {description}
            </p>
            {progress}
          </div>
          {cta("w-full shrink-0 sm:w-30")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-border bg-card">
      <CardPhoto
        imageUrl={imageUrl}
        className="h-35"
        sizes="(max-width: 900px) 100vw, 400px"
      >
        <div className="absolute top-3 left-3 z-1">
          <StatusChip inverted isCompleted={isCompleted} />
        </div>
      </CardPhoto>

      <div className="flex flex-1 flex-col p-4">
        <p className="m-0 mb-1.5 line-clamp-2 min-h-[calc(1.3em*2)] overflow-hidden font-heading font-semibold text-17 text-foreground leading-[1.3]">
          {title}
        </p>
        <p className="m-0 mb-4 line-clamp-3 min-h-[calc(1.5em*3)] overflow-hidden font-body text-body text-muted-foreground leading-small">
          {description}
        </p>

        <div className="mt-auto">
          {progress}
          {cta("w-full")}
        </div>
      </div>
    </div>
  );
}
