import localFont from "next/font/local";

/*
 * Fuentes servidas desde el repo (`theme/font-files/`, licencia OFL al lado)
 * en vez de `next/font/google`: el build ya no descarga nada de Google Fonts,
 * que fallaba de vez en cuando en CI y en el Docker del VPS ("Can't resolve
 * '@vercel/turbopack-next/internal/font/google/font'").
 *
 * Son los mismos archivos que servía Google: subconjunto latin, variables,
 * con el eje de peso recortado a los pesos que se usan (Sora 600–800, IBM
 * Plex Sans 400–500). Para cambiar los pesos hay que volver a bajarlos de
 * `fonts.googleapis.com/css2` con el rango nuevo.
 */
export const sora = localFont({
  src: "./font-files/Sora-latin-variable.woff2",
  weight: "600 800",
  style: "normal",
  variable: "--font-heading",
  display: "swap",
});

export const ibmPlexSans = localFont({
  src: "./font-files/IBMPlexSans-latin-variable.woff2",
  weight: "400 500",
  style: "normal",
  variable: "--font-body",
  display: "swap",
});
