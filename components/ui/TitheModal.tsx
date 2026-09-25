"use client";

import { useEffect, useRef, useState } from "react";
import Dialog from "@mui/material/Dialog";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import { useInView } from "framer-motion";
import { FREQUENCY_LABEL, TYPE_LABEL, TitheForm, type ContributionType, type TitheFormValues } from "./TitheForm";
import { PaymentStep, type PaymentStepContribution } from "./PaymentStep";
import { useTitheModal } from "@/lib/titheModalStore";
import { patternLayerSx } from "@/theme/patterns";
import { gray, semantic } from "@/theme/tokens";

/**
 * Modal "Diezmo/Aportes" (fase 07 — reemplaza a la sección `Tithe.tsx` de
 * Home, ahora removida): a pedido del cliente, el diezmo deja de vivir al
 * final de Home y en su lugar se abre como modal al hacer click en el botón
 * "Diezmo" desde cualquier página (Navbar/PageNavbar/MobileMenuOverlay). Se
 * controla desde `TitheModalProvider`/`useTitheModal()`
 * (`lib/titheModalStore.tsx`), montado una sola vez en `app/layout.tsx`.
 *
 * Conserva el contenido y el efecto "wow" del fondo decidido en D048
 * (patrón geométrico en pan continuo + contador animado de familias, ver
 * comparativo de `/design`), ahora dentro de un `Dialog` de MUI en vez de
 * una sección de Home. El contador solo corre mientras el modal está
 * abierto (`active`), para que se reinicie visualmente si el usuario lo
 * cierra y lo vuelve a abrir mucho después — mismo criterio de "una sola
 * vez por apertura" que tenía `useInView({ once: true })` en la sección
 * original, ahora ligado al ciclo de vida del modal en vez del scroll.
 *
 * Revisión (feedback directo del cliente): el modal siempre ocupa **toda
 * la pantalla** (`fullScreen` fijo, ya no solo por debajo de `md`) — antes
 * en desktop se veía como un dialog centrado de ancho medio, y el cliente
 * lo quería a pantalla completa en cualquier tamaño. El contenido se
 * centra verticalmente dentro de esa pantalla completa.
 *
 * Segunda revisión (feedback directo del cliente, previo a fase 08):
 * - Se quita el resplandor/degradado naranja que había detrás del
 *   formulario (`radial-gradient` en la esquina superior derecha) — se
 *   veía como un "reflejo" no intencional sobre la tarjeta del formulario.
 * - El navy de fondo pasa de `primary[700]` (`#101B45`) a `primary[900]`
 *   (`#060A1D`) — el cliente lo sentía "muy claro"; entre eso y el patrón
 *   de líneas blancas semitransparentes encima, el navy se percibía menos
 *   saturado de lo esperado.
 * - Los acentos naranjas (eyebrow, ícono, contador de familias) pasan de
 *   `secondary.light` (`#FCA355`, pastel) a `secondary.main` (`#F9750D`,
 *   el naranja de marca) — mismo motivo: se veían demasiado apagados.
 */


const FAMILIES_SUPPORTING = 132;

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
    <Box ref={ref} sx={{ mt: { xs: 4, md: 5 }, pt: 3, borderTop: "1px solid rgba(245,246,250,0.15)" }}>
      <Typography
        component="span"
        sx={{
          display: "block",
          fontFamily: "var(--font-heading)",
          fontWeight: 800,
          fontSize: { xs: "36px", md: "44px" },
          lineHeight: 1,
          color: "secondary.main",
        }}
      >
        +{value}
      </Typography>
      <Typography sx={{ fontFamily: "var(--font-body)", fontSize: 13, color: "rgba(245,246,250,0.65)", mt: 0.75 }}>
        familias aportando este año entre toda la comunidad
      </Typography>
    </Box>
  );
}

export function TitheModal() {
  const { open, closeTithe } = useTitheModal();
  const [confirmed, setConfirmed] = useState(false);
  // Paso 2 (método de pago). `null` = el donante sigue en el formulario.
  const [contribution, setContribution] = useState<PaymentStepContribution | null>(null);

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
      stepOneRef.current?.querySelector<HTMLElement>('button[type="submit"]')?.focus();
    });
  }

  function handleClose() {
    closeTithe();
    setContribution(null);
  }

  function handleReported() {
    handleClose();
    setConfirmed(true);
  }

  return (
    <>
    <Dialog
      open={open}
      onClose={handleClose}
      fullScreen
      aria-labelledby="tithe-modal-title"
      slotProps={{
        paper: {
          // `elevation: 0` es la parte que realmente importa acá: el Dialog
          // de MUI monta su Paper con elevation 24 por defecto, y en modo
          // oscuro `Paper` agrega automáticamente un overlay blanco
          // translúcido proporcional a la elevación (para simular que las
          // superficies "más cerca de la luz" se ven más claras) — eso era
          // el azul "lavado" que reportó el cliente: no era el navy en sí,
          // era ese overlay encima. En modo claro `Paper` no aplica ningún
          // overlay, por eso ahí sí se veía bien. `elevation: 0` desactiva
          // el overlay por completo, dejando el navy sólido sin filtrar.
          elevation: 0,
          sx: {
            position: "relative",
            // Segunda revisión de este fix (feedback de cliente): la versión
            // anterior combinaba `scroll="body"` con `fullScreen` para
            // resolver el recorte de contenido en mobile — pero esa
            // combinación es una conocida rareza de MUI: la clase que
            // `scroll="body"` le agrega al Paper (`display: inline-block`,
            // para centrarlo dentro del body) pisaba el `width: 100%` que
            // `fullScreen` necesita, y el modal quedaba angosto (ajustado al
            // contenido) en vez de ocupar todo el ancho. Se quita
            // `scroll="body"` del todo — con el `scroll="paper"` default de
            // MUI, el propio Paper `fullScreen` (ya 100% ancho/alto por su
            // clase nativa) es el que scrollea internamente
            // (`overflowY: "auto"`) cuando el contenido no entra, sin
            // ninguna clase adicional que le achique el ancho.
            //
            // Tercera revisión: el Paper ya no es el que scrollea. Cuando el
            // paso de pago superaba el alto de la pantalla, el fondo animado
            // (absoluto dentro del Paper) solo cubría la primera "pantalla" y
            // el resto quedaba sin patrón. Ahora el Paper es un marco fijo
            // (`overflow: hidden`) con el fondo, y el scroll vive en una capa
            // interna (ver abajo).
            width: "100%",
            height: "100%",
            overflow: "hidden",
            backgroundColor: "#060A1D",
            borderRadius: 0,
            m: 0,
          },
        },
      }}
    >
      {/* Patrón geométrico en pan continuo — mismo "efecto wow" de D048,
          ahora sin salto al reiniciar el bucle (ver theme/patterns.ts). */}
      <Box aria-hidden="true" sx={patternLayerSx()} />

      <IconButton
        onClick={handleClose}
        aria-label="Cerrar"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 2,
          color: "#F5F6FA",
          backgroundColor: "rgba(245,246,250,0.1)",
          "&:hover": { backgroundColor: "rgba(245,246,250,0.18)" },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>

      {/* Capa que scrollea, por encima del fondo fijo. */}
      <Box sx={{ position: "absolute", inset: 0, zIndex: 1, overflowY: "auto" }}>
      <Box
        sx={{
          position: "relative",
          boxSizing: "border-box",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          // Fase QA (design-qa): en pantallas bajas (teléfono horizontal) el
          // centrado vertical dejaba el submit fuera de vista sin señal de
          // que había más abajo. `safe center` no recorta el inicio del
          // contenido cuando no entra; el `pb` grande garantiza aire bajo el
          // botón "Continuar al pago".
          justifyContent: "safe center",
          p: { xs: 3, md: 6 },
          pb: { xs: 8, md: 6 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "center", md: "flex-start" },
            justifyContent: "center",
            gap: { xs: 6, md: 10 },
            maxWidth: 960,
            mx: "auto",
            width: "100%",
          }}
        >
          <Box sx={{ maxWidth: 480, textAlign: { xs: "center", md: "left" }, pt: { md: 2 } }}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: "12px",
                backgroundColor: "rgba(245,246,250,0.1)",
                color: "secondary.main",
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
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
              }}
            >
              Da con propósito
            </Typography>

            <Typography
              component="h2"
              id="tithe-modal-title"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 800,
                fontSize: { xs: "26px", md: "32px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "#F5F6FA",
                mb: 2,
              }}
            >
              Tu diezmo y tus aportes sostienen esta obra
            </Typography>

            {/* Feedback de cliente: en mobile este párrafo empujaba el
                formulario más abajo sin aportar tanto como el heading — se
                quita por debajo de `md` para que el modal quede más
                compacto; desde `md` (donde hay espacio de sobra al lado del
                formulario) se mantiene. */}
            <Typography
              sx={{
                display: { xs: "none", md: "block" },
                fontFamily: "var(--font-body)",
                fontSize: 16,
                lineHeight: 1.6,
                color: "rgba(245,246,250,0.72)",
              }}
            >
              Cada aporte se destina directamente a nuestras áreas de servicio y proyectos
              activos. Elige un monto, única vez o mensual, y completa tus datos — sin
              compromisos, cancela cuando quieras.
            </Typography>

            <AnimatedFamiliesCounter active={open} />
          </Box>

          <Box sx={{ flexShrink: 0, width: "100%", maxWidth: 440 }}>
            {/* El formulario queda montado (oculto) durante el paso 2 para que
                "Volver" conserve monto, tipo y datos ya ingresados. */}
            <Box ref={stepOneRef} sx={{ display: contribution ? "none" : "block" }}>
              <TitheForm width={440} onSubmit={handleSubmit} />
            </Box>
            {contribution && (
              <PaymentStep
                width={440}
                contribution={contribution}
                summary={`${TYPE_LABEL[contribution.purpose as ContributionType]} · ${FREQUENCY_LABEL[contribution.frequency]}`}
                onBack={handleBack}
                onReported={handleReported}
              />
            )}
          </Box>
        </Box>
      </Box>
      </Box>
    </Dialog>

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
        ¡Gracias! Recibimos tu reporte de pago. Lo verificaremos en las próximas horas.
      </Alert>
    </Snackbar>
    </>
  );
}
