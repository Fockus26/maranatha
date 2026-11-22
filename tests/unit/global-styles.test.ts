import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { buildTokensCss, chromeVars } from "@/scripts/tokens-css";
import { scrollbar, secondary, selection } from "@/theme/tokens";

const GLOBALS_CSS = readFileSync(
  join(import.meta.dir, "..", "..", "app", "globals.css"),
  "utf8",
).replace(/\r\n/g, "\n");

/** Cuerpo del primer bloque `selector { … }` del CSS generado. */
function blockOf(css: string, selector: string) {
  const start = css.indexOf(`\n${selector} {\n`);
  if (start < 0) throw new Error(`sin bloque ${selector}`);
  return css.slice(start, css.indexOf("\n}", start + 1));
}

// Contraste WCAG 2.1 entre dos hex `#RRGGBB`.
function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("selección de texto", () => {
  test.each([
    "light",
    "dark",
  ] as const)("%s: texto ≥ 4.5:1 sobre el relleno", (m) => {
    expect(ratio(selection[m].text, selection[m].bg)).toBeGreaterThanOrEqual(
      4.5,
    );
  });
});

describe("barra de scroll", () => {
  test.each([
    "light",
    "dark",
    "navy",
  ] as const)("%s: thumb ≥ 3:1 sobre el track en todo estado", (m) => {
    const set = scrollbar[m];
    for (const state of [set.thumb, set.hover, set.active]) {
      expect(ratio(state, set.track)).toBeGreaterThanOrEqual(3);
    }
  });
});

// Scroll, selección y anillo de foco viven en CSS propio desde D141:
// variables por modo en `app/tokens.css` (generadas) y reglas en
// `app/globals.css`.
describe("variables de scroll, selección y foco (app/tokens.css)", () => {
  const css = buildTokensCss();
  const light = blockOf(css, ":root");
  const dark = blockOf(css, '[data-color-mode="dark"]');
  const navy = blockOf(css, '[data-surface="navy"]');

  test("usa el par de selección y el set de scroll del modo", () => {
    expect(light).toContain(`--selection-bg: ${selection.light.bg};`);
    expect(light).toContain(`--sb-thumb: ${scrollbar.light.thumb};`);
    expect(dark).toContain(`--selection-bg: ${selection.dark.bg};`);
    expect(dark).toContain(`--sb-thumb: ${scrollbar.dark.thumb};`);
    // Las piezas navy fijas llevan su set (y la selección oscura) en los dos modos.
    expect(navy).toContain(`--sb-thumb: ${scrollbar.navy.thumb};`);
    expect(navy).toContain(`--selection-bg: ${selection.dark.bg};`);
  });

  test("anillo de foco AA por superficie (D085)", () => {
    expect(light).toContain(`--focus-ring: ${secondary[600]};`);
    expect(dark).toContain(`--focus-ring: ${secondary[500]};`);
    expect(navy).toContain(`--focus-ring: ${secondary[500]};`);
  });

  test("cada superficie define todas las variables que leen las reglas", () => {
    const names = chromeVars("light").map(([k]) => k);
    for (const block of [light, dark, navy]) {
      for (const name of names) expect(block).toContain(`${name}:`);
    }
    for (const name of names) expect(GLOBALS_CSS).toContain(`var(${name})`);
  });
});

describe("reglas de app/globals.css", () => {
  test("reserva el riel para que el layout no salte", () => {
    expect(GLOBALS_CSS).toContain("scrollbar-gutter: stable;");
  });

  test("scroll y selección no se pintan en forced-colors", () => {
    const media = GLOBALS_CSS.indexOf(
      "@media not all and (forced-colors: active)",
    );
    expect(media).toBeGreaterThan(-1);
    expect(GLOBALS_CSS.indexOf("::selection {")).toBeGreaterThan(media);
    expect(GLOBALS_CSS.indexOf("::-webkit-scrollbar-thumb {")).toBeGreaterThan(
      media,
    );
  });

  test("ningún selector de MUI", () => {
    expect(GLOBALS_CSS).not.toMatch(/\.Mui[A-Z]/);
  });
});

// QA de versión 09: `motion-reduce:animate-none` pierde contra
// `data-open:animate-in`; la regla de reduced-motion de las primitivas va
// en CSS global, fuera de `@layer`.
describe("reduced-motion en las primitivas", () => {
  test("Sheet, Dialog, Select, Popover y Tooltip sin animación", () => {
    const start = GLOBALS_CSS.indexOf('[data-slot="sheet-content"]');
    expect(start).toBeGreaterThan(0);
    // El bloque `@media` más cercano por encima es el de reduced-motion.
    const before = GLOBALS_CSS.slice(0, start);
    expect(before.slice(before.lastIndexOf("@media"))).toStartWith(
      "@media (prefers-reduced-motion: reduce)",
    );
    const block = GLOBALS_CSS.slice(start, GLOBALS_CSS.indexOf("}", start));
    for (const slot of ["sheet", "dialog", "select", "popover", "tooltip"])
      expect(block).toContain(`[data-slot="${slot}-content"]`);
    expect(block).toContain("animation: none;");
  });
});
