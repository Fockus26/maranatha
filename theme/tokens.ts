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
  lineHeight: {
    h1: 1.1,
    h2: 1.15,
    h3: 1.2,
    h4: 1.25,
    body: 1.6,
    small: 1.5,
  },
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
} as const;

export const shadow = {
  sm: "0 1px 3px rgba(6, 10, 29, 0.06)",
  md: "0 2px 8px rgba(6, 10, 29, 0.08)",
  lg: "0 4px 16px rgba(6, 10, 29, 0.10)",
} as const;

export const breakpoints = {
  xs: 0,
  sm: 600,
  md: 900,
  lg: 1200,
  xl: 1536,
} as const;

export const zIndex = {
  base: 0,
  navbar: 100,
  sidebar: 200,
  dropdown: 300,
  modalBackdrop: 400,
  modal: 410,
  toast: 500,
} as const;