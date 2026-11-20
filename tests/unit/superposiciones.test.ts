import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

// D117/D118: sin entorno DOM; el ancho medido del toast está en el PR.
describe("superposiciones de shadcn", () => {
  const sonner = readFileSync("components/ui/sonner.tsx", "utf8");
  const layout = readFileSync("app/layout.tsx", "utf8");

  test("el Toaster se monta una sola vez, en el layout", () => {
    expect(layout.match(/<Toaster \/>/g)).toHaveLength(1);
  });

  test("el toast trae su ancho, la pila y z-toast (no queda unstyled)", () => {
    expect(sonner).toContain("--width");
    expect(sonner).toContain("--z-index-toast");
    expect(sonner).toContain("gap={8}");
    expect(sonner).not.toContain("unstyled");
  });

  test("dialog y sheet usan los tokens de capa y el fondo card", () => {
    for (const f of ["dialog", "sheet"]) {
      const src = readFileSync(`components/ui/${f}.tsx`, "utf8");
      expect(src).toContain("z-modal-backdrop");
      expect(src).toContain("bg-card");
      expect(src).not.toContain('from "cn"');
    }
  });
});
