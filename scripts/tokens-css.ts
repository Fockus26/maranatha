/**
 * Genera `app/tokens.css` desde `theme/tokens.ts` y `theme/roles.ts` (D109).
 *
 *   bun scripts/tokens-css.ts
 *
 * Salida: el `@theme` de Tailwind con las escalas (colores, tipo, espaciado,
 * radios, sombras, breakpoints, anchos, z-index), los roles por modo como
 * variables CSS (`:root` claro, `[data-color-mode="dark"]`, piezas navy fijas
 * `[data-surface="navy"]`) y su exposición en `@theme inline`, más el anillo
 * de foco, el scroll y la selección por modo que lee `app/globals.css` (D141).
 * `tests/unit/tokens-css.test.ts` falla si el archivo no coincide con esto.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  accentRoles,
  type ColorMode,
  modeRoles,
  navyRoles,
} from "../theme/roles";
import { CONTAINERS, cssKey, TEXT_SCALE } from "../theme/tailwindNames";
import {
  breakpoints,
  common,
  fontScale,
  gray,
  largeScreen,
  onNavy,
  primary,
  radius,
  scrollbar,
  secondary,
  selection,
  semantic,
  shadow,
  spacing,
  typography,
  zIndex,
} from "../theme/tokens";

const px = (n: number) => `${n}px`;
const kebab = cssKey;

function block(selector: string, vars: [string, string | number][]) {
  return `${selector} {\n${vars.map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;
}

// Pesos: los nombres de Tailwind, con los valores de `typography.weight`.
// (`font-body` ya es la familia; un peso con ese nombre chocaría.)
export const FONT_WEIGHTS = {
  normal: typography.weight.body,
  medium: typography.weight.bodyMedium,
  semibold: typography.weight.h3,
  bold: typography.weight.h2,
  extrabold: typography.weight.h1,
} as const;

const ROLE_SEMANTIC = new Set(["success", "warning", "info"]);

function themeBlock() {
  const v: [string, string | number][] = [];

  // Breakpoints de MUI (no los de Tailwind): `md:` = 900px como hoy.
  v.push(["--breakpoint-*", "initial"]);
  for (const [k, n] of Object.entries(breakpoints)) {
    if (n > 0) v.push([`--breakpoint-${k}`, px(n)]);
  }
  // Pantalla grande (≥1920px): `wide:`; no existe en MUI (D119).
  v.push(["--breakpoint-wide", px(largeScreen)]);

  // Colores: solo los del proyecto (sin la paleta por defecto de Tailwind).
  v.push(["--color-*", "initial"]);
  v.push(["--color-white", common.white], ["--color-black", common.black]);
  for (const [name, scale] of [
    ["primary", primary],
    ["secondary", secondary],
    ["gray", gray],
  ] as const) {
    for (const [step, hex] of Object.entries(scale)) {
      v.push([`--color-${name}-${step}`, hex]);
    }
  }
  // `success`, `warning` e `info` salen como roles (con su `-foreground`).
  for (const [k, hex] of Object.entries(semantic)) {
    if (!ROLE_SEMANTIC.has(k)) v.push([`--color-${kebab(k)}`, hex]);
  }
  for (const [k, c] of Object.entries(onNavy)) {
    v.push([k === "text" ? "--color-on-navy" : `--color-on-navy-${k}`, c]);
  }

  // Tipografía. h1–h4 son responsivos: móvil por debajo de `sm` (como
  // `breakpoints.down("sm")` del tema MUI) y escritorio desde `sm`.
  v.push(["--text-*", "initial"]);
  for (const [name, key] of Object.entries(TEXT_SCALE)) {
    const size = typography.size[key];
    v.push([`--text-${name}`, typeof size === "string" ? size : size.mobile]);
    const lh =
      key === "bodyLarge"
        ? typography.lineHeight.body
        : typography.lineHeight[key as keyof typeof typography.lineHeight];
    v.push([`--text-${name}--line-height`, lh]);
  }
  for (const [k, size] of Object.entries(fontScale)) {
    v.push([`--text-${kebab(k)}`, size]);
  }
  v.push(["--leading-*", "initial"]);
  for (const [k, lh] of Object.entries(typography.lineHeight)) {
    v.push([`--leading-${k}`, lh]);
  }
  // Espaciado entre letras (D137): sin `tracking-tight/wide/…` de Tailwind
  // (valores distintos: -0.025em, 0.025em…).
  v.push(["--tracking-*", "initial"]);
  for (const [k, ls] of Object.entries(typography.letterSpacing)) {
    v.push([`--tracking-${k}`, ls]);
  }
  v.push(["--font-weight-*", "initial"]);
  for (const [k, w] of Object.entries(FONT_WEIGHTS)) {
    v.push([`--font-weight-${k}`, w]);
  }
  // `font-sans` es la familia de la preflight (`html`): la del cuerpo.
  v.push(["--font-sans", typography.fontFamily.body]);

  // Espaciado: la escala numérica de Tailwind queda en 4px (= `spacing()`
  // del tema MUI: `p: 2` → `p-2`) y se suman los nombres de `tokens.ts`.
  v.push(["--spacing", "4px"]);
  for (const [k, n] of Object.entries(spacing)) {
    v.push([`--spacing-${k}`, px(n)]);
  }

  // Anchos máximos (`max-w-*`). Sin los de Tailwind: `max-w-md` sería
  // `--spacing-md`, ver D109.
  v.push(["--container-*", "initial"]);
  for (const [k, n] of Object.entries(CONTAINERS)) {
    v.push([`--container-${k}`, typeof n === "string" ? n : px(n)]);
  }

  v.push(["--radius-*", "initial"]);
  for (const [k, n] of Object.entries(radius)) {
    v.push([`--radius-${k}`, px(n)]);
  }

  v.push(["--shadow-*", "initial"]);
  for (const [k, s] of Object.entries(shadow)) {
    v.push([`--shadow-${kebab(k)}`, s]);
  }

  for (const [k, z] of Object.entries(zIndex)) {
    v.push([`--z-index-${kebab(k)}`, z]);
  }

  return block("@theme", v);
}

/** Familias: las variables las pone `next/font` en `<html>`; `reference`
 *  evita redefinirlas en `:root` (pisarían las de `next/font`). */
function fontBlock() {
  return block("@theme inline reference", [
    ["--font-heading", typography.fontFamily.heading],
    ["--font-body", typography.fontFamily.body],
  ]);
}

/** h1–h4 de escritorio desde `sm`, y el peldaño extra desde `largeScreen`. */
function responsiveText() {
  const desktop: [string, string][] = (["h1", "h2", "h3", "h4"] as const).map(
    (k) => [`--text-${k}`, typography.size[k].desktop],
  );
  const large: [string, string][] = Object.entries(typography.sizeLarge).map(
    ([k, size]) => [`--text-${kebab(k === "bodyLarge" ? "body-lg" : k)}`, size],
  );
  const media = (min: number, vars: [string, string][]) =>
    `@media (width >= ${px(min)}) {\n  ${block(":root", vars).replace(/\n/g, "\n  ")}\n}`;
  return `${media(breakpoints.sm, desktop)}\n\n${media(largeScreen, large)}`;
}

/** Roles por modo: nombres de shadcn + los del proyecto. */
export function roleVars(mode: ColorMode): [string, string][] {
  const r = modeRoles(mode);
  const a = accentRoles(mode);
  return [
    ["--background", r.background.default],
    ["--foreground", r.text.primary],
    ["--card", r.background.paper],
    ["--card-foreground", r.text.primary],
    ["--popover", r.background.paper],
    ["--popover-foreground", r.text.primary],
    ["--primary", r.primary.main],
    ["--primary-foreground", r.primary.contrastText],
    ["--primary-light", r.primary.light],
    ["--primary-dark", r.primary.dark],
    ["--secondary", r.secondary.main],
    ["--secondary-foreground", r.secondary.contrastText],
    ["--secondary-light", r.secondary.light],
    ["--secondary-dark", r.secondary.dark],
    ["--muted", r.muted],
    ["--muted-foreground", r.text.secondary],
    // Hover/resaltado de opciones de menú y celdas (D116).
    ["--accent", a.accent],
    ["--accent-foreground", a.foreground],
    ["--destructive", r.error.main],
    ["--destructive-foreground", r.error.contrastText],
    ["--success", r.success.main],
    ["--success-foreground", r.success.contrastText],
    ["--warning", r.warning.main],
    ["--warning-foreground", r.warning.contrastText],
    ["--info", r.info.main],
    ["--info-foreground", r.info.contrastText],
    ["--border", r.divider],
    ["--input", r.divider],
  ];
}

export function navyVars(): [string, string][] {
  return [
    ["--background", navyRoles.background],
    ["--foreground", navyRoles.text],
    ["--card", navyRoles.paper],
    ["--card-foreground", navyRoles.text],
    ["--popover", navyRoles.paper],
    ["--popover-foreground", navyRoles.text],
    ["--muted", navyRoles.muted],
    ["--muted-foreground", navyRoles.textSecondary],
    ["--accent", navyRoles.accent],
    ["--accent-foreground", navyRoles.text],
    ["--border", navyRoles.divider],
    ["--input", navyRoles.divider],
  ];
}

/**
 * Foco (D085), scroll y selección (D077) por modo y en las piezas navy fijas
 * (D025): variables que pintan las reglas de `app/globals.css` (D141).
 * Naranja de marca `secondary[500]` da 2.8:1 sobre blanco (< 3:1 de WCAG
 * 1.4.11): el anillo en claro es `secondary[600]` (3.7:1); en oscuro y sobre
 * navy, `secondary[500]` (5.8:1 sobre el paper oscuro, 7.1:1 sobre navy).
 * Navy usa la selección del modo oscuro en los dos modos.
 */
export function chromeVars(surface: ColorMode | "navy"): [string, string][] {
  const sb = scrollbar[surface];
  const sel = surface === "light" ? selection.light : selection.dark;
  return [
    ["--focus-ring", surface === "light" ? secondary[600] : secondary[500]],
    ["--sb-track", sb.track],
    ["--sb-thumb", sb.thumb],
    ["--sb-hover", sb.hover],
    ["--sb-active", sb.active],
    ["--selection-bg", sel.bg],
    ["--selection-text", sel.text],
  ];
}

/** Geometría del scroll (`scrollbar.size/inset/minThumb`), igual en todo modo. */
function scrollbarGeometry(): [string, string][] {
  const { size, inset, minThumb } = scrollbar;
  return [
    ["--sb-size-page", px(size.page)],
    ["--sb-size-inner", px(size.inner)],
    ["--sb-inset-page", px(inset.page)],
    ["--sb-inset-page-hover", px(inset.pageHover)],
    ["--sb-inset-inner", px(inset.inner)],
    ["--sb-inset-inner-hover", px(inset.innerHover)],
    ["--sb-min-thumb", px(minThumb)],
  ];
}

function rolesTheme() {
  const names = roleVars("light").map(([k]) => k);
  return block("@theme inline", [
    ...names.map((k): [string, string] => [
      `--color-${k.slice(2)}`,
      `var(${k})`,
    ]),
    // Anillo de foco de D085: `--focus-ring` sale de `chromeVars` (por modo).
    ["--color-ring", "var(--focus-ring)"],
  ]);
}

export function buildTokensCss() {
  return `${[
    "/*\n * GENERADO por `bun scripts/tokens-css.ts` desde theme/tokens.ts y\n * theme/roles.ts (D109). No se edita a mano: tests/unit/tokens-css.test.ts\n * falla si no coincide.\n */",
    themeBlock(),
    fontBlock(),
    responsiveText(),
    block(":root", [
      ...roleVars("light"),
      ...chromeVars("light"),
      ...scrollbarGeometry(),
    ]),
    block('[data-color-mode="dark"]', [
      ...roleVars("dark"),
      ...chromeVars("dark"),
    ]),
    block('[data-surface="navy"]', [...navyVars(), ...chromeVars("navy")]),
    rolesTheme(),
  ].join("\n\n")}\n`;
}

export const TOKENS_CSS_PATH = join(import.meta.dir, "..", "app", "tokens.css");

if (import.meta.main) {
  writeFileSync(TOKENS_CSS_PATH, buildTokensCss());
  console.log(`tokens → ${TOKENS_CSS_PATH}`);
}
