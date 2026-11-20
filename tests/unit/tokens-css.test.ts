import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { cn } from "@/lib/utils";
import {
  buildTokensCss,
  navyVars,
  roleVars,
  TOKENS_CSS_PATH,
} from "@/scripts/tokens-css";
import { breakpoints, layout, primary, spacing } from "@/theme/tokens";

const css = readFileSync(TOKENS_CSS_PATH, "utf8").replace(/\r\n/g, "\n");

/** Claves de un namespace del `@theme` generado (`--text-h1` → `h1`). */
function themeKeys(ns: string) {
  const re = new RegExp(`^\\s*--${ns}-([\\w-]+):`, "gm");
  return [...css.matchAll(re)]
    .map((m) => m[1])
    .filter((k) => !k.includes("--"))
    .map((k) => k.replace(/_/g, "."));
}

describe("app/tokens.css", () => {
  test("coincide con theme/tokens.ts (si falla: bun scripts/tokens-css.ts)", () => {
    expect(css).toBe(buildTokensCss());
  });

  test("breakpoints de MUI, sin los de Tailwind", () => {
    expect(css).toContain("--breakpoint-*: initial;");
    expect(css).toContain(`--breakpoint-md: ${breakpoints.md}px;`);
    expect(css).not.toContain("--breakpoint-2xl");
  });

  test("escalas y anchos salen de los tokens", () => {
    expect(css).toContain(`--color-primary-700: ${primary[700]};`);
    expect(css).toContain(`--spacing-lg: ${spacing.lg}px;`);
    expect(css).toContain("--spacing: 4px;");
    expect(css).toContain(`--container-narrow: ${layout.contentNarrow}px;`);
  });

  test("las familias no se redefinen en :root (las pone next/font)", () => {
    const [before, after] = css.split("@theme inline reference {");
    expect(after).toContain("--font-heading:");
    expect(before).not.toContain("--font-heading:");
    expect(before).not.toContain("--font-body:");
  });

  test("roles por modo y piezas navy", () => {
    expect(css).toContain('[data-color-mode="dark"] {');
    expect(css).toContain('[data-surface="navy"] {');
    expect(css).toContain("--color-background: var(--background);");
    expect(css).toContain("--color-ring: var(--focus-ring);");
  });
});

// Contraste WCAG 2.1 (texto sobre fondo, alfa compuesto sobre el fondo).
function rgb(c: string, base: number[] = [255, 255, 255]) {
  if (c.startsWith("#")) {
    return [1, 3, 5].map((i) => Number.parseInt(c.slice(i, i + 2), 16));
  }
  const [r, g, b, a = 1] = (c.match(/\(([^)]+)\)/)?.[1] ?? "")
    .split(",")
    .map(Number);
  return [r, g, b].map((x, i) => x * a + base[i] * (1 - a));
}
function lum(c: number[]) {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(fg: string, bg: string) {
  const b = rgb(bg);
  const [hi, lo] = [lum(rgb(fg, b)), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("contraste de los roles", () => {
  // Pares de texto que llegan a AA en los dos modos. Los que no (heredados
  // de la paleta MUI, D109): `primary` en oscuro, `secondary-foreground`
  // sobre `secondary` en oscuro, `success`/`info` con su `-foreground`; el
  // botón usa sus colores fijos de `theme.ts`.
  const aa: [string, string][] = [
    ["--foreground", "--background"],
    ["--foreground", "--card"],
    ["--muted-foreground", "--background"],
    ["--muted-foreground", "--card"],
    ["--secondary", "--card"],
    ["--destructive", "--card"],
    ["--destructive", "--background"],
    ["--destructive-foreground", "--destructive"],
    ["--warning-foreground", "--warning"],
  ];
  test.each(["light", "dark"] as const)("%s: texto ≥ 4.5:1", (mode) => {
    const v = Object.fromEntries(roleVars(mode));
    for (const [f, b] of aa) {
      expect(ratio(v[f], v[b])).toBeGreaterThanOrEqual(4.5);
    }
  });

  test("navy: texto y texto atenuado ≥ 4.5:1", () => {
    const v = Object.fromEntries(navyVars());
    expect(ratio(v["--foreground"], v["--background"])).toBeGreaterThan(4.5);
    expect(ratio(v["--muted-foreground"], v["--background"])).toBeGreaterThan(
      4.5,
    );
  });
});

describe("cn conoce los tokens propios (D110)", () => {
  test.each(themeKeys("text"))("text-%s sobrevive a un color", (t) => {
    expect(cn(`text-${t}`, "text-foreground")).toBe(
      `text-${t} text-foreground`,
    );
    expect(cn("text-h4", `text-${t}`)).toBe(`text-${t}`);
  });

  test.each(themeKeys("shadow"))("shadow-%s se fusiona como sombra", (s) => {
    expect(cn("shadow-sm", `shadow-${s}`)).toBe(`shadow-${s}`);
    expect(cn(`shadow-${s}`, "shadow-black")).toBe(`shadow-${s} shadow-black`);
  });

  test.each(themeKeys("radius"))("rounded-%s se fusiona como radio", (r) => {
    expect(cn("rounded-xs", `rounded-${r}`)).toBe(`rounded-${r}`);
  });

  test.each(themeKeys("spacing"))("p-%s se fusiona como espaciado", (s) => {
    expect(cn("p-2", `p-${s}`)).toBe(`p-${s}`);
  });

  test.each(themeKeys("z-index"))("z-%s se fusiona como z-index", (z) => {
    expect(cn("z-10", `z-${z}`)).toBe(`z-${z}`);
  });

  test("max-w con los anchos propios", () => {
    expect(cn("max-w-form-drawer", "max-w-narrow")).toBe("max-w-narrow");
  });
});
