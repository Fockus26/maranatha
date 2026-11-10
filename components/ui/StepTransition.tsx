"use client";

import Box from "@mui/material/Box";
import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode, type Ref, useEffect, useRef, useState } from "react";

/**
 * Transición entre los dos pasos de un flujo de pago (D087): el paso 1
 * (formulario) queda siempre montado para que "Volver" conserve lo escrito;
 * el paso 2 entra desde la derecha con fade y, al volver, sale hacia la
 * derecha mientras el formulario regresa desde la izquierda.
 *
 * - El paso inactivo sale del flujo (absoluto), se marca `inert` y
 *   `aria-hidden`: no recibe foco con Tab ni lo lee el lector de pantalla.
 * - El alto del contenedor se anima entre el de un paso y el del otro para
 *   que el modal no salte.
 * - Con `prefers-reduced-motion`: sin desplazamiento ni alto animado, cambio
 *   inmediato.
 */

const EASE = [0.2, 0.8, 0.2, 1] as const;
const DURATION = 0.28;
const SHIFT = 40;
const INNER_STYLE = { display: "flex", justifyContent: "center" } as const;

export function StepTransition({
  showSecond,
  first,
  second,
  firstRef,
}: {
  /** `true` cuando el paso 2 debe verse. */
  showSecond: boolean;
  first: ReactNode;
  /** Contenido del paso 2; `null` mientras no exista. */
  second: ReactNode | null;
  firstRef?: Ref<HTMLDivElement>;
}) {
  const reduce = useReducedMotion();
  const duration = reduce ? 0 : DURATION;
  const shift = reduce ? 0 : SHIFT;

  // El paso 2 se retiene mientras sale, para animar la salida.
  const [retained, setRetained] = useState<ReactNode | null>(null);
  const content = second ?? retained;
  useEffect(() => {
    if (second) setRetained(second);
  }, [second]);

  const firstInner = useRef<HTMLDivElement>(null);
  const secondInner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: `content` hace aparecer el nodo del paso 2 que se observa
  useEffect(() => {
    const el = showSecond ? secondInner.current : firstInner.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setHeight(el.offsetHeight));
    observer.observe(el);
    setHeight(el.offsetHeight);
    return () => observer.disconnect();
  }, [showSecond, content]);

  const inactiveSx = {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    pointerEvents: "none",
  } as const;

  return (
    <Box
      component={motion.div}
      initial={false}
      animate={{ height: height ?? "auto" }}
      transition={{ duration, ease: EASE }}
      // `clip` solo en X: el desplazamiento no genera scroll horizontal y los
      // anillos de foco verticales no se recortan.
      sx={{ position: "relative", overflowX: "clip", width: "100%" }}
    >
      <Box
        component={motion.div}
        ref={firstRef}
        initial={false}
        animate={{ x: showSecond ? -shift : 0, opacity: showSecond ? 0 : 1 }}
        transition={{ duration, ease: EASE }}
        inert={showSecond}
        aria-hidden={showSecond || undefined}
        sx={showSecond ? inactiveSx : undefined}
      >
        <div ref={firstInner} style={INNER_STYLE}>
          {first}
        </div>
      </Box>
      {content && (
        <Box
          component={motion.div}
          initial={{ x: shift, opacity: 0 }}
          animate={{ x: showSecond ? 0 : shift, opacity: showSecond ? 1 : 0 }}
          transition={{ duration, ease: EASE }}
          onAnimationComplete={() => {
            if (!showSecond) setRetained(null);
          }}
          inert={!showSecond}
          aria-hidden={!showSecond || undefined}
          sx={showSecond ? undefined : inactiveSx}
        >
          <div ref={secondInner} style={INNER_STYLE}>
            {content}
          </div>
        </Box>
      )}
    </Box>
  );
}
