"use client";

import VolunteerActivismRoundedIcon from "@mui/icons-material/VolunteerActivismRounded";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { keyframes } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { TitheForm, type TitheFormValues } from "@/components/ui/TitheForm";

/**
 * Sección "CTA Diezmo/Aportes" (fase 06) — componente + datos en un solo archivo (D030).
 *
 * Última sección pendiente de Fase 06 (SECTION_INVENTORY). Es el CTA de más alta
 * prioridad del sitio (D011) — a diferencia de las demás secciones de Home (fondo
 * `background.default`/`paper`), esta usa **fondo navy sólido fijo**, sin importar el
 * modo claro/oscuro activo (mismo criterio que el sidebar del dashboard, D025, y el
 * overlay del menú mobile, D026) para que se sienta como el "cierre" del recorrido de
 * Home, no una sección más.
 *
 * Reutiliza `TitheForm` (`components/ui/TitheForm.tsx`, D018/D019) **sin modificarlo**
 * — trae su propio `DonationFormCard` (fondo `background.paper`, así que sobre el navy
 * de la sección queda como una card clara flotando, con buen contraste). `onSubmit` es
 * un placeholder (`console.log` + no-op) — el formulario no captura tarjeta ni procesa
 * pago (D018), solo recolecta los datos; la integración con un proveedor de pago real
 * queda fuera de alcance de esta fase.
 *
 * `id="diezmo"` — coincide con `TITHE_ANCHOR_ID` (`components/layout/navItems.ts`),
 * el ancla que ya usan el botón "Diezmo" del Navbar, el PageNavbar y el
 * MobileMenuOverlay (a diferencia de Historia/Proyectos, que son páginas propias, D007,
 * este sí es un scroll-target real dentro de Home).
 *
 * Efecto "wow" del fondo (fase 07, D048 — el cliente eligió combinar las opciones B
 * y C del comparativo de `/design`): (1) un patrón geométrico diagonal muy sutil,
 * en pan continuo vía CSS `@keyframes` (`patternPan`), sin foto — mantiene el fondo
 * navy plano pero le suma movimiento de fondo; (2) un contador animado ("+X
 * familias aportando este año") que cuenta hacia arriba una sola vez, la primera
 * vez que la sección entra en el viewport (`useInView` de framer-motion, `once:
 * true` — mismo criterio de "una sola vez" que `Reveal`). El monto es contenido
 * placeholder, mismo criterio que el resto del sitio.
 */

const patternPan = keyframes`
  0% { background-position: 0 0; }
  100% { background-position: 160px 160px; }
`;

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
          fontSize: 13,
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
  function handleSubmit(values: TitheFormValues) {
    // Placeholder: no hay proveedor de pago integrado todavía (fuera de alcance de
    // esta fase). El formulario ya valida y entrega los datos vía onSubmit (D018);
    // acá solo se registran en consola hasta que exista un backend/proveedor real.
    console.log("Tithe form submitted (placeholder):", values);
  }

  return (
    <Box
      component="section"
      id="diezmo"
      sx={{
        position: "relative",
        overflow: "hidden",
        py: { xs: 8, md: 12 },
        backgroundColor: "#101B45",
      }}
    >
      {/* Patrón geométrico en pan continuo — ver nota de "efecto wow" arriba */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(135deg, rgba(245,246,250,0.05) 0px, rgba(245,246,250,0.05) 1px, transparent 1px, transparent 40px)",
          animation: `${patternPan} 24s linear infinite`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 82% 15%, rgba(249,117,13,0.10) 0%, transparent 45%)",
        }}
      />

      <Container maxWidth="lg" sx={{ position: "relative" }}>
        <Reveal>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "center", md: "flex-start" },
              justifyContent: "space-between",
              gap: { xs: 6, md: 8 },
            }}
          >
            <Box
              sx={{
                maxWidth: 480,
                textAlign: { xs: "center", md: "left" },
                pt: { md: 2 },
              }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 44,
                  height: 44,
                  borderRadius: "12px",
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
                  fontSize: 11,
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
                sx={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 800,
                  fontSize: { xs: "28px", md: "38px" },
                  lineHeight: 1.2,
                  letterSpacing: "-0.01em",
                  color: "#F5F6FA",
                  mb: 2,
                }}
              >
                Tu diezmo y tus aportes sostienen esta obra
              </Typography>

              <Typography
                sx={{
                  fontFamily: "var(--font-body)",
                  fontSize: 16,
                  lineHeight: 1.6,
                  color: "rgba(245,246,250,0.72)",
                }}
              >
                Cada aporte se destina directamente a nuestras áreas de servicio
                y proyectos activos. Elige un monto, única vez o mensual, y
                completa tus datos — sin compromisos, cancela cuando quieras.
              </Typography>

              <AnimatedFamiliesCounter />
            </Box>

            <Box sx={{ flexShrink: 0 }}>
              <TitheForm width={440} onSubmit={handleSubmit} />
            </Box>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
