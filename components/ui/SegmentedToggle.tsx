"use client";

import { motion } from "framer-motion";
import { type KeyboardEvent, useId, useRef } from "react";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { cn } from "@/lib/utils";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export interface SegmentedToggleOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedToggleProps<T extends string> {
  value: T;
  options: SegmentedToggleOption<T>[];
  onChange: (value: T) => void;
  "aria-label"?: string;
}

/**
 * Reemplaza el `ToggleButtonGroup` nativo de MUI en `TitheForm.tsx` (Tipo,
 * Frecuencia) — fase 07, feedback del cliente: quería una animación de
 * layout al cambiar de opción, igual que la que ya tienen los tabs de
 * `/proyectos`. MUI's `ToggleButtonGroup` no trae un indicador que se
 * deslice entre opciones, así que se arma un control propio con un fondo
 * compartido (`layoutId` de framer-motion) que hace FLIP entre la opción
 * anterior y la nueva — mismo mecanismo, en espíritu, que el indicador
 * nativo de `Tabs` de MUI.
 *
 * `useId()` como base del `layoutId` aísla cada instancia — Tipo y
 * Frecuencia no comparten animación entre sí aunque se rendericen al mismo
 * tiempo.
 *
 * Migrado a Tailwind (D113): mismo `radiogroup`/`radio` con `aria-checked` y
 * roving tabindex; con `prefers-reduced-motion` el indicador salta sin deslizar.
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
}: SegmentedToggleProps<T>) {
  const layoutId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useHydratedReducedMotion();

  // Patrón APG "radio group": flechas mueven la selección, el foco sigue al
  // control seleccionado (roving tabindex — solo el activo es tabbable).
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = options.findIndex((o) => o.value === value);
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight" || event.key === "ArrowDown")
      nextIndex = (currentIndex + 1) % options.length;
    else if (event.key === "ArrowLeft" || event.key === "ArrowUp")
      nextIndex = (currentIndex - 1 + options.length) % options.length;
    else return;
    event.preventDefault();
    const next = options[nextIndex];
    onChange(next.value);
    const nodes =
      containerRef.current?.querySelectorAll<HTMLElement>('[role="radio"]');
    nodes?.[nextIndex]?.focus();
  }

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      className="grid gap-0.5 rounded-sm border border-border bg-primary-900/3 p-0.75 dark:bg-white/3"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          // biome-ignore lint/a11y/useSemanticElements: radio propio (botón con indicador animado), ver arriba.
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative cursor-pointer rounded-xs border-0 bg-transparent py-2 text-center font-body font-medium text-13 transition-colors duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              active
                ? "text-gray-50"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.div
                layoutId={`${layoutId}-highlight`}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: EASE }}
                className="absolute inset-0 rounded-xs bg-primary"
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
