"use client";

import type { CSSProperties } from "react";
import { primary, secondary } from "@/theme/tokens";

export interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  progress: number;
}

// El último paso era `secondary[500]` (#F9750D) — a 40px sobre fondo claro
// da 2.7:1 (mín. 3:1). `secondary[700]` lo sube a ~5.9:1.
const RAMP_LIGHT = [
  primary[700],
  primary[500],
  secondary[700],
  secondary[700],
] as const;
const RAMP_DARK = [
  primary[300],
  primary[200],
  secondary[300],
  secondary[500],
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function rampColor(ramp: readonly string[], progress: number): string {
  const t = Math.min(Math.max(progress, 0), 1);
  const scaled = t * (ramp.length - 1);
  const index = Math.min(Math.floor(scaled), ramp.length - 2);
  const local = scaled - index;

  const from = hexToRgb(ramp[index]);
  const to = hexToRgb(ramp[index + 1]);

  return rgbToHex([
    Math.round(from[0] + (to[0] - from[0]) * local),
    Math.round(from[1] + (to[1] - from[1]) * local),
    Math.round(from[2] + (to[2] - from[2]) * local),
  ]);
}

export function TimelineItem({
  year,
  title,
  description,
  progress,
}: TimelineItemProps) {
  // Los dos colores del año se calculan aquí y el modo lo elige CSS (`dark:`),
  // así no hace falta leer el tema en JS.
  const yearVars = {
    "--year-light": rampColor(RAMP_LIGHT, progress),
    "--year-dark": rampColor(RAMP_DARK, progress),
  } as CSSProperties;

  return (
    <div className="flex gap-5 border-border border-b py-4 last-of-type:border-b-0">
      <p
        style={yearVars}
        className="w-30 shrink-0 font-extrabold font-heading text-40 text-(color:--year-light) leading-none dark:text-(color:--year-dark)"
      >
        {year}
      </p>

      <div className="pt-1.5">
        <p className="mb-1 font-heading font-semibold text-body text-foreground">
          {title}
        </p>
        <p className="max-w-85 font-body text-muted-foreground text-small">
          {description}
        </p>
      </div>
    </div>
  );
}
