"use client";

import { useInView } from "framer-motion";
import { HandHeart } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Container } from "@/components/ui/container";
import {
  PaymentStep,
  type PaymentStepContribution,
} from "@/components/ui/PaymentStep";
import { PatternLayer } from "@/components/ui/pattern-layer";
import { Reveal } from "@/components/ui/Reveal";
import { StepTransition } from "@/components/ui/StepTransition";
import {
  type ContributionType,
  FREQUENCY_LABEL,
  TitheForm,
  type TitheFormValues,
  TYPE_LABEL,
} from "@/components/ui/TitheForm";
import { TitheLayout } from "@/components/ui/TitheLayout";

/**
 * Sección "Ofrendar" de Home (D098) — vuelve a la home, ahora con el formulario
 * completo dentro (formulario + paso de método de pago, igual que el modal).
 * El botón "Ofrendar" del menú sigue abriendo `TitheModal` (D049); esta sección
 * es el segundo punto de entrada, para incentivar la donación sin tener que
 * abrir nada.
 *
 * Fondo navy sólido fijo (`primary[700]`) en claro y oscuro, con el patrón
 * geométrico de D048 y el contador animado de familias (una sola vez, al
 * entrar en el viewport). `TitheForm` solo recolecta datos (D018); el paso de
 * pago lo resuelve `PaymentStep`. Los ids de campos salen de `useId`, así que
 * conviven con la instancia del modal (D099); PayPal/Binance son
 * redirecciones, no hay SDK que cargar dos veces.
 */

const FAMILIES_SUPPORTING = 132;

/** Mismo texto y duración que el `Snackbar` que reemplaza (D118). */
const REPORTED_TOAST_TEXT =
  "¡Gracias! Recibimos tu reporte de pago. Lo verificaremos en las próximas horas.";
const REPORTED_TOAST_MS = 6000;

function AnimatedFamiliesCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const steps = 36;
    const durationMs = 1400;
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      const t = i / steps;
      const eased = 1 - (1 - t) ** 3;
      setValue(Math.round(FAMILIES_SUPPORTING * eased));
      if (i >= steps) clearInterval(timer);
    }, durationMs / steps);
    return () => clearInterval(timer);
  }, [isInView]);

  return (
    <div ref={ref} className="mt-4 border-t border-gray-50/15 pt-3 md:mt-5">
      {/* 36/44 px: sin token en la escala (ver "Tokens que faltaron", PR). */}
      <span className="block font-heading text-36 font-extrabold leading-none text-secondary-300 md:text-44">
        +{value}
      </span>
      <p className="mt-0.75 font-body text-13 leading-body text-gray-50/65">
        familias aportando este año entre toda la comunidad
      </p>
    </div>
  );
}

export function Tithe() {
  // Paso 2 (método de pago). `null` = el donante sigue en el formulario.
  const [contribution, setContribution] =
    useState<PaymentStepContribution | null>(null);
  const stepOneRef = useRef<HTMLDivElement>(null);

  function handleSubmit(values: TitheFormValues) {
    setContribution({
      purpose: values.type,
      frequency: values.frequency,
      amountUsd: values.amount,
      name: values.name,
      email: values.email,
    });
  }

  // Al volver, el foco regresa al submit del paso 1 en vez de caer al <body>.
  function handleBack() {
    setContribution(null);
    requestAnimationFrame(() => {
      stepOneRef.current
        ?.querySelector<HTMLElement>('button[type="submit"]')
        ?.focus();
    });
  }

  function handleReported() {
    setContribution(null);
    toast.success(REPORTED_TOAST_TEXT, { duration: REPORTED_TOAST_MS });
  }

  return (
    <section
      id="ofrendar"
      aria-labelledby="ofrendar-title"
      className="relative overflow-hidden bg-primary-700 py-8 md:py-12"
    >
      {/* Patrón geométrico en pan continuo (D048) */}
      <PatternLayer />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-radial-[circle_at_82%_15%] from-secondary-500/10 from-0% to-transparent to-45%"
      />

      <Container className="relative">
        <Reveal>
          <TitheLayout
            text={
              <>
                <div className="mb-3 inline-flex size-11 items-center justify-center rounded-lg bg-gray-50/10 text-secondary-300">
                  <HandHeart className="size-5" aria-hidden="true" />
                </div>

                {/* `tracking`: sin token (ver "Tokens que faltaron", PR). */}
                <span className="mb-1.5 block font-body text-11 font-medium uppercase tracking-eyebrow-lg text-secondary-300">
                  Da con propósito
                </span>

                <h2
                  id="ofrendar-title"
                  className="mb-2 font-heading text-28 font-extrabold leading-h3 tracking-tight text-gray-50 md:text-38"
                >
                  Tu ofrenda sostiene esta obra
                </h2>

                <p className="font-body text-16 leading-body text-gray-50/72">
                  Cada aporte se destina directamente a nuestras áreas de
                  servicio y proyectos activos. Elige un monto, única vez o
                  mensual, y completa tus datos — sin compromisos, cancela
                  cuando quieras.
                </p>

                <AnimatedFamiliesCounter />
              </>
            }
            form={
              <>
                {/* El formulario queda montado durante el paso 2 para que
              "Volver" conserve lo ya ingresado (D087). */}
                <StepTransition
                  showSecond={!!contribution}
                  firstRef={stepOneRef}
                  first={<TitheForm width={440} onSubmit={handleSubmit} />}
                  second={
                    contribution && (
                      <PaymentStep
                        width={440}
                        contribution={contribution}
                        summary={`${TYPE_LABEL[contribution.purpose as ContributionType]} · ${FREQUENCY_LABEL[contribution.frequency]}`}
                        onBack={handleBack}
                        onReported={handleReported}
                      />
                    )
                  }
                />
              </>
            }
          />
        </Reveal>
      </Container>
    </section>
  );
}
