import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Marca provisional (D078). Todo lo que pinta el logo — favicon, apple icon,
 * manifest y las imágenes OG — parte de los SVG de `public/brand/`. Cuando
 * llegue el logo real del cliente, se reemplazan esos archivos y se corre
 * `bun run brand:icons` para regenerar los PNG/ICO; nada más cambia.
 */
export type BrandFile =
  | "logo-mark"
  | "logo-mark-inverse"
  | "logo-horizontal"
  | "logo-horizontal-inverse"
  | "logo-compact"
  | "logo-compact-inverse";

/** El SVG como data URI, para `<img>` dentro de `ImageResponse`. */
export async function brandSvgDataUri(file: BrandFile): Promise<string> {
  const svg = await readFile(
    join(process.cwd(), "public", "brand", `${file}.svg`),
  );
  return `data:image/svg+xml;base64,${svg.toString("base64")}`;
}
