import { typography } from "./tokens";

/**
 * Campos de texto "chicos" (14px) para formularios compactos: pago, login,
 * tasas, reportes.
 *
 * El tamaño va en `.MuiInputBase-root` y no solo en `.MuiInputBase-input`:
 * el hueco del borde donde se apoya el label flotante (`<legend>` del
 * outlined) mide 0.75em de la fuente del root. Si el root quedaba en 16px y
 * el label en 14px, el hueco salía más ancho que el label y dejaba un espacio
 * vacío a la derecha.
 */
export const SMALL_FIELD_SX = {
  "& .MuiInputLabel-root": { fontSize: typography.size.small },
  "& .MuiInputBase-root": { fontSize: typography.size.small },
} as const;
