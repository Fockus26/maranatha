"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstagramIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { initialsOf } from "@/lib/auth/initials";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "./ProjectCard";

export interface Encargado {
  name: string;
  role: string;
  imageUrl: string;
  instagramUrl?: string;
}

export interface ProjectSidebarProps {
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
  deadlineLabel: string;
  ctaLabel?: string;
  onCtaClick?: () => void;
  encargados: Encargado[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectSidebar({
  status,
  currentAmount,
  goalAmount,
  deadlineLabel,
  ctaLabel,
  onCtaClick,
  encargados,
}: ProjectSidebarProps) {
  const isCompleted = status === "completed";
  const percent = Math.min(Math.round((currentAmount / goalAmount) * 100), 100);

  return (
    <div className="sticky top-5 rounded-lg border border-border bg-card p-4">
      {/* Navy fijo (no `primary.main`, que en modo oscuro es un azul claro
          "lavado" — mismo criterio de fondo fijo que el date block de
          Agenda/AgendaItem, D014/D025). Revisión: en modo oscuro el navy
          más profundo (`primary[700]`, `#101B45`) queda casi del mismo
          valor que la superficie del card (`gray[800]`, `#1D2032`) y no
          resaltaba lo suficiente (feedback directo del cliente) — en modo
          oscuro sube un peldaño en la escala (`primary[600]`, más claro y
          saturado) y se suma un borde sutil claro para marcar el borde del
          chip incluso cuando el contraste tonal es bajo. "Completado" se
          queda en success (verde), ya lo suficientemente distintivo. */}
      <span
        className={cn(
          "inline-block rounded-pill px-2.25 py-0.75 font-body font-bold text-11 tracking-[0.03em]",
          isCompleted
            ? "bg-success-filled text-white"
            : "border border-gray-50/14 bg-primary-700 text-gray-50 dark:bg-primary-600",
        )}
      >
        {isCompleted ? "Completado" : "Activo"}
      </span>

      <p className="m-0 mt-3 mb-0.5 font-extrabold font-heading text-22 text-foreground leading-body">
        {formatCurrency(currentAmount)}
      </p>
      <p className="m-0 mb-2.5 font-body text-12 text-muted-foreground leading-body">
        recaudado de {formatCurrency(goalAmount)}
      </p>

      <Progress
        value={percent}
        aria-label={`${percent}% recaudado de la meta`}
        className={cn(
          "mb-1.5 h-1.5 rounded-pill",
          isCompleted
            ? "[&>[data-slot=progress-indicator]]:bg-success"
            : "[&>[data-slot=progress-indicator]]:bg-secondary",
        )}
      />
      <p className="m-0 mb-4 font-body text-11 text-muted-foreground leading-body">
        {percent}% · {deadlineLabel}
      </p>

      {/* "Ver proyecto" (completado): mismo tratamiento que el CTA del Hero —
          neutro en reposo, acento azul al interactuar — aplicado también acá
          (fase 07, ronda de feedback siguiente a D049); `variant="action"`
          es el delineado con contraste de D084. */}
      <Button
        onClick={onCtaClick}
        variant={isCompleted ? "action" : "contained"}
        color={isCompleted ? "primary" : "secondary"}
        className="mb-4.5 w-full"
      >
        {ctaLabel ?? (isCompleted ? "Ver proyecto" : "Aportar")}
      </Button>

      {encargados.length > 0 && (
        <div className="border-border border-t pt-3.5">
          {/* Fase QA (a11y): antes `text.disabled` (~2.7:1 sobre el papel) —
              es un encabezado de sección real, no texto inhabilitado. */}
          <p className="m-0 mb-2.5 font-body text-11 text-muted-foreground uppercase leading-body tracking-[0.04em]">
            Encargados
          </p>

          <div className="flex flex-col gap-3">
            {encargados.map((encargado) => (
              <div key={encargado.name} className="flex items-center gap-2.5">
                <Avatar className="size-12">
                  <AvatarImage src={encargado.imageUrl} alt={encargado.name} />
                  <AvatarFallback>
                    {initialsOf(encargado.name, "")}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-heading font-semibold text-13 text-foreground leading-body">
                    {encargado.name}
                  </p>
                  <p className="m-0 font-body text-11 text-muted-foreground leading-body">
                    {encargado.role}
                  </p>
                </div>
                {encargado.instagramUrl && (
                  <Button
                    asChild
                    variant="plain"
                    size="icon"
                    className="size-6.5 rounded-sm border border-border text-primary hover:border-secondary hover:bg-secondary/8 hover:text-secondary dark:text-primary dark:hover:bg-secondary/8"
                  >
                    <a
                      href={encargado.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Instagram de ${encargado.name}`}
                    >
                      <InstagramIcon className="size-3.5" />
                    </a>
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
