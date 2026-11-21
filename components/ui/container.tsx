import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Contenedor de página (D119), con los anchos que tenía el `Container` de MUI.
 * Centrado, 100 % de ancho, gutters de 8 px (12 desde `sm`: el `spacing` del tema es de 4 px por unidad) y tope por
 * `maxWidth`. `lg` (el de las secciones) sube a 1440 desde `xl` (1536) y a
 * 1600 desde 1920 (`wide:`); los anchos salen de `layout.page` de
 * `theme/tokens.ts` (`max-w-page-*`).
 *
 *   <Container>…</Container>                      // lg, como MUI por defecto
 *   <Container maxWidth="md" asChild><section>…</section></Container>
 */
const containerVariants = cva("mx-auto box-border block w-full", {
  variants: {
    maxWidth: {
      xs: "max-w-page-xs",
      sm: "max-w-page-sm",
      md: "max-w-page-md",
      lg: "max-w-page-lg xl:max-w-page-xl wide:max-w-page-wide",
      none: "",
    },
    disableGutters: {
      true: "",
      false: "px-2 sm:px-3",
    },
  },
  defaultVariants: { maxWidth: "lg", disableGutters: false },
});

function Container({
  className,
  maxWidth,
  disableGutters,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";
  return (
    <Comp
      data-slot="container"
      className={cn(containerVariants({ maxWidth, disableGutters }), className)}
      {...props}
    />
  );
}

export { Container, containerVariants };
