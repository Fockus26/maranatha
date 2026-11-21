"use client";

import type * as React from "react";
import { SITE_NAME } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";

/**
 * Logo provisional (D078). El símbolo es `public/brand/logo-mark.svg` (o su
 * `-inverse`): cambiar ese archivo cambia el logo en todo el sitio. El texto
 * se compone con Sora de `next/font`, por eso no se usa el SVG del logotipo
 * completo (dentro de un `<img>` no cargaría la fuente).
 *
 * Las proporciones replican las de `logo-horizontal.svg` (símbolo 64, texto a
 * 16 de separación, "IGLESIA" 12,5 y "Maranatha" 31) y `logo-compact.svg`
 * (símbolo 40, separación 12, "Maranatha" 24), en `em` del alto del símbolo.
 *
 * D124: sin `sx` ni tipos de MUI. `size` (px, o `{ xs, sm }`) y las
 * proporciones por breakpoint viajan como variables CSS en línea que leen las
 * clases `sm:`; el modo oscuro es la variante `dark:` (llega del servidor).
 */
const PROPORTION = {
  horizontal: { gap: "0.25em", name: "0.484em", eyebrow: "0.195em" },
  compact: { gap: "0.3em", name: "0.6em" },
  eyebrowTracking: "0.256em",
  nameTracking: "-0.02em",
} as const;

type Variant = "horizontal" | "compact" | "mark" | "responsive";

interface LogoProps {
  /**
   * `responsive`: compacto por debajo de `sm` y horizontal desde `sm`
   * (navbar). `mark`: solo el símbolo.
   */
  variant?: Variant;
  /** `inverse` para fondos oscuros y las piezas navy fijas (D025). */
  tone?: "auto" | "inverse";
  /** Alto del símbolo en px; acepta `{ xs, sm }` (sm desde 600 px). */
  size?: number | { xs: number; sm: number };
  className?: string;
}

export function Logo({
  variant = "horizontal",
  tone = "auto",
  size = 40,
  className,
}: LogoProps) {
  const inverse = tone === "inverse";
  const sizeXs = typeof size === "number" ? size : size.xs;
  const sizeSm = typeof size === "number" ? size : size.sm;

  const showText = variant !== "mark";
  const horizontalAt = (bp: "xs" | "sm") =>
    variant === "horizontal" || (variant === "responsive" && bp === "sm");
  const pick = (bp: "xs" | "sm", key: "gap" | "name") =>
    horizontalAt(bp) ? PROPORTION.horizontal[key] : PROPORTION.compact[key];

  const vars = {
    "--logo-size-xs": `${sizeXs}px`,
    "--logo-size-sm": `${sizeSm}px`,
    "--logo-gap-xs": pick("xs", "gap"),
    "--logo-gap-sm": pick("sm", "gap"),
    "--logo-name-xs": pick("xs", "name"),
    "--logo-name-sm": pick("sm", "name"),
  } as React.CSSProperties;

  // Colores: claro `primary-700` / `secondary-700`; oscuro (o `inverse`) los claros.
  const nameColor = inverse
    ? "text-gray-50"
    : "text-primary-700 dark:text-gray-50";
  const eyebrowColor = inverse
    ? "text-secondary-300"
    : "text-secondary-700 dark:text-secondary-300";

  const eyebrowDisplay =
    variant === "horizontal"
      ? "block"
      : variant === "responsive"
        ? "hidden sm:block"
        : "hidden";

  return (
    <span
      style={vars}
      className={cn(
        "inline-flex items-center gap-(--logo-gap-xs) text-[length:var(--logo-size-xs)] leading-none sm:gap-(--logo-gap-sm) sm:text-[length:var(--logo-size-sm)]",
        className,
      )}
    >
      {/* biome-ignore lint/performance/noImgElement: SVG de marca fijo, sin optimizador */}
      <img
        src={inverse ? "/brand/logo-mark-inverse.svg" : "/brand/logo-mark.svg"}
        // Con texto al lado, el símbolo es decorativo: el nombre ya se lee.
        alt={showText ? "" : SITE_NAME}
        width={64}
        height={64}
        className="block size-[1em] shrink-0"
      />
      {showText && (
        <span className="flex flex-col whitespace-nowrap font-heading">
          <span
            className={cn(
              "mb-[0.35em] font-semibold uppercase",
              eyebrowDisplay,
              eyebrowColor,
            )}
            style={{
              fontSize: PROPORTION.horizontal.eyebrow,
              letterSpacing: PROPORTION.eyebrowTracking,
            }}
          >
            Iglesia
          </span>
          <span
            className={cn(
              "font-bold text-[length:var(--logo-name-xs)] sm:text-[length:var(--logo-name-sm)]",
              nameColor,
            )}
            style={{ letterSpacing: PROPORTION.nameTracking }}
          >
            Maranatha
          </span>
        </span>
      )}
    </span>
  );
}
