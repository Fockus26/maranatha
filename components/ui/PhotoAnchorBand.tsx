"use client";

import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { primary } from "@/theme/tokens";

export interface PhotoAnchorBandProps {
  eyebrow: string;
  value: string;
  label: string;
  imageUrl: string;
}

/**
 * "Ancla fotográfica" con parallax (fase 07, Dirección B elegida en /design)
 * — franja fotográfica a pantalla completa entre secciones de Home, con la
 * foto moviéndose más lento que el scroll (mismo lenguaje del Hero, D028,
 * llevado a más momentos de la página) y un stat/frase grande superpuesta.
 *
 * Se usa en `app/page.tsx` entre Áreas de Servicio → Liderazgo y entre
 * Agenda → Historia (los dos tramos de la página donde más se repetía el
 * mismo tratamiento bordered/plano, según el feedback del cliente).
 *
 * Contenido placeholder: la foto y el stat de cada instancia son
 * marcadores — mismo criterio que el resto del sitio.
 */
export function PhotoAnchorBand({
  eyebrow,
  value,
  label,
  imageUrl,
}: PhotoAnchorBandProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yTransform = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  // a11y (WCAG 2.3.3): sin parallax cuando el usuario pide reducir movimiento.
  const y = reduceMotion ? "0%" : yTransform;

  return (
    <Box
      ref={ref}
      component="section"
      aria-label={eyebrow}
      sx={{
        position: "relative",
        height: { xs: 280, md: 360 },
        overflow: "hidden",
      }}
    >
      <motion.div
        aria-hidden
        style={{
          position: "absolute",
          top: "-12%",
          bottom: "-12%",
          left: 0,
          right: 0,
          y,
        }}
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </motion.div>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundColor: alpha(primary[900], 0.68),
        }}
      />
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          px: 3,
        }}
      >
        <Typography
          component="span"
          sx={{
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "secondary.light",
            mb: 1.5,
          }}
        >
          {eyebrow}
        </Typography>
        <Typography
          component="p"
          sx={{
            fontFamily: "var(--font-heading)",
            fontWeight: 800,
            fontSize: { xs: "44px", md: "56px" },
            lineHeight: 1,
            letterSpacing: "-0.01em",
            color: "#F5F6FA",
            mb: 1,
          }}
        >
          {value}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-body)",
            fontSize: 14,
            color: "rgba(245,246,250,0.8)",
          }}
        >
          {label}
        </Typography>
      </Box>
    </Box>
  );
}
