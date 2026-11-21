"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { MAX_AMOUNT_USD, MIN_AMOUNT_USD } from "@/lib/payments/schema";
import { cn } from "@/lib/utils";
import { isValidEmail } from "@/lib/validation";
import { AmountSelector } from "./AmountSelector";
import { Button } from "./button";
import { DonationFormCard } from "./DonationFormCard";
import { Field } from "./field";
import { Input } from "./input";

export interface ProjectContributionFormValues {
  amount: number;
  name: string;
  email: string;
}

export interface ProjectContributionFormProps {
  projectTitle: string;
  projectImageUrl?: string;
  currentAmount: number;
  goalAmount: number;
  presetAmounts?: number[];
  onSubmit: (values: ProjectContributionFormValues) => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProjectContributionForm({
  projectTitle,
  projectImageUrl,
  currentAmount,
  goalAmount,
  presetAmounts = [25, 50, 100],
  onSubmit,
}: ProjectContributionFormProps) {
  const basePct = Math.min((currentAmount / goalAmount) * 100, 100);

  const [amount, setAmount] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [displayPct, setDisplayPct] = useState(basePct);

  const highlighted = amount > 0;
  const valueRef = useRef(basePct);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const target = highlighted
      ? Math.min(((currentAmount + amount) / goalAmount) * 100, 100)
      : basePct;
    const from = valueRef.current;
    const duration = 600;
    const startTime = performance.now();

    if (frameRef.current) cancelAnimationFrame(frameRef.current);

    function step(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      const value = from + (target - from) * eased;
      valueRef.current = value;
      setDisplayPct(value);
      if (t < 1) frameRef.current = requestAnimationFrame(step);
    }
    frameRef.current = requestAnimationFrame(step);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [amount, highlighted, currentAmount, goalAmount, basePct]);

  // Mismos límites que valida el servidor (lib/payments/schema.ts).
  const amountValid = amount >= MIN_AMOUNT_USD && amount <= MAX_AMOUNT_USD;
  const nameValid = name.trim().length > 0;
  const emailValid = isValidEmail(email);
  const formValid = amountValid && nameValid && emailValid;

  function handleSubmit(event?: FormEvent) {
    event?.preventDefault();
    setTouched(true);
    if (!formValid) return;
    // Sin guard de `submitting`: el submit solo avanza al paso de pago
    // (sincrónico, sin red), y el formulario queda montado para que "Volver"
    // conserve lo escrito — un bloqueo permanente lo dejaba inutilizable.
    onSubmit({ amount, name: name.trim(), email: email.trim() });
  }

  return (
    <form noValidate onSubmit={handleSubmit}>
      <DonationFormCard>
        <div className="mb-4.5 flex items-center gap-2.5 border-b border-border pb-4">
          <div
            className={cn(
              "size-11 shrink-0 rounded-md bg-cover bg-center",
              !projectImageUrl && "bg-primary-dark",
            )}
            style={
              projectImageUrl
                ? { backgroundImage: `url(${projectImageUrl})` }
                : undefined
            }
          />
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 font-heading text-13 font-semibold leading-body text-foreground">
              {projectTitle}
            </p>
            <p className="font-body text-11 leading-body text-muted-foreground">
              {formatCurrency(currentAmount)} de {formatCurrency(goalAmount)}
            </p>
          </div>
        </div>

        <div className="relative mb-1.5 h-2 overflow-hidden rounded-pill bg-accent">
          <div
            className={cn(
              "absolute inset-y-0 left-0 rounded-pill transition-[width,background-color] duration-600 ease-in-out",
              highlighted ? "bg-success" : "bg-secondary",
            )}
            style={{ width: `${displayPct}%` }}
          />
        </div>
        <div className="mb-4.5 flex items-baseline justify-between">
          <p
            className={cn(
              "font-heading font-bold leading-body transition-[color,font-size] duration-300 ease-in-out",
              highlighted ? "text-22 text-success" : "text-15 text-foreground",
            )}
          >
            {displayPct.toFixed(2)}%
          </p>
          <p className="font-body text-11 leading-body text-muted-foreground">
            recaudado
          </p>
        </div>

        <p className="mb-2 font-body text-12 font-medium leading-body text-foreground">
          Monto a aportar
        </p>
        <div className="mb-3.5">
          <AmountSelector
            presets={presetAmounts}
            onChange={setAmount}
            error={touched && !amountValid}
            helperText="Elige un monto entre US$ 1 y US$ 10.000."
          />
        </div>

        <div className="mb-4.5 flex flex-col gap-3.5">
          <Field
            label="Nombre completo"
            required
            error={
              touched && !nameValid ? "Ingresa tu nombre completo." : undefined
            }
          >
            <Input
              required
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

        <div className="border-t border-border pt-4.5">
          <Button type="submit" color="secondary" className="w-full">
            Continuar al pago
          </Button>
        </div>
      </DonationFormCard>
    </form>
  );
}
