"use client";

import BuildOutlinedIcon from "@mui/icons-material/BuildRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import VerifiedUserOutlinedIcon from "@mui/icons-material/VerifiedUserRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/lib/siteConfig";
import { gray, radius, secondary } from "@/theme/tokens";
import {
  formatReturnAt,
  getStatusCopy,
  type StatusVariant,
} from "./statusCopy";

/**
 * Pantallas de estado (D079): 404 (visitante y admin), 500 con y sin código,
 * sin conexión y mantenimiento con y sin hora. Una sola familia: cabecera
 * mínima con el logo, insignia con icono, etiqueta, título, una línea que
 * explica qué pasó, el bloque propio de la variante y las acciones.
 */

const ICONS = {
  compass: ExploreOutlinedIcon,
  alert: WarningAmberRoundedIcon,
  offline: WifiOffRoundedIcon,
  tools: BuildOutlinedIcon,
} as const;

const COPIED_MS = 2500;

interface StatusScreenProps {
  variant: StatusVariant;
  /** Código del error para soporte (solo 500). */
  code?: string;
  /** Hora aproximada de regreso (solo mantenimiento), ISO 8601. */
  returnAt?: string;
  /** "Reintentar" (500 y sin conexión). */
  onRetry?: () => void;
  /** Destino de "Ir al panel" (404 de admin). */
  panelHref?: string;
  /** Sin conexión: hay un reporte de pago guardado en este dispositivo. */
  savedDraft?: boolean;
}

export function StatusScreen({
  variant,
  code,
  returnAt,
  onRetry,
  panelHref,
  savedDraft = false,
}: StatusScreenProps) {
  const copy = getStatusCopy(variant, {
    hasCode: Boolean(code),
    hasReturnAt: Boolean(returnAt),
    panelHref,
  });
  const Icon = ICONS[copy.icon];
  const isMaintenance = variant === "maintenance";
  const [retrying, startRetry] = React.useTransition();

  // El foco va al título para que el lector de pantalla anuncie qué pasó.
  const titleRef = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const muted = { color: "text.secondary" } as const;
  const accent = {
    color: (t: { palette: { mode: string } }) =>
      t.palette.mode === "dark" ? secondary[300] : secondary[700],
  };
  const boxSx = {
    width: "100%",
    boxSizing: "border-box",
    px: 3,
    py: 2,
    borderRadius: `${radius.lg}px`,
    bgcolor: "background.paper",
    border: "1px solid",
    borderColor: "divider",
    textAlign: "left",
  } as const;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <title>{`${copy.docTitle} | ${SITE_NAME}`}</title>

      <Box
        component="header"
        sx={{
          height: { xs: 64, sm: 72 },
          px: { xs: 2, sm: 8 },
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          bgcolor: (t) =>
            t.palette.mode === "dark"
              ? "background.default"
              : "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {isMaintenance ? (
          <Logo variant="compact" size={32} />
        ) : (
          <Box
            component={Link}
            href="/"
            aria-label={`${SITE_NAME}, ir al inicio`}
            sx={{
              display: "flex",
              alignItems: "center",
              minHeight: 44,
              borderRadius: `${radius.sm}px`,
            }}
          >
            <Logo variant="compact" size={32} />
          </Box>
        )}
        {variant === "404-admin" && (
          <Typography
            variant="caption"
            sx={{ ...muted, display: { xs: "none", sm: "block" } }}
          >
            Panel de administración
          </Typography>
        )}
      </Box>

      <Container
        component="main"
        id="main-content"
        maxWidth="sm"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: { xs: "stretch", sm: "center" },
          textAlign: { xs: "left", sm: "center" },
          gap: { xs: 3, sm: 4 },
          pt: { xs: 6, sm: 12 },
          pb: { xs: 6, sm: 12 },
          px: { xs: 2, sm: 3 },
        }}
      >
        <Box
          aria-hidden
          sx={{
            width: { xs: 48, sm: 64 },
            height: { xs: 48, sm: 64 },
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) =>
              t.palette.mode === "dark" ? gray[800] : secondary[50],
            ...accent,
          }}
        >
          <Icon sx={{ fontSize: { xs: 24, sm: 32 } }} />
        </Box>

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: { xs: "flex-start", sm: "center" },
            gap: 1.5,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              fontWeight: 500,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              ...accent,
            }}
          >
            {copy.label}
          </Typography>
          <Typography
            ref={titleRef}
            tabIndex={-1}
            variant="h1"
            sx={{
              color: (t) =>
                t.palette.mode === "dark" ? "text.primary" : "primary.main",
              "&:focus": { outline: "none" },
            }}
          >
            {copy.title}
          </Typography>
          <Typography variant="body1" sx={{ ...muted, maxWidth: 560 }}>
            {copy.line}
          </Typography>
        </Box>

        {code && <ErrorCode code={code} boxSx={boxSx} />}

        {variant === "offline" && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
            }}
          >
            <Box sx={boxSx}>
              <Typography sx={{ fontWeight: 500, mb: 1 }}>
                Revisa esto:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: 2.5, ...muted }}>
                <li>Que el wifi o los datos móviles estén activos.</li>
                <li>Que el modo avión esté apagado.</li>
                <li>
                  Si hay poca señal, cambia de red o acércate a una ventana.
                </li>
              </Box>
            </Box>
            {/* Solo si de verdad hay un borrador guardado: no se promete lo
                que no pasó. */}
            {savedDraft && (
              <Box
                sx={{
                  ...boxSx,
                  border: "none",
                  display: "flex",
                  gap: 1.5,
                  bgcolor: (t) =>
                    t.palette.mode === "dark" ? gray[800] : secondary[50],
                }}
              >
                <VerifiedUserOutlinedIcon aria-hidden sx={accent} />
                <Box>
                  <Typography sx={{ fontWeight: 500 }}>
                    Lo que estabas llenando está a salvo
                  </Typography>
                  <Typography sx={muted}>
                    Tu reporte de pago quedó guardado en este dispositivo, tal
                    como lo dejaste. Todavía no se ha enviado: cuando vuelva la
                    conexión, revísalo y envíalo.
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        )}

        {isMaintenance && returnAt && <ReturnAt iso={returnAt} boxSx={boxSx} />}

        {copy.actions.length > 0 && (
          <Box
            sx={{
              width: "100%",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "center",
              gap: 1.5,
              mt: 1,
            }}
          >
            {copy.actions.map((action) =>
              action.href ? (
                <Button
                  key={action.label}
                  component={Link}
                  href={action.href}
                  size="large"
                  variant={action.primary ? "contained" : "outlined"}
                  // CTA principal naranja, igual que /pago/resultado y
                  // "Diezmo" (design-qa fase 09).
                  color={action.primary ? "secondary" : "primary"}
                  sx={action.primary ? undefined : outlinedSx}
                >
                  {action.label}
                </Button>
              ) : (
                <Button
                  key={action.label}
                  size="large"
                  variant="contained"
                  color="secondary"
                  disabled={retrying}
                  onClick={() => startRetry(() => onRetry?.())}
                  startIcon={
                    retrying ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <RefreshRoundedIcon />
                    )
                  }
                >
                  {retrying ? "Reintentando…" : action.label}
                </Button>
              ),
            )}
          </Box>
        )}

        {variant === "500" && (
          <Typography variant="caption" sx={muted}>
            ¿Necesitas ayuda? Escríbenos a{" "}
            <Box
              component="a"
              href={`mailto:${SITE_CONTACT_EMAIL}`}
              // Subrayado: el enlace no se distingue solo por color (axe
              // link-in-text-block, design-qa fase 09). 44px de alto en móvil.
              sx={{
                color: "text.primary",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                display: "inline-flex",
                alignItems: "center",
                minHeight: { xs: 44, sm: "auto" },
              }}
            >
              {SITE_CONTACT_EMAIL}
            </Box>
          </Typography>
        )}
      </Container>
    </Box>
  );
}

// `outlined` primario en oscuro usa `primary.main` (#5B6B9E, 3.8:1 sobre el
// fondo): aquí va con el color del texto y un borde gray[300] (D079).
const outlinedSx = {
  color: (t: { palette: { mode: string } }) =>
    t.palette.mode === "dark" ? gray[50] : undefined,
  borderColor: (t: { palette: { mode: string } }) =>
    t.palette.mode === "dark" ? gray[300] : "primary.main",
} as const;

function ErrorCode({ code, boxSx }: { code: string; boxSx: object }) {
  const [copied, setCopied] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout>>(undefined);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Sin portapapeles: el código sigue seleccionable con un clic.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_MS);
  }

  return (
    <Box
      sx={{
        ...boxSx,
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          id="codigo-error"
          variant="caption"
          sx={{ color: "text.secondary", display: "block" }}
        >
          Código del error
        </Typography>
        <Typography
          variant="h4"
          component="p"
          aria-labelledby="codigo-error"
          sx={{
            m: 0,
            letterSpacing: "0.04em",
            fontVariantNumeric: "tabular-nums",
            userSelect: "all",
            overflowWrap: "anywhere",
          }}
        >
          {code}
        </Typography>
      </Box>
      <Button
        variant="outlined"
        onClick={copyCode}
        startIcon={copied ? <CheckRoundedIcon /> : <ContentCopyRoundedIcon />}
        sx={{ ...outlinedSx, minHeight: 44 }}
      >
        {copied ? "Copiado" : "Copiar código"}
      </Button>
      <Box
        aria-live="polite"
        sx={{
          // "1px" y no `1`: en `sx` el 1 es 100% y desbordaba la página
          // (design-qa fase 09).
          position: "absolute",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          clip: "rect(0 0 0 0)",
        }}
      >
        {copied ? "Código copiado" : ""}
      </Box>
    </Box>
  );
}

function ReturnAt({ iso, boxSx }: { iso: string; boxSx: object }) {
  // Se formatea en el cliente, en la zona de quien mira; en el servidor
  // queda vacío para no hidratar con otra zona horaria.
  const [label, setLabel] = React.useState<string | null>(null);
  React.useEffect(() => {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) setLabel(formatReturnAt(date));
  }, [iso]);
  if (!label) return null;

  return (
    <Box sx={{ ...boxSx, display: "flex", gap: 1.5, alignItems: "flex-start" }}>
      <ScheduleRoundedIcon
        aria-hidden
        sx={{
          mt: 0.25,
          color: (t) =>
            t.palette.mode === "dark" ? secondary[300] : secondary[700],
        }}
      />
      <Box>
        <Typography sx={{ color: "text.secondary" }}>
          Volvemos aproximadamente:
        </Typography>
        <Typography variant="h4" component="time" dateTime={iso}>
          {label}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", display: "block" }}
        >
          En tu hora local
        </Typography>
      </Box>
    </Box>
  );
}
