import { describe, expect, test } from "bun:test";
import { getGlobalStyles } from "@/theme/globalStyles";
import { scrollbar, selection } from "@/theme/tokens";

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

describe("getGlobalStyles", () => {
  test("usa el par de selección y el set de scroll del modo", () => {
    const light = JSON.stringify(getGlobalStyles("light"));
    const dark = JSON.stringify(getGlobalStyles("dark"));
    expect(light).toContain(selection.light.bg);
    expect(light).toContain(scrollbar.light.thumb);
    expect(dark).toContain(selection.dark.bg);
    expect(dark).toContain(scrollbar.dark.thumb);
    // Las piezas navy fijas llevan su set en los dos modos.
    expect(light).toContain(scrollbar.navy.thumb);
    expect(dark).toContain(scrollbar.navy.thumb);
  });

  test("reserva el riel para que el layout no salte", () => {
    expect(JSON.stringify(getGlobalStyles("light"))).toContain(
      '"scrollbarGutter":"stable"',
    );
  });
});
