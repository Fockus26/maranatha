import {
  fontScale,
  formDrawer,
  layout,
  radius,
  shadow,
  spacing,
  typography,
  zIndex,
} from "./tokens";

/**
 * Nombres de las utilidades de Tailwind que salen de `theme/tokens.ts`
 * (D109).Los usan el generador (`scripts/tokens-css.ts`) y el `cn` del
 * proyecto (`lib/utils.ts`), así los dos nombran igual cada token.
 */

/** `bodyLarge` → `body-large`, `10.5` → `10_5` (Tailwind lee `text-10.5` como `--text-10_5`). */
export function cssKey(k: string) {
  return k
    .replace(/\./g, "_")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

/** Escala tipográfica: utilidad `text-<nombre>` → clave de `typography.size`. */
export const TEXT_SCALE = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "bodyLarge",
  body: "body",
  small: "small",
} as const satisfies Record<string, keyof typeof typography.size>;

/** Anchos máximos (`max-w-*`): `layout.contentNarrow` → `narrow`. */
export const CONTAINERS = {
  narrow: layout.contentNarrow,
  "form-drawer": formDrawer.width,
} as const;

// Lo que va en la clase (`text-10.5`), no en la variable (`--text-10_5`).
export const twNames = {
  text: [...Object.keys(TEXT_SCALE), ...Object.keys(fontScale)],
  leading: Object.keys(typography.lineHeight),
  font: ["heading", "body"],
  spacing: Object.keys(spacing),
  container: Object.keys(CONTAINERS),
  radius: Object.keys(radius),
  shadow: Object.keys(shadow).map(cssKey),
  z: Object.keys(zIndex).map(cssKey),
};
