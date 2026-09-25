import { keyframes } from "@mui/material/styles";

/**
 * Patrón de líneas diagonales en pan continuo (modal de diezmo, banda de KPIs
 * del dashboard, login).
 *
 * Antes era un `repeating-linear-gradient(135deg, …40px)` animado 160px: el
 * gradiente se repite cada 40·√2 ≈ 56.57px en X/Y, y 160 no es múltiplo de
 * eso, así que al reiniciar la animación el patrón saltaba (se veía el
 * "corte"). Ahora es un tile SVG de exactamente `PATTERN_TILE` px con la
 * diagonal de esquina a esquina (misma separación visual, ~40px entre
 * líneas) y la animación mueve exactamente un tile: el final coincide con el
 * inicio y el bucle no se nota.
 */
export const PATTERN_TILE = 56;

export function diagonalPattern(stroke = "rgba(245,246,250,0.05)"): string {
  const s = PATTERN_TILE;
  const q = s / 4;
  // Diagonal principal + los extremos de las vecinas que asoman por las
  // esquinas, para que el antialias no deje puntos cortados en las uniones.
  const d = `M0 ${s}L${s} 0M-${q} ${q}L${q} -${q}M${s - q} ${s + q}L${s + q} ${s - q}`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${s}' height='${s}'><path d='${d}' stroke='${stroke}' stroke-width='1'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

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
