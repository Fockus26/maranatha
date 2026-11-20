"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useColorMode } from "@/theme/ThemeRegistry";

type ThemeToggleProps = {
  /** `large` agranda el ícono (24 px); `small`/`medium` usan 20 px. */
  size?: "small" | "medium" | "large";
  /**
   * Clases extra — para ajustar el color si el toggle vive sobre un fondo que
   * no sigue el modo (D024/D025). Sobre `data-surface="navy"` no hace falta:
   * la variante `navy:` de aquí ya pone los colores del navy fijo.
   */
  className?: string;
};

export default function ThemeToggle({
  size = "small",
  className,
}: ThemeToggleProps) {
  const { mode, toggleColorMode } = useColorMode();
  const Icon = mode === "light" ? Moon : Sun;

  return (
    <Button
      variant="plain"
      size="icon"
      onClick={toggleColorMode}
      aria-label={
        mode === "light" ? "Activar modo oscuro" : "Activar modo claro"
      }
      className={cn(
        "size-11 rounded-xl text-muted-foreground transition-[rotate,background-color] duration-250 dark:text-muted-foreground",
        "hover:rotate-20 motion-reduce:hover:rotate-0",
        "navy:text-on-navy-muted navy:hover:bg-on-navy-hover navy:hover:text-on-navy",
        className,
      )}
    >
      <Icon className={size === "large" ? "size-6" : "size-5"} aria-hidden />
    </Button>
  );
}
