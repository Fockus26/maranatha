import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import manifest from "@/app/manifest";

const pub = (url: string) => join(process.cwd(), "public", url);

describe("marca provisional (D078)", () => {
  test("los iconos del manifest existen en public/", () => {
    const icons = manifest().icons ?? [];
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) expect(existsSync(pub(icon.src))).toBe(true);
  });

  test("los SVG de origen existen y el favicon se regeneró", () => {
    for (const f of ["logo-mark", "logo-mark-inverse"]) {
      expect(existsSync(pub(`/brand/${f}.svg`))).toBe(true);
    }
    for (const f of [
      "apple-touch-icon",
      "icon-192",
      "icon-512",
      "icon-maskable-512",
    ]) {
      expect(existsSync(pub(`/brand/${f}.png`))).toBe(true);
    }
    // ICO con 3 tamaños (16, 32, 48), generado por `bun run brand:icons`.
    const ico = readFileSync(join(process.cwd(), "app", "favicon.ico"));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
  });
});
