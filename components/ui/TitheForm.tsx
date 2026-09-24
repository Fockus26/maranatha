"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import { AnimatePresence, animate, motion } from "framer-motion";
import { typography } from "@/theme/tokens";
import { isValidEmail } from "@/lib/validation";
import { AmountSelector } from "./AmountSelector";
import { DonationFormCard } from "./DonationFormCard";
import { SegmentedToggle } from "./SegmentedToggle";

const EASE = [0.2, 0.8, 0.2, 1] as const;

// Tamaño de label/placeholder de los TextField del formulario — antes usaban
// el tamaño default de MUI (16px en reposo), que el cliente encontró
// "muy grande" para un input de una sola línea. `typography.size.small`
// (14px) es el mismo tamaño que ya usa el resto de texto secundario del
// formulario (labels de sección, texto bajo el monto).
const FIELD_LABEL_SX = {
  "& .MuiInputLabel-root": { fontSize: typography.size.small },
  "& .MuiInputBase-input": { fontSize: typography.size.small },
} as const;

/**
 * Anima el número mostrado hacia `target` (estilo "contador") en vez de
 * saltar de golpe — pedido del cliente, mismo criterio de easing que el
 * resto del sitio.
 *
 * Revisión: antes, si no había un monto previo válido (0 → algo), se
 * saltaba directo a `target` sin animar — esto hacía que la PRIMERA
 * selección de monto (el caso más común: usuario entra, no hay nada
 * elegido, toca un preset) apareciera de golpe en vez de contar, que es
 * justo el caso que el cliente señaló que faltaba. Ahora solo se salta
 * directo cuando el DESTINO es 0 (el usuario deselecciona/limpia el
 * monto) — ahí no tiene sentido "contar hacia atrás" antes de mostrar el
 * placeholder ("—"). Cualquier otro caso, incluyendo 0 → primer monto,
 * cuenta de forma animada.
 */
function useAnimatedAmount(target: number) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);

  useEffect(() => {
    const from = prevRef.current;
    prevRef.current = target;

    if (target === 0) {
      setDisplay(target);
      return;
    }

    const controls = animate(from, target, {
      duration: 0.45,
      ease: EASE,
      onUpdate: (value) => setDisplay(value),
    });
    return () => controls.stop();
  }, [target]);

  return display;
}

export type ContributionType = "diezmo" | "ofrenda";
export type ContributionFrequency = "once" | "monthly";

export interface TitheFormValues {
  type: ContributionType;
  amount: number;
  frequency: ContributionFrequency;
  name: string;
  email: string;
}

export interface TitheFormProps {
  presetAmounts?: number[];
  width?: number;
  onSubmit: (values: TitheFormValues) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export const TYPE_LABEL: Record<ContributionType, string> = { diezmo: "Diezmo", ofrenda: "Ofrenda" };
export const FREQUENCY_LABEL: Record<ContributionFrequency, string> = { once: "Única vez", monthly: "Mensual" };

export function TitheForm({ presetAmounts = [25, 50, 100], width, onSubmit }: TitheFormProps) {
  const theme = useTheme();

  const [type, setType] = useState<ContributionType>("diezmo");
  const [frequency, setFrequency] = useState<ContributionFrequency>("once");
  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const amountValid = amount > 0;
  const nameValid = name.trim().length > 0;
  const emailValid = isValidEmail(email);
  const formValid = amountValid && nameValid && emailValid;
  const displayAmount = useAnimatedAmount(amount);

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setTouched(true);
    if (!formValid) return;
    // Sin guard de `submitting`: el submit solo avanza al paso de pago
    // (sincrónico, sin red), y el formulario queda montado para que "Volver"
    // conserve lo escrito — un bloqueo permanente lo dejaba inutilizable.
    onSubmit({ type, amount, frequency, name: name.trim(), email: email.trim() });
  }

  return (
    <Box component="form" noValidate onSubmit={handleSubmit}>
    <DonationFormCard width={width}>
      <Box sx={{ textAlign: "center", pb: 4.5, mb: 4.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
        {/*
          `AnimatePresence` con `key` en si hay monto o no: cubre el caso
          "no hay monto seleccionado → primer monto" que el cliente marcó
          como sin animación — antes el texto pasaba de "—" a "$25" de
          golpe (el conteo de `useAnimatedAmount` solo cubre monto→monto,
          no placeholder→monto, que no es un número interpolable). El
          `key` NO cambia entre montos distintos (25→50 sigue siendo
          "value"), así que esta animación de entrada solo dispara en la
          transición real de "vacío" a "con monto" (y viceversa al limpiar)
          — los cambios de monto entre sí los sigue cubriendo el conteo.
        */}
        <AnimatePresence mode="wait" initial={false}>
          <Box
            key={amountValid || displayAmount > 0 ? "value" : "empty"}
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.22, ease: EASE }}
          >
            <Typography sx={{ fontFamily: typography.fontFamily.heading, fontWeight: 800, fontSize: "32px", color: theme.palette.text.primary }}>
              {amountValid || displayAmount > 0 ? formatCurrency(Math.round(displayAmount)) : "—"}
            </Typography>
          </Box>
        </AnimatePresence>
        <Typography sx={{ fontFamily: typography.fontFamily.body, fontSize: "12px", color: theme.palette.text.secondary, mt: 0.25 }}>
          {TYPE_LABEL[type]} · {FREQUENCY_LABEL[frequency]}
        </Typography>
      </Box>

      <Typography sx={{ fontFamily: typography.fontFamily.body, fontSize: "12px", fontWeight: 500, color: theme.palette.text.primary, mb: 2 }}>
        Monto
      </Typography>
      <Box sx={{ mb: 3.5 }}>
        <AmountSelector
          presets={presetAmounts}
          onChange={setAmount}
          error={touched && !amountValid}
          helperText="Elegí un monto o ingresá uno propio."
        />
      </Box>

      <Typography sx={{ fontFamily: typography.fontFamily.body, fontSize: "12px", fontWeight: 500, color: theme.palette.text.primary, mb: 2 }}>
        Tipo
      </Typography>
      <Box sx={{ mb: 3.5 }}>
        <SegmentedToggle
          aria-label="Tipo de aporte"
          value={type}
          onChange={setType}
          options={[
            { value: "diezmo", label: "Diezmo" },
            { value: "ofrenda", label: "Ofrenda" },
          ]}
        />
      </Box>

      <Typography sx={{ fontFamily: typography.fontFamily.body, fontSize: "12px", fontWeight: 500, color: theme.palette.text.primary, mb: 2 }}>
        Frecuencia
      </Typography>
      <Box sx={{ mb: 4.5 }}>
        <SegmentedToggle
          aria-label="Frecuencia del aporte"
          value={frequency}
          onChange={setFrequency}
          options={[
            { value: "once", label: "Única vez" },
            { value: "monthly", label: "Mensual" },
          ]}
        />
      </Box>

      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4.5, display: "flex", flexDirection: "column", gap: 3.5 }}>
        <TextField
          label="Nombre completo"
          fullWidth
          size="small"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={touched && !nameValid}
          helperText={touched && !nameValid ? "Ingresá tu nombre completo." : undefined}
          sx={FIELD_LABEL_SX}
        />
        <TextField
          label="Correo electrónico"
          type="email"
          fullWidth
          size="small"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={touched && !emailValid}
          helperText={touched && !emailValid ? "Ingresá un correo electrónico válido." : undefined}
          sx={FIELD_LABEL_SX}
        />
      </Box>

      <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 4.5, pt: 4.5 }}>
        <Button fullWidth type="submit" variant="contained" color="secondary">
          Continuar al pago
        </Button>
      </Box>
    </DonationFormCard>
    </Box>
  );
}
