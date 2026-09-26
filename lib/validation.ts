/**
 * Validaciones de cliente compartidas por los formularios (fase QA).
 *
 * El regex anterior (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) aceptaba `a@b..com`,
 * `a@b.c` (TLD de 1 carácter) y `a@b.com.` (punto final). Este exige al
 * menos un dominio, cero o más subdominios y un TLD de ≥2 letras, sin
 * puntos consecutivos ni finales.
 */
export const EMAIL_RE =
  /^[^\s@.]+(?:\.[^\s@.]+)*@[^\s@.]+(?:\.[^\s@.]+)*\.[a-zA-Z]{2,}$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}
