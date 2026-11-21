"use client";

import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { useHydratedReducedMotion } from "@/lib/useHydratedReducedMotion";
import { cn } from "@/lib/utils";
import styles from "./Hero.module.css";

const AUTOPLAY_MS = 6000;

const SLIDES = [
  {
    id: "areas",
    eyebrow: "Nuestras áreas",
    headline: "Un lugar para servir en cada etapa de tu fe.",
    ctaLabel: "Conocer nuestras áreas",
    ctaHref: "#areas",
    imageUrl:
      "https://images.unsplash.com/photo-1573152958734-1922c188fba3?w=1920&h=1080&fit=crop&q=80",
  },
  {
    id: "proyectos",
    eyebrow: "Proyectos activos",
    headline: "Construimos juntos lo que la comunidad necesita.",
    ctaLabel: "Ver proyectos",
    ctaHref: "/proyectos",
    imageUrl:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1920&h=1080&fit=crop&q=80",
  },
  {
    id: "agenda",
    eyebrow: "Agenda y prédicas",
    headline: "Vive cada servicio, en persona o desde donde estés.",
    ctaLabel: "Ver agenda",
    ctaHref: "#agenda",
    imageUrl:
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=1920&h=1080&fit=crop&q=80",
  },
] as const;

// Overlays navy (los mismos `primary-900` del tema, con opacidad por tramo).
const navy = (pct: number) =>
  `color-mix(in srgb, var(--color-primary-900) ${pct}%, transparent)`;
// Degradado horizontal para legibilidad del texto a la izquierda (mismo criterio que PhotoOverlayCard, D012).
const OVERLAY_SIDE = `linear-gradient(100deg, ${navy(95)} 0%, ${navy(82)} 35%, ${navy(50)} 62%, ${navy(22)} 100%)`;
const OVERLAY_BOTTOM = `linear-gradient(to top, ${navy(55)} 0%, ${navy(0)} 45%)`;

/** Flecha del carrusel: botón de texto sobre la foto, tenue fondo al hover. */
const ARROW_CLASS =
  "absolute top-1/2 z-2 hidden -translate-y-1/2 text-gray-50 hover:bg-gray-50/14 md:inline-flex dark:text-gray-50 dark:hover:bg-gray-50/14";

export function Hero() {
  const total = SLIDES.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useHydratedReducedMotion();

  // Parallax (fase 07, Dirección B elegida en /design): la foto se mueve
  // más lento que el scroll a medida que el Hero sale de vista. Se desactiva
  // con "reducir movimiento" (WCAG 2.3.3).
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const parallaxTransform = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", "16%"],
  );
  const parallaxY = reduceMotion ? "0%" : parallaxTransform;

  // Autoplay del slider (WCAG 2.2.2): no corre si el usuario pidió reducir
  // movimiento ni mientras esté pausado con el control de abajo.
  const autoplayActive = !reduceMotion && !paused;

  // El avance lo dispara el fin de la animación de la barra activa (ver
  // `onAnimationEnd` abajo), no un setTimeout: así pausar congela la barra
  // donde está (`animation-play-state: paused`) y reanudar sigue desde ahí,
  // siempre sincronizada con el cambio de slide. Antes, al pausar, la barra
  // se llenaba de golpe al 100%.

  const goTo = (next: number) => setIndex(((next % total) + total) % total);
  const slide = SLIDES[index];

  return (
    <section
      ref={heroRef}
      aria-roledescription="carrusel"
      aria-label="Destacados de la iglesia"
      // Ocupa exactamente el resto del viewport bajo el navbar (feedback
      // directo del cliente): `--navbar-height` la publica el propio
      // `Navbar` (medida real vía `ResizeObserver`, no un valor fijo
      // adivinado) — con fallback a 72px por si el navbar no llegó a
      // montarse todavía (ej. primer paint). Es `min-height`, no `height`,
      // así que en pantallas muy angostas el contenido igual puede
      // empujarlo más alto sin recortarse. Feedback de cliente: en pantallas
      // muy altas/anchas (monitores grandes, ultrawide) el Hero a 100vh se
      // sentía excesivo — se limita a 1024px de alto total (navbar + Hero).
      className="relative flex max-h-[calc(1024px-var(--navbar-height,72px))] min-h-[calc(100vh-var(--navbar-height,72px))] items-end overflow-hidden"
    >
      {/* Foto de fondo — crossfade entre slides + parallax al hacer scroll
          (sobredimensionada ±10% para que el desplazamiento no revele bordes) */}
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{ y: parallaxY }}
          className="absolute inset-x-0 top-[-10%] bottom-[-10%]"
        >
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Overlay navy */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: OVERLAY_SIDE }}
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ background: OVERLAY_BOTTOM }}
      />

      {/* Navegación manual — flechas, estilo "text button": sin fondo/borde en
          reposo, tenue background en hover (mismo criterio que los botones de
          texto del sistema). `z-2`: por encima del Container del contenido
          (también relativo y posterior en el DOM), que tapaba la mitad interna
          del botón y no recibía el clic. */}
      <Button
        variant="plain"
        size="icon"
        onClick={() => goTo(index - 1)}
        aria-label="Slide anterior"
        className={cn(ARROW_CLASS, "left-6")}
      >
        <ChevronLeft aria-hidden className="size-6" />
      </Button>
      <Button
        variant="plain"
        size="icon"
        onClick={() => goTo(index + 1)}
        aria-label="Siguiente slide"
        className={cn(ARROW_CLASS, "right-6")}
      >
        <ChevronRight aria-hidden className="size-6" />
      </Button>

      {/* `md:px-22` (88px) en desktop: canal a cada lado para las flechas (24px
          + 40px de botón + aire). Antes el texto empezaba debajo de la flecha
          izquierda en pantallas < ~1280px y el clic a veces caía en el texto. */}
      <Container
        maxWidth="lg"
        className="relative pt-14 pb-8 md:px-22 md:pt-10 md:pb-10"
      >
        {/* En pantallas grandes el bloque se ensancha para acompañar el
            headline más grande (64px) — antes quedaba encajado en 580px y el
            título se recortaba a 3 líneas apretadas. */}
        <div className="max-w-145 xl:max-w-180 wide:max-w-215">
          {/* Barras de progreso — indican slide activo y navegan (botones reales).
              + control de pausa/reproducción del autoplay (WCAG 2.2.2). */}
          <div className="mb-5 flex max-w-65 items-center gap-1.25">
            {/* biome-ignore lint/a11y/useSemanticElements: grupo de botones sin leyenda visible; `aria-label` lo nombra */}
            <div
              className="flex flex-1 gap-1"
              role="group"
              aria-label="Elegir destacado"
            >
              {SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Ir al destacado ${i + 1} de ${total}: ${s.eyebrow}`}
                  aria-current={i === index ? "true" : undefined}
                  // Área táctil de 44px (design-qa fase 09); la barra visible
                  // sigue siendo la pista de 6px de adentro.
                  className="flex h-11 flex-1 cursor-pointer items-center border-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <span className="flex h-1.5 w-full items-center overflow-hidden rounded-pill bg-gray-50/22">
                    <span
                      className={cn(
                        "block h-[2.5px]",
                        i < index
                          ? "w-full bg-gray-50/55"
                          : "w-0 bg-secondary-400",
                        i === index &&
                          (reduceMotion
                            ? // Reducir movimiento: sin autoplay; la barra activa queda llena.
                              "w-full"
                            : cn(styles.fill, paused && styles.paused)),
                      )}
                      style={
                        i === index && !reduceMotion
                          ? { animationDuration: `${AUTOPLAY_MS}ms` }
                          : undefined
                      }
                      onAnimationEnd={
                        i === index ? () => goTo(index + 1) : undefined
                      }
                    />
                  </span>
                </button>
              ))}
            </div>
            <Button
              variant="plain"
              size="icon"
              onClick={() => setPaused((p) => !p)}
              aria-label={
                autoplayActive
                  ? "Pausar cambio automático de destacados"
                  : "Reanudar cambio automático de destacados"
              }
              disabled={!!reduceMotion}
              className="size-11 text-gray-50 hover:bg-gray-50/14 disabled:text-gray-50/40 dark:text-gray-50 dark:hover:bg-gray-50/14 dark:disabled:text-gray-50/40"
            >
              {autoplayActive ? (
                <Pause aria-hidden className="size-4 fill-current" />
              ) : (
                <Play aria-hidden className="size-4 fill-current" />
              )}
            </Button>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${total}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <span className="mb-1.5 block font-body font-medium text-11 text-secondary-300 uppercase tracking-[0.18em] wide:text-13">
                {slide.eyebrow}
              </span>

              {/* En pantallas ≥1920px el texto se sentía chico — sube un peldaño
                  más allá de lo que cubre el breakpoint. El bloque que lo
                  contiene también se ensancha (ver arriba). `min-h`: altura
                  reservada para el headline más largo — evita que el CTA/stats
                  salten de posición al cambiar de slide. */}
              <h1 className="mb-4 min-h-[3.45em] font-extrabold font-heading text-[34px] text-gray-50 leading-[1.15] tracking-[-0.02em] md:text-[52px] xl:min-h-[2.7em] xl:text-[58px] wide:text-64">
                {slide.headline}
              </h1>

              <Button
                asChild
                variant="outlined"
                size="large"
                className="rounded-sm border-gray-50/40 px-3 text-gray-50 hover:border-secondary-500 hover:bg-secondary-500/8 hover:text-secondary-300 dark:hover:bg-secondary-500/8"
              >
                <Link href={slide.ctaHref}>{slide.ctaLabel}</Link>
              </Button>
            </motion.div>
          </AnimatePresence>

          {/* Stats — línea única minimalista, no cambia entre slides */}
          <div className="mt-5 border-gray-50/15 border-t pt-2 md:mt-6">
            <p className="font-body text-12 text-gray-300 tracking-[0.02em] wide:text-14">
              +400 personas · 5 áreas de servicio · 11 años sirviendo
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
