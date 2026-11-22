"use client";

import { AnimatePresence, animate, motion } from "framer-motion";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  donorNameSchema,
  MAX_AMOUNT_USD,
  MAX_DONOR_NAME,
  MIN_AMOUNT_USD,
} from "@/lib/payments/schema";
import { isValidEmail } from "@/lib/validation";
import { AmountSelector } from "./AmountSelector";
import { Button } from "./button";
import { DonationFormCard } from "./DonationFormCard";
import { Field } from "./field";
import { Input } from "./input";
import { SegmentedToggle } from "./SegmentedToggle";

const EASE = [0.2, 0.8, 0.2, 1] as const;

/** Etiqueta de grupo del formulario ("Monto", "Tipo", "Frecuencia"). */
const GROUP_LABEL_CLASSES =
  "mb-2 font-body text-12 font-medium leading-body text-foreground";

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
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export const TYPE_LABEL: Record<ContributionType, string> = {
  diezmo: "Diezmo",
  ofrenda: "Ofrenda",
};
export const FREQUENCY_LABEL: Record<ContributionFrequency, string> = {
  once: "Única vez",
  monthly: "Mensual",
};

export function TitheForm({
  presetAmounts = [25, 50, 100],
  width,
  onSubmit,
}: TitheFormProps) {
  const [type, setType] = useState<ContributionType>("diezmo");
  const [frequency, setFrequency] = useState<ContributionFrequency>("once");
  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  // Mismos límites que valida el servidor (lib/payments/schema.ts).
  const amountValid = amount >= MIN_AMOUNT_USD && amount <= MAX_AMOUNT_USD;
  const nameValid = donorNameSchema.safeParse(name).success;
  const nameError =
    name.trim().length === 0
      ? "Ingresa tu nombre completo."
      : name.trim().length > MAX_DONOR_NAME
        ? `El nombre puede tener hasta ${MAX_DONOR_NAME} caracteres.`
        : "Escribe tu nombre solo con letras, sin emojis ni símbolos especiales.";
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
    onSubmit({
      type,
      amount,
      frequency,
      name: name.trim(),
      email: email.trim(),
    });
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <DonationFormCard width={width}>
        <div className="mb-4.5 border-b border-border pb-4.5 text-center">
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
            <motion.div
              key={amountValid || displayAmount > 0 ? "value" : "empty"}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.22, ease: EASE }}
            >
              <p className="font-heading text-32 font-extrabold leading-body text-foreground">
                {amountValid || displayAmount > 0
                  ? formatCurrency(Math.round(displayAmount))
                  : "—"}
              </p>
            </motion.div>
          </AnimatePresence>
          <p className="mt-0.25 font-body text-12 leading-body text-muted-foreground">
            {TYPE_LABEL[type]} · {FREQUENCY_LABEL[frequency]}
          </p>
        </div>

        <p className={GROUP_LABEL_CLASSES}>Monto</p>
        <div className="mb-3.5">
          <AmountSelector
            presets={presetAmounts}
            onChange={setAmount}
            error={touched && !amountValid}
            helperText="Elige un monto entre US$ 1 y US$ 10.000."
          />
        </div>

        <p className={GROUP_LABEL_CLASSES}>Tipo</p>
        <div className="mb-3.5">
          <SegmentedToggle
            aria-label="Tipo de aporte"
            value={type}
            onChange={setType}
            options={[
              { value: "diezmo", label: "Diezmo" },
              { value: "ofrenda", label: "Ofrenda" },
            ]}
          />
        </div>

        <p className={GROUP_LABEL_CLASSES}>Frecuencia</p>
        <div className="mb-4.5">
          <SegmentedToggle
            aria-label="Frecuencia del aporte"
            value={frequency}
            onChange={setFrequency}
            options={[
              { value: "once", label: "Única vez" },
              { value: "monthly", label: "Mensual" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3.5 border-t border-border pt-4.5">
          <Field
            label="Nombre completo"
            required
            error={touched && !nameValid ? nameError : undefined}
          >
            <Input
              required
              maxLength={MAX_DONOR_NAME}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field
            label="Correo electrónico"
            required
            error={
              touched && !emailValid
                ? "Ingresa un correo electrónico válido."
                : undefined
            }
          >
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
        </div>

        <div className="mt-4.5 border-t border-border pt-4.5">
          <Button type="submit" color="secondary" className="w-full">
            Continuar al pago
          </Button>
        </div>
      </DonationFormCard>
    </form>
  );
}
