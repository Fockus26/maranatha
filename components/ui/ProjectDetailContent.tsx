"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

export interface BudgetLine {
  label: string;
  amount: number;
}

export interface ProjectDetailContentProps {
  title: string;
  description: string;
  imageUrl?: string;
  budget: BudgetLine[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectDetailContent({
  title,
  description,
  imageUrl,
  budget,
}: ProjectDetailContentProps) {
  return (
    <div>
      <div className="relative mb-5 h-80 overflow-hidden rounded-lg bg-primary-dark">
        {imageUrl && (
          <Image
            src={imageUrl}
            alt={title}
            fill
            priority
            sizes="(max-width: 900px) 100vw, 1000px"
            className="object-cover"
          />
        )}
      </div>

      <h1 className="m-0 mb-2 font-bold font-heading text-22 text-foreground">
        {title}
      </h1>

      {/* Medida de lectura (design-qa fase 09): sin tope llegaba a ~117
          caracteres por línea desde 1920px. */}
      <p className="m-0 mb-5 max-w-[70ch] font-body text-body-lg text-muted-foreground leading-body">
        {description}
      </p>

      <div className="rounded-md border border-border bg-card p-3.5">
        <p className="m-0 mb-2 font-heading font-semibold text-13 text-foreground leading-body">
          Presupuesto
        </p>

        {budget.map((line, index) => (
          <div
            key={line.label}
            className={cn(
              "flex justify-between py-1.25 text-12 text-muted-foreground",
              index < budget.length - 1 && "border-border border-b",
            )}
          >
            <span>{line.label}</span>
            <span>{formatCurrency(line.amount)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
