import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Guard de la fase MUI → shadcn (D143): MUI y Emotion quedaron fuera del
 * proyecto. Ningún archivo de código los importa y ninguna dependencia los
 * trae. Los prefijos se arman por partes para que este archivo no aparezca en
 * un `git grep` de los literales.
 */
const ROOT = join(import.meta.dir, "..", "..");
const PREFIXES = [["@", "mui/"].join(""), ["@", "emotion/"].join("")];
const DIRS = ["app", "components", "lib", "theme"];
const CODE = /\.(tsx?|jsx?|mjs|cjs|css)$/;

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return CODE.test(name) ? [path] : [];
  });
}

describe("sin MUI ni Emotion", () => {
  test("ningún archivo de app/, components/, lib/ ni theme/ los cita", () => {
    const hits = DIRS.flatMap((d) => files(join(ROOT, d))).filter((path) => {
      const text = readFileSync(path, "utf8");
      return PREFIXES.some((p) => text.includes(p));
    });
    expect(hits.map((p) => relative(ROOT, p))).toEqual([]);
    // Recorre cientos de archivos: con la máquina cargada pasa de 5 s.
  }, 30_000);

  test("package.json no tiene dependencias de esos paquetes", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const deps = [
      "dependencies",
      "devDependencies",
      "peerDependencies",
      "optionalDependencies",
    ].flatMap((k) => Object.keys(pkg[k] ?? {}));
    expect(deps.filter((d) => PREFIXES.some((p) => d.startsWith(p)))).toEqual(
      [],
    );
  });
});
