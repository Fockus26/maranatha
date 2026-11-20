import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";
import { twNames } from "@/theme/tailwindNames";

/**
 * `tailwind-merge` solo resuelve los conflictos que conoce: sin registrar los
 * tokens propios, `text-h2` se lee como color y `cn("text-h2",
 * "text-foreground")` borra el tamaño sin avisar (D109). Los nombres salen de
 * `theme/tailwindNames.ts`, los mismos que genera `app/tokens.css`.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: twNames.text,
      leading: twNames.leading,
      font: twNames.font,
      spacing: twNames.spacing,
      container: twNames.container,
      radius: twNames.radius,
      shadow: twNames.shadow,
    },
    classGroups: {
      z: [{ z: twNames.z }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
