import type * as React from "react";
import { cn } from "@/lib/utils";
import { diagonalPattern, PATTERN_TILE } from "@/theme/patternTile";

/**
 * Capa de patrón de líneas diagonales en pan continuo (D120): el
 * `patternLayerSx` de `theme/patterns.ts` sin MUI. Va como primer hijo de un
 * contenedor `relative` (modal de diezmo, banda de KPIs, login); cubre todo
 * (`absolute inset-0`), no recibe clics y no se anuncia. El tile es un SVG
 * de `PATTERN_TILE` px y el pan mueve exactamente uno: el bucle no salta.
 * Con `prefers-reduced-motion` queda quieta.
 *
 *   <div className="relative overflow-hidden bg-primary-900">
 *     <PatternLayer />
 *     …contenido con `relative`…
 *   </div>
 *
 * `stroke`: color de la línea (por defecto blanco al 5 %, para fondos navy);
 * `secondsPerTile`: duración del recorrido de un tile (8,4 s = la velocidad de
 * siempre, ~6,7 px/s).
 */
export function PatternLayer({
  stroke,
  secondsPerTile = 8.4,
  className,
  style,
  ...props
}: Omit<React.ComponentProps<"div">, "children"> & {
  stroke?: string;
  secondsPerTile?: number;
}) {
  return (
    <div
      aria-hidden="true"
      data-slot="pattern-layer"
      className={cn(
        "pointer-events-none absolute inset-0 animate-pattern-pan motion-reduce:animate-none",
        className,
      )}
      style={
        {
          backgroundImage: diagonalPattern(stroke),
          backgroundSize: `${PATTERN_TILE}px ${PATTERN_TILE}px`,
          "--pattern-tile": `${PATTERN_TILE}px`,
          "--pattern-duration": `${secondsPerTile}s`,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    />
  );
}
