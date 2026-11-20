import { keyframes } from "@mui/material/styles";

/**
 * Patrón de líneas diagonales en pan continuo (modal de diezmo, banda de KPIs
 * del dashboard, login). El tile y su porqué viven en `theme/patternTile.ts`
 * (D120); aquí quedan los `sx` de MUI hasta que esas zonas migren (ola 3) y
 * pasen a `components/ui/pattern-layer.tsx`.
 */
import { diagonalPattern, PATTERN_TILE } from "./patternTile";

export { diagonalPattern, PATTERN_TILE };

export const patternPan = keyframes`
  from { background-position: 0 0; }
  to { background-position: ${PATTERN_TILE}px ${PATTERN_TILE}px; }
`;

/**
 * `sx` listo para una capa de fondo animada (`position: absolute; inset: 0`).
 * `secondsPerTile`: duración del recorrido de un tile — misma velocidad que
 * antes (160px en 24s ≈ 6.7px/s → 56px en ~8.4s).
 */
export function patternLayerSx(stroke?: string, secondsPerTile = 8.4) {
  return {
    position: "absolute",
    inset: 0,
    pointerEvents: "none",
    backgroundImage: diagonalPattern(stroke),
    backgroundSize: `${PATTERN_TILE}px ${PATTERN_TILE}px`,
    animation: `${patternPan} ${secondsPerTile}s linear infinite`,
    "@media (prefers-reduced-motion: reduce)": { animation: "none" },
  } as const;
}
