"use client";

import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  PaymentStep,
  type PaymentStepContribution,
} from "@/components/ui/PaymentStep";
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
import { patternLayerSx } from "@/theme/patterns";
import { fontScale, gray, primary, radius, semantic } from "@/theme/tokens";

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
 * pago lo resuelve `PaymentStep`. Los ids de campos salen de `useId` (MUI), así
 * que conviven con la instancia del modal; PayPal/Binance son redirecciones,
 * no hay SDK que cargar dos veces.
 */

const FAMILIES_SUPPORTING = 132;

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
    <Box
      ref={ref}
      sx={{
        mt: { xs: 4, md: 5 },
        pt: 3,
        borderTop: "1px solid rgba(245,246,250,0.15)",
      }}
    >
      <Typography
        component="span"
        sx={{
          display: "block",
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          fontSize: { xs: "36px", md: "44px" },
          lineHeight: 1,
          color: "secondary.light",
        }}
      >
        +{value}
      </Typography>
      <Typography
        sx={{
          fontFamily: "var(--font-body)",
          fontSize: fontScale[13],
          color: "rgba(245,246,250,0.65)",
          mt: 0.75,
        }}
      >
        familias aportando este año entre toda la comunidad
      </Typography>
    </Box>
  );
}

export function Tithe() {
  const [confirmed, setConfirmed] = useState(false);
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
    setConfirmed(true);
  }

  return (
    <>
      <Box
        component="section"
        id="ofrendar"
        aria-labelledby="ofrendar-title"
        sx={{
          position: "relative",
          overflow: "hidden",
          py: { xs: 8, md: 12 },
          backgroundColor: primary[700],
        }}
      >
        {/* Patrón geométrico en pan continuo (D048) */}
        <Box aria-hidden="true" sx={patternLayerSx()} />
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 82% 15%, rgba(249,117,13,0.10) 0%, transparent 45%)",
          }}
        />

        <Container maxWidth="lg" sx={{ position: "relative" }}>
          <Reveal>
            <TitheLayout
              text={
                <>
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 44,
                      height: 44,
                      borderRadius: `${radius.lg}px`,
                      backgroundColor: "rgba(245,246,250,0.1)",
                      color: "secondary.light",
                      mb: 3,
                    }}
                  >
                    <VolunteerActivismRoundedIcon fontSize="small" />
                  </Box>

                  <Typography
                    component="span"
                    sx={{
                      display: "block",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: fontScale[11],
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "secondary.light",
                      mb: 1.5,
                    }}
                  >
                    Da con propósito
                  </Typography>

                  <Typography
                    component="h2"
                    id="ofrendar-title"
                    sx={{
                      fontFamily: "var(--font-heading)",
                      fontWeight: 800,
                      fontSize: { xs: "28px", md: "38px" },
                      lineHeight: 1.2,
                      letterSpacing: "-0.01em",
                      color: gray[50],
                      mb: 2,
                    }}
                  >
                    Tu ofrenda sostiene esta obra
                  </Typography>

                  <Typography
                    sx={{
                      fontFamily: "var(--font-body)",
                      fontSize: fontScale[16],
                      lineHeight: 1.6,
                      color: "rgba(245,246,250,0.72)",
                    }}
                  >
                    Cada aporte se destina directamente a nuestras áreas de
                    servicio y proyectos activos. Elige un monto, única vez o
                    mensual, y completa tus datos — sin compromisos, cancela
                    cuando quieras.
                  </Typography>

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
      </Box>
      <Snackbar
        open={confirmed}
        autoHideDuration={6000}
        onClose={() => setConfirmed(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setConfirmed(false)}
          severity="success"
          variant="filled"
          sx={{
            width: "100%",
            bgcolor: semantic.successFilled,
            color: gray[50],
            "& .MuiAlert-icon, & .MuiAlert-action": { color: gray[50] },
          }}
        >
          ¡Gracias! Recibimos tu reporte de pago. Lo verificaremos en las
          próximas horas.
        </Alert>
      </Snackbar>
    </>
  );
}
