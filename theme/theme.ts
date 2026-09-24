import { createTheme, type PaletteMode, type ThemeOptions } from "@mui/material/styles";
import { primary, secondary, gray, semantic, typography, spacing, radius, shadow, breakpoints, zIndex } from "./tokens";


function getPaletteOptions(mode: PaletteMode): ThemeOptions["palette"] {
  const isLight = mode === "light";

  return {
    mode,
    primary: {
      main: isLight ? primary[700] : primary[400],
      light: isLight ? primary[500] : primary[300],
      dark: isLight ? primary[900] : primary[600],
      contrastText: isLight ? "#FFFFFF" : gray[900],
    },
    secondary: {
      // Modo claro: el naranja de marca (`#F9750D`) sobre fondo claro no
      // llega a AA como texto (2.6:1) ni como fondo con texto blanco (2.8:1).
      // En claro baja a `secondary[700]` (`#B34C02`, ~5.5:1). El modo oscuro
      // conserva el naranja pleno (sobre navy sí contrasta).
      main: isLight ? secondary[700] : secondary[500],
      light: secondary[300],
      dark: secondary[700],
      contrastText: "#FFFFFF",
    },
    success: { main: semantic.success, contrastText: "#FFFFFF" },
    error: {
      main: isLight ? semantic.errorOnLight : semantic.errorOnDark,
      contrastText: isLight ? "#FFFFFF" : gray[900],
    },
    warning: { main: semantic.warning, contrastText: gray[900] },
    info: { main: semantic.info, contrastText: "#FFFFFF" },
    background: {
      default: isLight ? gray[50] : primary[900],
      paper: isLight ? "#FFFFFF" : gray[800],
    },
    text: {
      primary: isLight ? gray[900] : gray[50],
      secondary: isLight ? gray[600] : gray[300],
    },
    divider: isLight ? gray[200] : gray[700],
  };
}

function getShapeOptions(): ThemeOptions["shape"] {
  return {
    borderRadius: radius.sm, 
  };
}

function getShadowsOptions(mode: PaletteMode): ThemeOptions["shadows"] {
  const flat = "none";
  const sm = shadow.sm;
  const md = shadow.md;
  const lg = shadow.lg;

  return [
    flat,       
    sm, sm, sm, 
    md, md, md, md, md, 
    lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, lg, 
  ] as ThemeOptions["shadows"];
}

function getBreakpointsOptions(): ThemeOptions["breakpoints"] {
  return { values: breakpoints };
}

function getZIndexOptions(): ThemeOptions["zIndex"] {
  return {
    mobileStepper: zIndex.base,
    appBar: zIndex.navbar,
    drawer: zIndex.sidebar,
    modal: zIndex.modal,
    snackbar: zIndex.toast,
    tooltip: zIndex.dropdown,
  };
}

function getTypographyOptions(): ThemeOptions["typography"] {
  return {
    fontFamily: typography.fontFamily.body,
    h1: {
      fontFamily: typography.fontFamily.heading,
      fontWeight: typography.weight.h1,
      fontSize: typography.size.h1.desktop,
      lineHeight: typography.lineHeight.h1,
    },
    h2: {
      fontFamily: typography.fontFamily.heading,
      fontWeight: typography.weight.h2,
      fontSize: typography.size.h2.desktop,
      lineHeight: typography.lineHeight.h2,
    },
    h3: {
      fontFamily: typography.fontFamily.heading,
      fontWeight: typography.weight.h3,
      fontSize: typography.size.h3.desktop,
      lineHeight: typography.lineHeight.h3,
    },
    h4: {
      fontFamily: typography.fontFamily.heading,
      fontWeight: typography.weight.h4,
      fontSize: typography.size.h4.desktop,
      lineHeight: typography.lineHeight.h4,
    },
    body1: {
      fontFamily: typography.fontFamily.body,
      fontWeight: typography.weight.body,
      fontSize: typography.size.bodyLarge,
      lineHeight: typography.lineHeight.body,
    },
    body2: {
      fontFamily: typography.fontFamily.body,
      fontWeight: typography.weight.body,
      fontSize: typography.size.body,
      lineHeight: typography.lineHeight.body,
    },
    caption: {
      fontFamily: typography.fontFamily.body,
      fontWeight: typography.weight.body,
      fontSize: typography.size.small,
      lineHeight: typography.lineHeight.small,
    },
    button: {
      fontFamily: typography.fontFamily.body,
      fontWeight: typography.weight.bodyMedium,
      textTransform: "none",
    },
  };
}


export function getTheme(mode: PaletteMode) {
  const baseTheme = createTheme({
    palette: getPaletteOptions(mode),
    typography: getTypographyOptions(),
    shape: getShapeOptions(),
    shadows: getShadowsOptions(mode),
    breakpoints: getBreakpointsOptions(),
    zIndex: getZIndexOptions(),
    spacing: (factor: number) => `${factor * 4}px`,
  });

  // Feedback de cliente: en pantallas muy grandes (desde 1920×1080) el texto
  // se sentía chico y costaba leer — se sube un peldaño el tamaño de los
  // variants de `Typography` a partir de ese ancho. Es un media query fijo
  // en px (no un breakpoint de `theme.breakpoints`, que solo llega a `xl`
  // 1536) aplicado directamente en la definición de cada variant.
  //
  // Nota: la mayoría de las secciones del sitio (Hero, ServiceAreas, Sermons,
  // etc.) no usan estos variants — definen su tamaño de fuente directamente
  // en `sx` con valores fijos en px, que pisan cualquier tamaño del variant.
  // Este cambio sube el tamaño base de la tipografía de MUI (afecta a
  // cualquier `Typography` sin `sx.fontSize` propio, y sirve de piso para
  // futuras secciones); una pasada para subir también los tamaños fijos de
  // cada sección a partir de 1920px queda pendiente como una ronda aparte.
  const LARGE_SCREEN_QUERY = "@media (min-width:1920px)";

  return createTheme(baseTheme, {
    typography: {
      h1: {
        [baseTheme.breakpoints.down("sm")]: { fontSize: typography.size.h1.mobile },
        [LARGE_SCREEN_QUERY]: { fontSize: "72px" },
      },
      h2: {
        [baseTheme.breakpoints.down("sm")]: { fontSize: typography.size.h2.mobile },
        [LARGE_SCREEN_QUERY]: { fontSize: "52px" },
      },
      h3: {
        [baseTheme.breakpoints.down("sm")]: { fontSize: typography.size.h3.mobile },
        [LARGE_SCREEN_QUERY]: { fontSize: "36px" },
      },
      h4: {
        [baseTheme.breakpoints.down("sm")]: { fontSize: typography.size.h4.mobile },
        [LARGE_SCREEN_QUERY]: { fontSize: "26px" },
      },
      body1: { [LARGE_SCREEN_QUERY]: { fontSize: "20px" } },
      body2: { [LARGE_SCREEN_QUERY]: { fontSize: "18px" } },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: radius.lg, boxShadow: shadow.sm },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        // MUI v9 aplica el color de `contained` vía la API `variants`, que
        // gana sobre `styleOverrides.containedSecondary` — el naranja fijo
        // se define acá. `#F9750D` + blanco da 2.8:1; `#B34C02` ~5.5:1.
        variants: [
          {
            props: { variant: "contained", color: "secondary" },
            style: {
              backgroundColor: secondary[700],
              "&:hover": { backgroundColor: secondary[800] },
            },
          },
        ],
        styleOverrides: {
          root: {
            borderRadius: radius.sm,
            fontFamily: typography.fontFamily.body,
            fontWeight: typography.weight.bodyMedium,
            textTransform: "none",
            transition: "background-color 0.15s ease, border-color 0.15s ease",
          },
          sizeSmall: { padding: "8px 16px", fontSize: 13 },
          sizeMedium: { padding: "9px 18px", fontSize: 14 },
          sizeLarge: { padding: "12px 24px", fontSize: 15 },
          containedPrimary: {
            // En oscuro `primary.main` es un navy claro (`#5B6B9E`) y con
            // texto blanco da 3.7:1 — se fija un navy más profundo.
            ...(mode === "dark" && { backgroundColor: primary[600], color: "#FFFFFF" }),
            "&:hover": { backgroundColor: mode === "dark" ? primary[700] : primary[600] },
            "&.Mui-disabled": {
              backgroundColor: gray[200],
              color: gray[400],
            },
          },
          containedSecondary: {
            // Fondo naranja fijo en ambos modos: `#F9750D` con texto blanco
            // da 2.8:1; `secondary[700]` (`#B34C02`) lo sube a ~5.5:1.
            backgroundColor: secondary[700],
            "&:hover": { backgroundColor: secondary[800] },
            "&.Mui-disabled": {
              backgroundColor: gray[200],
              color: gray[400],
            },
          },
          outlined: {
            borderWidth: "1px",
            "&:hover": { borderWidth: "1px" },
          },
          text: {
            padding: "9px 12px",
            "&:hover": { backgroundColor: "transparent", color: secondary[500] },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: radius.xs },
        },
      },
      MuiContainer: {
        styleOverrides: {
          // El contenido se topaba en 1200px (`lg`) y dejaba la mitad del
          // viewport vacío en monitores 2K/4K. Se aprovecha el breakpoint
          // `xl` (1536, hasta ahora sin usar) y un escalón extra ≥1920.
          maxWidthLg: {
            [baseTheme.breakpoints.up("xl")]: { maxWidth: 1440 },
            "@media (min-width:1920px)": { maxWidth: 1600 },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: radius.xl, boxShadow: shadow.lg },
        },
      },
      MuiTextField: {
        defaultProps: {
          slotProps: { input: { style: { borderRadius: radius.xs } } },
        },
      },
    },
  });
}