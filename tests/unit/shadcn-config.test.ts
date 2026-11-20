import { describe, expect, test } from "bun:test";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// D109: `shadcn add` trae los componentes importando `cn` del paquete `cn`
// (sin los tokens del proyecto) y lo agrega a package.json. Aquí se usa el
// `cn` de `lib/utils.ts`, el que conoce `text-h2`, `shadow-hover`…
describe("configuración de shadcn", () => {
  const config = JSON.parse(readFileSync("components.json", "utf8"));

  test("components.json apunta al cn y a la carpeta del proyecto", () => {
    expect(config.aliases.utils).toBe("@/lib/utils");
    expect(config.aliases.ui).toBe("@/components/ui");
    expect(config.tailwind.css).toBe("app/globals.css");
    expect(config.tailwind.config).toBe("");
    expect(config.rsc).toBe(true);
    expect(config.iconLibrary).toBe("lucide");
  });

  test('ningún archivo importa el paquete "cn"', () => {
    const hits = execSync(
      `git grep -lE "from ['\\"]cn['\\"]" -- app components lib theme || true`,
      { encoding: "utf8" },
    ).trim();
    expect(hits).toBe("");
  });

  test('package.json no lista el paquete "cn"', () => {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    expect(pkg.dependencies?.cn).toBeUndefined();
    expect(pkg.devDependencies?.cn).toBeUndefined();
  });

  test("las variantes del botón se fusionan con un className", () => {
    const merged = cn(buttonVariants({ size: "small" }), "text-15");
    expect(merged).toContain("text-15");
    expect(merged).not.toContain("text-13");
  });
});
