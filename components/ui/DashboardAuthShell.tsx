"use client";

import { ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { PatternLayer } from "@/components/ui/pattern-layer";
import { gray } from "@/theme/tokens";

/** `#RRGGBB` → `rgba(r,g,b,a)` para el trazo del patrón (el tile es un SVG). */
function withAlpha(hex: string, alpha: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// `text.primary` al 7 %: gray[900] en claro, gray[50] en oscuro.
const STROKE_LIGHT = withAlpha(gray[900], 0.07);
const STROKE_DARK = withAlpha(gray[50], 0.07);
const PATTERN_FADE = {
  left: "45%",
  maskImage: "linear-gradient(to right, transparent, black 45%)",
} as const;

/**
 * Marco de las pantallas de acceso del dashboard — opción C ("minimal
 * editorial") del comparativo de /design: sin tarjeta, alineado a la
 * izquierda, con acceso para volver al sitio. En desktop se amplía y la
 * mitad derecha lleva el patrón diagonal del sitio desvaneciéndose hacia el
 * formulario. Lo comparten el login, "recuperar" y "restablecer" (D082), así
 * que las tres se ven como una sola pantalla.
 */
export function DashboardAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background px-3 py-4 md:px-8 md:py-6">
      {/* El trazo cambia con el modo: una capa por modo (el tile es un SVG). */}
      <PatternLayer
        stroke={STROKE_LIGHT}
        style={PATTERN_FADE}
        className="hidden md:block dark:md:hidden"
      />
      <PatternLayer
        stroke={STROKE_DARK}
        style={PATTERN_FADE}
        className="hidden dark:md:block"
      />
      <header className="relative mb-8 flex items-center justify-between gap-2 md:mb-0">
        <div className="flex items-center gap-1.25">
          <div className="size-4.5 rounded-xs bg-secondary" />
          <span className="font-heading text-14 font-semibold">
            Iglesia Maranatha
          </span>
        </div>
        <Button
          asChild
          variant="text"
          size="small"
          className="text-12 text-foreground"
        >
          <Link href="/">
            <ArrowLeft className="size-5" aria-hidden="true" />
            Volver al sitio
          </Link>
        </Button>
      </header>

      <main
        id="main-content"
        className="relative flex w-full max-w-90 items-center md:max-w-110 md:flex-1 md:py-6"
      >
        <div className="flex w-full flex-col gap-2.5 md:gap-3">
          <div className="flex items-center gap-2 text-secondary">
            <Shield className="size-4" aria-hidden="true" />
            <span className="font-semibold text-11 tracking-[0.18em] uppercase">
              Área privada
            </span>
          </div>
          <h1 className="font-heading text-28 font-extrabold leading-h1 md:text-h1">
            {title}
          </h1>
          <p className="-mt-1 text-small text-muted-foreground md:-mt-1.5 md:text-body-lg">
            {subtitle}
          </p>
          {children}
        </div>
      </main>
    </div>
  );
}

/** Columna del formulario dentro del marco (mismo espaciado que el encabezado). */
export const authFormClass = "flex w-full flex-col gap-2.5 md:gap-3";
