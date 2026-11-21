export const primary = {
  50: "#EEF0F7",
  100: "#D7DBEB",
  200: "#AFB7D6",
  300: "#8894C2",
  400: "#5B6B9E",
  500: "#37447A",
  600: "#1E2B5C",
  700: "#101B45",
  800: "#0B1433",
  900: "#060A1D",
} as const;

export const secondary = {
  50: "#FFF4EA",
  100: "#FEE1C4",
  200: "#FDC48A",
  300: "#FCA355",
  400: "#FA8A2E",
  500: "#F9750D",
  600: "#DC5F02",
  700: "#B34C02",
  800: "#8A3B03",
  900: "#612903",
} as const;

// Blanco y negro puros (texto sobre navy fijo, scrims de video).
export const common = {
  white: "#FFFFFF",
  black: "#000000",
} as const;

// Texto y superficies sobre las piezas navy fijas (D024/D025: topbar,
// sidebar, menú móvil). Ratios sobre `primary[900]`.
export const onNavy = {
  text: common.white, // 19.6:1
  muted: "rgba(255,255,255,0.75)", // 11.9:1
  subtle: "rgba(255,255,255,0.65)", // 9.4:1
  hover: "rgba(255,255,255,0.08)",
  divider: "rgba(255,255,255,0.15)",
  border: "rgba(255,255,255,0.08)",
} as const;

export const gray = {
  50: "#F5F6FA",
  100: "#E7E9F1",
  200: "#CBD0E0",
  300: "#A6AEC7",
  400: "#7C86A8",
  500: "#5B6480",
  600: "#434A63",
  700: "#2F3448",
  800: "#1D2032",
  900: "#12131F",
} as const;

export const semantic = {
  success: "#16B37A",
  // Verde profundo para superficies rellenas con texto blanco (chips
  // "Completado", alert de éxito) — `success` con blanco encima da 2.7:1.
  successFilled: "#0B7A54",
  error: "#EF4444",
  // Variantes AA del rojo de error por modo (hallazgo a11y del paso de pago):
  // `error` da 3.76:1 sobre blanco y 4.28:1 sobre el paper oscuro, bajo el
  // 4.5:1 que exige texto de 14px (helpers y labels de campos inválidos).
  // Claro: 5.6:1 sobre blanco / 5.2:1 sobre gray[50], y 5.6:1 con texto
  // blanco encima. Oscuro: 5.8:1 sobre gray[800]; con texto encima va
  // gray[900] (6.7:1) porque el blanco solo da 2.8:1.
  errorOnLight: "#C62828",
  errorOnDark: "#F87171",
  warning: "#F5A524",
  info: "#3B9EF5",
} as const;

// `::selection` por modo (adenda de diseño). Ratio = texto sobre el relleno.
// Se distingue del foco (anillo `secondary[500]` de 2px) por forma y
// luminosidad, y de los enlaces porque estos conservan el subrayado.
export const selection = {
  light: { bg: secondary[200], text: gray[900] }, // 11.8:1
  // Oscuro y piezas navy fijas (D025) comparten el par.
  dark: { bg: secondary[800], text: "#FFFFFF" }, // 7.8:1
} as const;

// Barra de scroll (adenda de diseño). Ratios del thumb contra su track,
// mínimo 3:1 en todos los estados.
export const scrollbar = {
  size: { page: 12, inner: 8 }, // ancho del riel, px
  // Borde transparente del thumb (reposo → hover/activo): 12 − 2·3 = 6px
  // visibles que crecen a 8px.
  inset: { page: 3, pageHover: 2, inner: 2, innerHover: 1 },
  minThumb: 48,
  light: {
    track: gray[100],
    thumb: gray[500], // 4.8:1
    hover: gray[600], // 7.2:1
    active: primary[700], // 13.7:1
  },
  dark: {
    track: gray[800],
    thumb: gray[400], // 4.5:1
    hover: gray[300], // 7.3:1
    active: gray[200], // 10.5:1
  },
  // Sidebar, topbar y menú móvil navy fijos (D025).
  navy: {
    track: primary[800],
    thumb: primary[300], // 6.1:1
    hover: primary[200], // 9.1:1
    active: secondary[500], // 6.5:1
  },
} as const;

export const typography = {
  fontFamily: {
    heading: "var(--font-heading), sans-serif",
    body: "var(--font-body), sans-serif",
  },
  weight: {
    body: 400,
    bodyMedium: 500,
    h4: 600,
    h3: 600,
    h2: 700,
    h1: 800,
  },
  size: {
    h1: { desktop: "60px", mobile: "36px" },
    h2: { desktop: "44px", mobile: "28px" },
    h3: { desktop: "30px", mobile: "22px" },
    h4: { desktop: "22px", mobile: "18px" },
    bodyLarge: "18px",
    body: "16px",
    small: "14px",
  },
  // Desde `largeScreen` (1920px) el texto sube un peldaño (feedback de
  // cliente): h1–h4 y los dos cuerpos. `small` no cambia.
  sizeLarge: {
    h1: "72px",
    h2: "52px",
    h3: "36px",
    h4: "26px",
    bodyLarge: "20px",
    body: "18px",
  },
  lineHeight: {
    h1: 1.1,
    h2: 1.15,
    h3: 1.2,
    h4: 1.25,
    body: 1.6,
    small: 1.5,
    // Botones: el interlineado por defecto de MUI, que hoy pintan todos los
    // botones (D110:`components/ui/button.tsx`).
    button: 1.75,
    // Interlineados con nombre de Tailwind (D137): títulos grandes y cuerpos
    // que no son h1–h4 ni `body` (antes `leading-[1.3]` etc.).
    tight: 1.15,
    snug: 1.3,
    normal: 1.4,
    relaxed: 1.65,
  },
  // Espaciado entre letras (D137): `tracking-<nombre>`. Los valores son los que
  // ya usaba el sitio como `tracking-[…em]`; `caps`/`eyebrow` son los de las
  // etiquetas en mayúsculas y los sobretítulos.
  letterSpacing: {
    tighter: "-0.02em",
    tight: "-0.01em",
    wide: "0.02em",
    wider: "0.03em",
    "wide-4": "0.04em",
    "wide-5": "0.05em",
    "wide-6": "0.06em",
    caps: "0.08em",
    eyebrow: "0.14em",
    "eyebrow-lg": "0.18em",
  },
} as const;

// Tamaños de letra en uso fuera de la escala de `typography.size`
// (etiquetas, chips, iconos, ajustes de ≥1920px). design-qa fase 09: se
// tokenizan tal cual, sin cambio visual; recortarlos a la escala es una
// decisión de diseño aparte. Uso: `fontSize: fontScale[13]`.
export const fontScale = {
  10.5: "10.5px",
  11: "11px",
  11.5: "11.5px",
  12: "12px",
  12.5: "12.5px",
  13: "13px",
  13.5: "13.5px",
  14: "14px",
  15: "15px",
  16: "16px",
  17: "17px",
  18: "18px",
  19: "19px",
  20: "20px",
  22: "22px",
  26: "26px",
  28: "28px",
  32: "32px",
  34: "34px",
  36: "36px",
  38: "38px",
  40: "40px",
  44: "44px",
  46: "46px",
  52: "52px",
  54: "54px",
  56: "56px",
  58: "58px",
  64: "64px",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 96,
} as const;

export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999, // píldoras, chips y avatares redondos
} as const;

export const shadow = {
  sm: "0 1px 3px rgba(6, 10, 29, 0.06)",
  md: "0 2px 8px rgba(6, 10, 29, 0.08)",
  lg: "0 4px 16px rgba(6, 10, 29, 0.10)",
  // Hover de tarjetas elevadas (Agenda): normal y sobre la tarjeta navy.
  hover: "0 8px 20px rgba(6, 10, 29, 0.10)",
  hoverNavy: "0 10px 30px rgba(6, 10, 29, 0.28)",
} as const;

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

// Ancho desde el que aplican los escalones "pantalla grande" (texto, ancho del
// contenedor). No es un breakpoint de MUI (`breakpoints` llega a `xl`); en
// Tailwind es `wide:` (D119).
export const largeScreen = 1920;

// Anchos máximos de contenido (D109). `contentNarrow`: la fila texto +
// formulario de Ofrendar (`TitheLayout`, D105). En Tailwind: `max-w-narrow`.
// `page`: los `maxWidth` del `Container` de MUI (`xs`…`lg`) y los escalones de
// `lg` en `xl` y ≥1920 (`wide`); en Tailwind `max-w-page-lg` (D119).
export const layout = {
  contentNarrow: 960,
  // `max-w-agenda` (la lista de reuniones) y `max-w-panel` (el contenido del
  // dashboard), D137. `max-w-reading` es `readingMeasure` (la medida de lectura).
  agenda: 1000,
  panel: 1400,
  page: { xs: 444, sm: 600, md: 900, lg: 1200, xl: 1440, wide: 1600 },
} as const;

// Medida de lectura de los textos largos (`max-w-reading`, D137).
export const readingMeasure = "70ch";

// Panel lateral de formularios del dashboard (D096): ancho desde `md`.
export const formDrawer = {
  width: 560,
} as const;

export const zIndex = {
  base: 0,
  navbar: 100,
  sidebar: 200,
  dropdown: 300,
  modalBackdrop: 400,
  modal: 410,
  toast: 500,
  progress: 600, // barra de carga al navegar (D095): por encima de todo
} as const;

// Barra de progreso de navegación (D095).
export const navProgress = {
  height: 3,
  timeoutMs: 10000, // si no llegó nada, se oculta sola
  fadeMs: 250,
} as const;

// Imagen Open Graph (1200×630, D078). Es una imagen, no la web: sus tamaños
// quedan fuera de la escala tipográfica.
export const og = {
  width: 1200,
  height: 630,
  safeX: 80, // margen de seguridad lateral
  safeY: 64, // margen de seguridad vertical
  title: 72,
  titleProject: 64,
  subtitle: 28,
  footer: 22,
  photoWidth: 400, // foto de portada del proyecto, a la derecha
  patternStep: 28, // líneas diagonales del patrón, cada N px
} as const;
