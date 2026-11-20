/**
 * Iniciales del admin para el círculo de perfil del panel (D107). Pura y sin
 * `server-only`: la usa `DashboardTopbar` (cliente) y se prueba sola.
 */

/** Nombre que pone `scripts/create-admin.ts` cuando no se pasa uno. */
export const DEFAULT_ADMIN_NAME = "Administrador";

/** Partículas que no cuentan como apellido ("María de la Rosa" → "MR"). */
const PARTICLES = new Set(["de", "del", "la", "las", "los", "y"]);

/** Primera letra (con su tilde, si viene descompuesta) de un texto. */
function firstLetter(text: string): string {
  const match = text.normalize("NFC").match(/\p{L}\p{M}*/u);
  return match ? match[0].toLocaleUpperCase("es") : "";
}

/** El nombre sirve si no está vacío ni es el valor por defecto del script. */
export function realName(name: string | null | undefined): string | null {
  const trimmed = (name ?? "").trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.toLocaleLowerCase("es") === "administrador")
    return null;
  return trimmed;
}

/**
 * Primera letra del nombre + primera letra del último apellido, en
 * mayúsculas. Una sola palabra → una letra. Sin nombre real → primera letra
 * del correo.
 */
export function initialsOf(
  name: string | null | undefined,
  email: string,
): string {
  const clean = realName(name);
  if (!clean) return firstLetter(email);

  const words = clean.split(" ").filter((w) => firstLetter(w) !== "");
  if (words.length === 0) return firstLetter(email);

  const first = words[0];
  const rest = words.slice(1).filter((w) => !PARTICLES.has(w));
  const last = rest.at(-1);
  return firstLetter(first) + (last ? firstLetter(last) : "");
}
