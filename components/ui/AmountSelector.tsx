"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Field } from "./field";
import { Input } from "./input";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export interface AmountSelectorProps {
  presets: number[];
  onChange: (amount: number) => void;
  customLabel?: string;
  error?: boolean;
  /** Fase 09 (D067) — mensaje bajo el campo cuando `error` está activo. */
  helperText?: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Monto en edición: hasta 5 enteros (máx. 10.000) y 2 decimales. */
const CUSTOM_AMOUNT_RE = /^\d{0,5}(\.\d{0,2})?$/;

export function AmountSelector({
  presets,
  onChange,
  customLabel = "Otro monto",
  error,
  helperText,
}: AmountSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const showError = Boolean(error && helperText);

  function handlePresetClick(value: number) {
    if (selectedPreset === value) {
      setSelectedPreset(null);
      onChange(0);
      return;
    }
    setSelectedPreset(value);
    setCustomAmount("");
    onChange(value);
  }

  function handleCustomChange(raw: string) {
    // Solo dígitos y hasta 2 decimales (coma o punto): el servidor rechaza
    // "25.999" o "1e3" en el reporte manual, así que no se dejan escribir.
    const value = raw.replace(",", ".");
    if (!CUSTOM_AMOUNT_RE.test(value)) return;
    setCustomAmount(value);
    setSelectedPreset(null);
    onChange(value === "" || value === "." ? 0 : Number(value));
  }

  return (
    <div>
      <div
        className="mb-3.5 grid gap-2"
        // Una columna por preset (la cantidad llega por prop).
        style={{ gridTemplateColumns: `repeat(${presets.length}, 1fr)` }}
      >
        {presets.map((value) => {
          const active = selectedPreset === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => handlePresetClick(value)}
              aria-pressed={active}
              aria-label={`Monto ${formatCurrency(value)}`}
              className={cn(
                "relative cursor-pointer rounded-sm border bg-transparent py-2.5 text-center font-body text-13 font-medium",
                // Borde y texto cambian de golpe; es el fondo el que hace la
                // transición (ver abajo). El texto activo es `secondary[700]`,
                // el naranja de "seleccionado" del sitio (D051, D054); en
                // oscuro, el naranja claro (~8:1 sobre gray[800]).
                active
                  ? "border-secondary text-secondary-700 dark:text-secondary-300"
                  : "border-border text-foreground",
              )}
            >
              {/*
                El fondo naranja no usa `layoutId` compartido entre presets: el
                cliente pidió un fundido (fade out del anterior, fade in del
                nuevo), cada uno en su lugar, sin deslizarse. Cada preset tiene
                su propio `AnimatePresence`.
              */}
              <AnimatePresence>
                {active && (
                  <motion.div
                    key="highlight"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    className="absolute -inset-px z-0 rounded-sm border border-secondary bg-secondary-light/13"
                  />
                )}
              </AnimatePresence>
              <span className="relative z-1">{formatCurrency(value)}</span>
            </button>
          );
        })}
      </div>
      {/* La etiqueta existe para el lector de pantalla; a la vista, el placeholder. */}
      <Field
        label={customLabel}
        hideLabel
        error={showError ? helperText : error || undefined}
      >
        <Input
          placeholder={customLabel}
          // "text" y no "number": con "number" el navegador deja pasar "1e3" y
          // no hay forma de limitar los decimales al escribir. "decimal": se
          // aceptan centavos.
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={customAmount}
          onChange={(e) => handleCustomChange(e.target.value)}
        />
      </Field>
    </div>
  );
}
