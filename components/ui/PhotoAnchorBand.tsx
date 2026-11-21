"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";

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
  const reduceMotion = useHydratedReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const yTransform = useTransform(scrollYProgress, [0, 1], ["-12%", "12%"]);
  // a11y (WCAG 2.3.3): sin parallax cuando el usuario pide reducir movimiento.
  const y = reduceMotion ? "0%" : yTransform;

  return (
    <section
      ref={ref}
      aria-label={eyebrow}
      className="relative h-70 overflow-hidden md:h-90"
    >
      <motion.div
        aria-hidden
        style={{ y }}
        className="absolute inset-x-0 top-[-12%] bottom-[-12%]"
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div aria-hidden className="absolute inset-0 bg-primary-900/68" />
      <div className="relative flex h-full flex-col items-center justify-center px-3 text-center">
        <span className="mb-1.5 font-body font-medium text-11 text-secondary-light uppercase tracking-[0.18em]">
          {eyebrow}
        </span>
        <p className="mb-1 font-extrabold font-heading text-[44px] text-gray-50 leading-none tracking-[-0.01em] md:text-56">
          {value}
        </p>
        <p className="font-body text-14 text-gray-50/80">{label}</p>
      </div>
    </section>
  );
}
