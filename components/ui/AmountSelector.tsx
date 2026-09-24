"use client";

import { useState } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import { AnimatePresence, motion } from "framer-motion";
import { radius, secondary, typography } from "@/theme/tokens";

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
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function AmountSelector({ presets, onChange, customLabel = "Otro monto", error, helperText }: AmountSelectorProps) {
  const theme = useTheme();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");

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

  function handleCustomChange(value: string) {
    setCustomAmount(value);
    setSelectedPreset(null);
    onChange(value === "" ? 0 : Number(value));
  }

  return (
    <Box>
      <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${presets.length}, 1fr)`, gap: 2, mb: 3.5 }}>
        {presets.map((value) => {
          const active = selectedPreset === value;
          return (
            <Box
              key={value}
              component="button"
              type="button"
              onClick={() => handlePresetClick(value)}
              aria-pressed={active}
              aria-label={`Monto ${formatCurrency(value)}`}
              sx={{
                position: "relative",
                textAlign: "center",
                py: 2.5,
                borderRadius: `${radius.sm}px`,
                fontFamily: "var(--font-body)",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                backgroundColor: "transparent",
                // Borde y texto ya no dependen de una animación compartida
                // entre presets (ver abajo) — cambian de golpe, es el fondo
                // el que hace la transición.
                border: `1px solid ${active ? theme.palette.secondary.main : theme.palette.divider}`,
                // El texto del preset activo usaba `secondary.dark`
                // (#B34C02) sobre el fondo naranja translúcido — el cliente
                // lo vio "sucio" (un naranja quemado/marrón, poco legible).
                // `secondary[700]` es el mismo naranja apagado ya usado para
                // "seleccionado" en el resto del sitio (tabs de Proyectos,
                // D051; píldora activa del navbar, D054) — más claro y
                // consistente.
                color: active ? secondary[700] : theme.palette.text.primary,
              }}
            >
              {/*
                Revisión: el fondo naranja ya NO usa `layoutId` compartido
                entre presets. Con `layoutId`, framer-motion trata el
                highlight como un único elemento que se desliza (FLIP) desde
                la posición del preset anterior hasta la del nuevo — el
                cliente pidió específicamente que NO se deslizara: quería un
                fundido (fade out del anterior, fade in del nuevo), cada uno
                en su propio lugar. Por eso cada preset ahora tiene su propio
                `AnimatePresence` independiente: al cambiar de selección, el
                highlight del preset que se deselecciona se desmonta con
                `exit` (fade out) mientras el del nuevo preset se monta con
                `initial`→`animate` (fade in), en simultáneo pero sin ningún
                movimiento compartido entre ambos.
              */}
              <AnimatePresence>
                {active && (
                  <Box
                    key="highlight"
                    component={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: EASE }}
                    sx={{
                      position: "absolute",
                      inset: -1,
                      borderRadius: `${radius.sm}px`,
                      border: `1px solid ${theme.palette.secondary.main}`,
                      backgroundColor: theme.palette.secondary.light + "22",
                      zIndex: 0,
                    }}
                  />
                )}
              </AnimatePresence>
              <Box component="span" sx={{ position: "relative", zIndex: 1 }}>
                {formatCurrency(value)}
              </Box>
            </Box>
          );
        })}
      </Box>
      <TextField
        placeholder={customLabel}
        type="number"
        // En el <input> (no en el contenedor): es el que necesita el nombre
        // accesible. "decimal": se aceptan centavos.
        slotProps={{ htmlInput: { "aria-label": customLabel, inputMode: "decimal", min: 0, step: "0.01" } }}
        fullWidth
        size="small"
        value={customAmount}
        onChange={(e) => handleCustomChange(e.target.value)}
        error={error}
        helperText={error ? helperText : undefined}
        sx={{
          // Placeholder/valor del input más chico — el default de MUI (16px)
          // se veía "muy grande" para el cliente en un campo de una sola
          // línea; 14px iguala el resto de texto secundario del formulario.
          "& .MuiInputBase-input": { fontSize: typography.size.small },
          "& .MuiInputBase-input::placeholder": { fontSize: typography.size.small },
          // Quita las flechas de incremento/decremento del input numérico
          // (Chrome/Safari vía -webkit-appearance, Firefox vía
          // -moz-appearance) — al cliente no le gustaban.
          "& input[type=number]": { MozAppearance: "textfield" },
          "& input[type=number]::-webkit-outer-spin-button": { WebkitAppearance: "none", margin: 0 },
          "& input[type=number]::-webkit-inner-spin-button": { WebkitAppearance: "none", margin: 0 },
        }}
      />
    </Box>
  );
}
