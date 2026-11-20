import {
  createTheme,
  type PaletteMode,
  type ThemeOptions,
} from "@mui/material/styles";
import { getGlobalStyles } from "./globalStyles";
import { modeRoles } from "./roles";
import {
  breakpoints,
  gray,
  primary,
  radius,
  secondary,
  semantic,
  shadow,
  typography,
  zIndex,
} from "./tokens";

function getPaletteOptions(mode: PaletteMode): ThemeOptions["palette"] {
  // Los roles viven en `theme/roles.ts` (D109): también los genera
  // `scripts/tokens-css.ts` a variables CSS para los componentes shadcn.
  return { mode, ...modeRoles(mode) };
}

function getShapeOptions(): ThemeOptions["shape"] {
  return {
    borderRadius: radius.sm,
  };
}

function getShadowsOptions(_mode: PaletteMode): ThemeOptions["shadows"] {
  const flat = "none";
  const sm = shadow.sm;
  const md = shadow.md;
  const lg = shadow.lg;

  return [
    flat,
    sm,
    sm,
    sm,
    md,
    md,
    md,
    md,
    md,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
    lg,
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
        [baseTheme.breakpoints.down("sm")]: {
          fontSize: typography.size.h1.mobile,
        },
        [LARGE_SCREEN_QUERY]: { fontSize: "72px" },
      },
      h2: {
        [baseTheme.breakpoints.down("sm")]: {
          fontSize: typography.size.h2.mobile,
        },
        [LARGE_SCREEN_QUERY]: { fontSize: "52px" },
      },
      h3: {
        [baseTheme.breakpoints.down("sm")]: {
          fontSize: typography.size.h3.mobile,
        },
        [LARGE_SCREEN_QUERY]: { fontSize: "36px" },
      },
      h4: {
        [baseTheme.breakpoints.down("sm")]: {
          fontSize: typography.size.h4.mobile,
        },
        [LARGE_SCREEN_QUERY]: { fontSize: "26px" },
      },
      body1: { [LARGE_SCREEN_QUERY]: { fontSize: "20px" } },
      body2: { [LARGE_SCREEN_QUERY]: { fontSize: "18px" } },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: getGlobalStyles(mode),
      },
      // D085: sin el ripple pulsante de foco de MUI (el de clic se conserva):
      // el anillo de foco es solo el outline de `globals.css`. Cada
      // componente que lo activa por su cuenta expone `disableFocusRipple`.
      MuiButtonBase: { defaultProps: { focusRipple: false } },
      MuiIconButton: { defaultProps: { disableFocusRipple: true } },
      MuiFab: { defaultProps: { disableFocusRipple: true } },
      MuiTab: { defaultProps: { disableFocusRipple: true } },
      MuiToggleButton: { defaultProps: { disableFocusRipple: true } },
      MuiCheckbox: { defaultProps: { disableFocusRipple: true } },
      MuiRadio: { defaultProps: { disableFocusRipple: true } },
      MuiSwitch: { defaultProps: { disableFocusRipple: true } },
      MuiAccordionSummary: { defaultProps: { disableFocusRipple: true } },
      MuiInputLabel: {
        styleOverrides: {
          // Label flotante del campo enfocado: en oscuro `primary.main`
          // (`#5B6B9E`) da 3.1:1 sobre el paper — se usa `primary[300]`
          // (5.4:1). Los estados de error conservan su rojo.
          root: {
            ...(mode === "dark" && {
              "&.Mui-focused:not(.Mui-error)": { color: primary[300] },
            }),
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: radius.lg, boxShadow: shadow.sm },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
          disableFocusRipple: true,
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
              "&.Mui-disabled": {
                backgroundColor: gray[200],
                color: gray[400],
              },
            },
          },
          {
            // MUI 9 ya no lee `styleOverrides.containedPrimary`: va como
            // variante. En oscuro `primary.main` (`#5B6B9E`) no llega a AA con
            // ningún texto de 15px; se fija un navy más profundo con blanco.
            props: { variant: "contained", color: "primary" },
            style: {
              ...(mode === "dark" && {
                backgroundColor: primary[600],
                color: "#FFFFFF",
              }),
              "&:hover": {
                backgroundColor: mode === "dark" ? primary[700] : primary[600],
              },
              "&.Mui-disabled": {
                backgroundColor: gray[200],
                color: gray[400],
              },
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
          // 44px mínimos de área táctil (design-qa fase 09).
          sizeMedium: { padding: "9px 18px", fontSize: 14, minHeight: 44 },
          sizeLarge: { padding: "12px 24px", fontSize: 15, minHeight: 48 },
          outlined: {
            borderWidth: "1px",
            "&:hover": { borderWidth: "1px" },
          },
          text: {
            padding: "9px 12px",
            "&:hover": {
              backgroundColor: "transparent",
              color: secondary[500],
            },
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
      MuiOutlinedInput: {
        styleOverrides: {
          // D085: sin outline exterior (cruzaba la etiqueta flotante); el
          // foco se marca en el borde del propio campo: naranja 2px, o rojo
          // 2px si hay error (el estado de error manda).
          root: {
            "&.Mui-focused": { outline: "none" },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--focus-ring)",
              borderWidth: 2,
            },
            "&.Mui-focused.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor:
                mode === "light" ? semantic.errorOnLight : semantic.errorOnDark,
              borderWidth: 2,
            },
          },
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
