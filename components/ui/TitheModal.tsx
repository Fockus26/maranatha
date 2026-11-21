"use client";

import { useInView } from "framer-motion";
import { HandHeart, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTitheModal } from "@/lib/titheModalStore";
import { Button } from "./button";
import { Dialog, DialogClose, DialogContent, DialogTitle } from "./dialog";
import { PaymentStep, type PaymentStepContribution } from "./PaymentStep";
import { PatternLayer } from "./pattern-layer";
import { StepTransition } from "./StepTransition";
import {
  type ContributionType,
  FREQUENCY_LABEL,
  TitheForm,
  type TitheFormValues,
  TYPE_LABEL,
} from "./TitheForm";
import { TitheLayout } from "./TitheLayout";

/**
 * Modal "Ofrendar" (fase 07). Desde D098 la sección `Tithe.tsx` volvió a
 * Home (con el formulario completo) y este modal sigue abriéndose al hacer
 * click en el botón "Ofrendar" desde cualquier página (Navbar/PageNavbar/MobileMenuOverlay). Se
 * controla desde `TitheModalProvider`/`useTitheModal()`
 * (`lib/titheModalStore.tsx`), montado una sola vez en `app/layout.tsx` (D049).
 *
 * Sobre el `dialog` de Radix (D129): no monta su contenido cerrado (D099), así
 * que con el modal cerrado solo existe la instancia de `TitheForm` de la
 * sección; abierto, Radix atrapa el foco y deja inerte el resto de la página.
 * El `DateField` del paso 2 se porta dentro de este `role="dialog"` (D115).
 *
 * Conserva el contenido y el efecto "wow" del fondo decidido en D048
 * (patrón geométrico en pan continuo + contador animado de familias). El
 * contador solo corre mientras el modal está abierto (`active`), para que se
 * reinicie si el usuario lo cierra y lo vuelve a abrir — mismo criterio de
 * "una sola vez por apertura" que `useInView({ once: true })`.
 *
 * Revisiones del cliente que se conservan:
 * - Ocupa **toda la pantalla** en cualquier tamaño, con el contenido centrado
 *   verticalmente.
 * - Sin el resplandor naranja detrás del formulario.
 * - Navy `primary[900]` (no `primary[700]`): el cliente lo sentía "muy claro".
 * - Acentos naranjas en `secondary.main`, no en `secondary.light`.
 * - Sin velo blanco sobre el navy en oscuro (D057): el papel es `primary-900`
 *   sólido.
 * - El papel es un marco fijo (`overflow-hidden`) con el fondo, y el scroll
 *   vive en una capa interna: así el patrón cubre todo el alto aunque el paso
 *   de pago no entre en la pantalla.
 */

const FAMILIES_SUPPORTING = 132;

/** Mismo texto y duración que el `Snackbar` que reemplaza (D118). */
const REPORTED_TOAST_TEXT =
  "¡Gracias! Recibimos tu reporte de pago. Lo verificaremos en las próximas horas.";
const REPORTED_TOAST_MS = 6000;

function AnimatedFamiliesCounter({ active }: { active: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active || !isInView) return;
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
  }, [active, isInView]);

  return (
    <div ref={ref} className="mt-4 border-t border-gray-50/15 pt-3 md:mt-5">
      {/* 36/44 px: sin token en la escala (ver "Tokens que faltaron", PR). */}
      <span className="block font-heading text-[36px] font-extrabold leading-none text-secondary md:text-[44px]">
        +{value}
      </span>
      <p className="mt-0.75 font-body text-13 leading-body text-gray-50/65">
        familias aportando este año entre toda la comunidad
      </p>
    </div>
  );
}

export function TitheModal() {
  const { open, closeTithe } = useTitheModal();
  // Paso 2 (método de pago). `null` = el donante sigue en el formulario.
  const [contribution, setContribution] =
    useState<PaymentStepContribution | null>(null);

  function handleSubmit(values: TitheFormValues) {
    setContribution({
      purpose: values.type,
      frequency: values.frequency,
      amountUsd: values.amount,
      name: values.name,
      email: values.email,
    });
  }

  const stepOneRef = useRef<HTMLDivElement>(null);

  // Al volver, el botón "Volver" desaparece: el foco va al submit del paso 1
  // (que es desde donde el usuario había avanzado) en vez de caer al <body>.
  function handleBack() {
    setContribution(null);
    requestAnimationFrame(() => {
      stepOneRef.current
        ?.querySelector<HTMLElement>('button[type="submit"]')
        ?.focus();
    });
  }

  function handleClose() {
    closeTithe();
    setContribution(null);
  }

  function handleReported() {
    handleClose();
    toast.success(REPORTED_TOAST_TEXT, { duration: REPORTED_TOAST_MS });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // Sin descripción: el párrafo se oculta en móvil.
        aria-describedby={undefined}
        // Pantalla completa: anula la caja centrada de 444 px del `dialog`
        // (posición, ancho, radio, sombra, padding, grid y su scroll) y el
        // zoom de entrada; queda el fundido, como el `Fade` del Dialog de MUI.
        className="inset-0 top-0 left-0 block h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 overflow-hidden rounded-none bg-primary-900 p-0 shadow-none sm:max-w-none data-open:zoom-in-100 data-closed:zoom-out-100"
      >
        {/* Patrón geométrico en pan continuo — mismo "efecto wow" de D048. */}
        <PatternLayer />

        <DialogClose asChild>
          <Button
            variant="plain"
            size="icon"
            aria-label="Cerrar"
            className="absolute top-3 right-3 z-2 bg-gray-50/10 text-gray-50 hover:bg-gray-50/18 dark:text-gray-50 dark:hover:bg-gray-50/18"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </DialogClose>

        {/* Capa que scrollea, por encima del fondo fijo. */}
        <div className="absolute inset-0 z-1 overflow-y-auto">
          {/*
            Fase QA (design-qa): en pantallas bajas (teléfono horizontal) el
            centrado vertical dejaba el submit fuera de vista sin señal de
            que había más abajo. `safe center` no recorta el inicio del
            contenido cuando no entra; el `pb` grande garantiza aire bajo el
            botón "Continuar al pago".
          */}
          <div className="relative box-border flex min-h-full flex-col justify-center-safe p-3 pb-8 md:p-6">
            <TitheLayout
              text={
                <>
                  <div className="mb-3 inline-flex size-11 items-center justify-center rounded-lg bg-gray-50/10 text-secondary">
                    <HandHeart className="size-5" aria-hidden="true" />
                  </div>

                  {/* `tracking`: sin token (ver "Tokens que faltaron", PR). */}
                  <span className="mb-1.5 block font-body text-11 font-medium uppercase tracking-[0.18em] text-secondary">
                    Da con propósito
                  </span>

                  <DialogTitle className="mb-2 font-heading text-26 font-extrabold leading-h3 tracking-[-0.01em] text-gray-50 md:text-32">
                    Tu ofrenda sostiene esta obra
                  </DialogTitle>

                  {/* Feedback de cliente: en mobile este párrafo empujaba el
                formulario más abajo sin aportar tanto como el heading — se
                quita por debajo de `md`. */}
                  <p className="hidden font-body text-16 leading-body text-gray-50/72 md:block">
                    Cada aporte se destina directamente a nuestras áreas de
                    servicio y proyectos activos. Elige un monto, única vez o
                    mensual, y completa tus datos — sin compromisos, cancela
                    cuando quieras.
                  </p>

                  <AnimatedFamiliesCounter active={open} />
                </>
              }
              form={
                <>
                  {/* El formulario queda montado durante el paso 2 para que
                "Volver" conserve monto, tipo y datos ya ingresados (D087). */}
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
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
