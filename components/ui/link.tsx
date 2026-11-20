import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Enlace de texto del sitio (D112): shadcn no trae uno. Replica el `MuiLink`
 * del tema — color primario por modo (`text-primary`), subrayado al hover y el
 * foco de D085 (outline 2px, offset 2px, `--focus-ring`). `tone="muted"` es el
 * `color="text.secondary"` de los enlaces secundarios; `underline="always"`
 * deja la línea fija (enlaces dentro de un formulario).
 *
 * `asChild` para `next/link`: `<Link asChild><NextLink href="/x">…</NextLink></Link>`.
 */
const linkVariants = cva(
  [
    "cursor-pointer rounded-xs font-body underline-offset-2",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  ],
  {
    variants: {
      tone: {
        primary: "text-primary",
        muted: "text-muted-foreground",
      },
      underline: {
        hover: "no-underline hover:underline",
        always: "underline",
      },
    },
    defaultVariants: { tone: "primary", underline: "hover" },
  },
);

type LinkProps = React.ComponentProps<"a"> &
  VariantProps<typeof linkVariants> & {
    /** Renderiza el hijo (un `next/link`) con el estilo del enlace. */
    asChild?: boolean;
  };

function Link({
  className,
  tone,
  underline,
  asChild = false,
  ...props
}: LinkProps) {
  const Comp = asChild ? Slot.Root : "a";
  return (
    <Comp
      data-slot="link"
      className={cn(linkVariants({ tone, underline }), className)}
      {...props}
    />
  );
}

export { Link, type LinkProps, linkVariants };
