import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Botón del proyecto (D110): `bunx shadcn add button` ajustado para replicar
 * el `MuiButton` de `theme/theme.ts` — mismos colores AA por modo, tamaños,
 * disabled y foco de D085 (outline 2px, offset 2px, `--focus-ring`, sigue el
 * radio). Variantes con los nombres de MUI para traducir sin pensar:
 * `variant` contained | outlined | text | action (`outlinedActionSx`, D084)
 * | plain (el `IconButton` sin color), `color` primary | secondary.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 cursor-pointer select-none items-center justify-center gap-2 align-middle",
    "min-w-16 rounded-sm font-body font-medium leading-button no-underline",
    "transition-[background-color,border-color] duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "disabled:pointer-events-none disabled:cursor-default aria-disabled:pointer-events-none",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        contained: "",
        outlined: "border bg-transparent",
        text: "bg-transparent hover:text-secondary-500",
        // "Seguir" / "Dar like o comentar" (D084): delineado con relleno al hover.
        action: [
          "border border-primary-700 bg-transparent font-semibold text-primary-700",
          "hover:bg-primary-700 hover:text-white",
          "dark:border-primary-200 dark:text-primary-200",
          "dark:hover:bg-primary-200 dark:hover:text-gray-900",
        ],
        // `IconButton` sin `color`: hereda el gris de acción de MUI.
        plain: [
          "bg-transparent text-black/54 hover:bg-black/4",
          "dark:text-white dark:hover:bg-white/8",
        ],
      },
      color: { primary: "", secondary: "" },
      size: {
        small: "px-4 py-2 text-13",
        medium: "min-h-11 px-4.5 py-2.25 text-14",
        large: "min-h-12 px-6 py-3 text-15",
        // `IconButton` (40×40, redondo).
        icon: "size-10 min-w-0 rounded-pill p-2 [&_svg:not([class*='size-'])]:size-6",
      },
    },
    compoundVariants: [
      {
        variant: "contained",
        color: "primary",
        className: [
          "bg-primary-700 text-white hover:bg-primary-600",
          "dark:bg-primary-600 dark:hover:bg-primary-700",
        ],
      },
      {
        variant: "contained",
        color: "secondary",
        className: "bg-secondary-700 text-white hover:bg-secondary-800",
      },
      {
        variant: "contained",
        className: "disabled:bg-gray-200 disabled:text-gray-400",
      },
      {
        variant: "outlined",
        color: "primary",
        className: [
          "border-primary/50 text-primary hover:border-primary",
          "hover:bg-primary/4 dark:hover:bg-primary/8",
        ],
      },
      {
        variant: "outlined",
        color: "secondary",
        className: [
          "border-secondary/50 text-secondary hover:border-secondary",
          "hover:bg-secondary/4 dark:hover:bg-secondary/8",
        ],
      },
      {
        variant: ["outlined", "text", "action", "plain"],
        className:
          "disabled:border-black/12 disabled:text-black/26 dark:disabled:border-white/12 dark:disabled:text-white/30",
      },
      { variant: "text", color: "primary", className: "text-primary" },
      { variant: "text", color: "secondary", className: "text-secondary" },
    ],
    defaultVariants: {
      variant: "contained",
      color: "primary",
      size: "medium",
    },
  },
);

type ButtonProps = Omit<React.ComponentProps<"button">, "color"> &
  VariantProps<typeof buttonVariants> & {
    /** Renderiza el hijo (un `<a>`, un `Link`) con el estilo del botón. */
    asChild?: boolean;
  };

function Button({
  className,
  variant,
  color,
  size,
  asChild = false,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, color, size, className }))}
      // Fuera de un formulario un botón no envía nada por accidente.
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    />
  );
}

export { Button, buttonVariants, type ButtonProps };
