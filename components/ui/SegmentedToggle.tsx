"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { type KeyboardEvent, useId, useRef } from "react";
import { radius } from "@/theme/tokens";

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
 */
export function SegmentedToggle<T extends string>({
  value,
  options,
  onChange,
  "aria-label": ariaLabel,
}: SegmentedToggleProps<T>) {
  const theme = useTheme();
  const layoutId = useId();
  const containerRef = useRef<HTMLDivElement>(null);

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
    <Box
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      sx={{
        display: "grid",
        gridTemplateColumns: `repeat(${options.length}, 1fr)`,
        gap: "2px",
        p: "3px",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: `${radius.sm}px`,
        backgroundColor:
          theme.palette.mode === "dark"
            ? "rgba(255,255,255,0.03)"
            : "rgba(6,10,29,0.03)",
      }}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Box
            key={option.value}
            component="button"
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(option.value)}
            sx={{
              position: "relative",
              textAlign: "center",
              py: 1,
              border: "none",
              background: "transparent",
              borderRadius: `${Math.max(radius.sm - 3, 4)}px`,
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              color: active ? "#F5F6FA" : theme.palette.text.secondary,
              transition: "color 0.2s ease",
              "&:hover": !active
                ? { color: theme.palette.text.primary }
                : undefined,
            }}
          >
            {active && (
              <Box
                component={motion.div}
                layoutId={`${layoutId}-highlight`}
                transition={{ duration: 0.3, ease: EASE }}
                sx={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: `${Math.max(radius.sm - 3, 4)}px`,
                  backgroundColor: theme.palette.primary.main,
                  zIndex: 0,
                }}
              />
            )}
            <Box component="span" sx={{ position: "relative", zIndex: 1 }}>
              {option.label}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
