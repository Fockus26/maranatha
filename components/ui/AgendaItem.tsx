"use client";

import { cn } from "@/lib/utils";

export interface AgendaItemProps {
  day: string;
  month: string;
  title: string;
  schedule: string;
  location: string;
  onClick?: () => void;
}

export function AgendaItem({
  day,
  month,
  title,
  schedule,
  location,
  onClick,
}: AgendaItemProps) {
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: tarjeta decorativa de lista; `onClick` es opcional y ningún consumidor lo pasa hoy
    // biome-ignore lint/a11y/useKeyWithClickEvents: ídem
    <div
      onClick={onClick}
      className={cn(
        "group relative flex overflow-hidden rounded-md border border-border bg-card",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      {/* Date block — fondo navy siempre fijo, no animado */}
      <div className="relative z-2 flex w-18 shrink-0 flex-col items-center justify-center bg-primary">
        <span className="font-extrabold font-heading text-26 text-primary-foreground leading-none">
          {day}
        </span>
        <span className="mt-px font-body text-primary-foreground/70 text-small uppercase tracking-wide-5">
          {month}
        </span>
      </div>

      {/* Fill animado: arranca en el borde derecho del date block, nunca desde 0 */}
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 left-18 z-0 origin-left scale-x-0 bg-primary transition-transform duration-400 ease-in-out group-hover:scale-x-100 motion-reduce:transition-none"
      />

      {/* Contenido — padding alineado a la escala: base (16px) / md (12px) */}
      <div className="relative z-1 flex-1 px-4 py-3">
        <p className="mb-1 font-heading font-semibold text-16 text-foreground transition-colors delay-50 duration-250 ease-in-out group-hover:text-primary-foreground">
          {title}
        </p>
        <p className="font-body text-body text-muted-foreground transition-colors delay-50 duration-250 ease-in-out group-hover:text-primary-foreground/75">
          {schedule} &nbsp;·&nbsp; {location}
        </p>
      </div>
    </div>
  );
}
