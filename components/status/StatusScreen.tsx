"use client";

import {
  Check,
  Clock,
  Compass,
  Copy,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  WifiOff,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/lib/siteConfig";
import { cn } from "@/lib/utils";
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
 *
 * Migrada a shadcn (D122): mismas 7 variantes y props; el spinner de
 * "Reintentando…" es `LoaderCircle` (quieto con reduced-motion).
 */

const ICONS = {
  compass: Compass,
  alert: TriangleAlert,
  offline: WifiOff,
  tools: Wrench,
} as const;

const COPIED_MS = 2500;

// Naranja del acento por modo (AA sobre el fondo de la insignia).
const ACCENT = "text-secondary-700 dark:text-secondary-300";
// Insignia y avisos: `secondary[50]` en claro, `gray[800]` en oscuro.
const SOFT_BG = "bg-secondary-50 dark:bg-gray-800";
// Tarjetas de información: papel con borde.
const BOX =
  "box-border w-full rounded-lg border border-border bg-card px-3 py-2 text-left";
// `outlined` primario en oscuro usa `primary.main` (#5B6B9E, 3.8:1 sobre el
// fondo): aquí va con el color del texto y un borde gray[300] (D079).
const OUTLINED =
  "border-primary dark:border-gray-300 dark:text-gray-50 dark:hover:border-gray-300";

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

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <title>{`${copy.docTitle} | ${SITE_NAME}`}</title>

      <header className="flex h-16 items-center justify-between gap-2 border-border border-b bg-card px-2 sm:h-18 sm:px-8 dark:bg-background">
        {isMaintenance ? (
          <Logo variant="compact" size={32} />
        ) : (
          <Link
            href="/"
            aria-label={`${SITE_NAME}, ir al inicio`}
            className="flex min-h-11 items-center rounded-sm"
          >
            <Logo variant="compact" size={32} />
          </Link>
        )}
        {variant === "404-admin" && (
          <span className="hidden font-body text-muted-foreground text-small leading-small sm:block">
            Panel de administración
          </span>
        )}
      </header>

      <Container
        asChild
        maxWidth="sm"
        className="flex flex-1 flex-col items-stretch gap-3 pt-6 pb-6 text-left sm:items-center sm:gap-4 sm:pt-12 sm:pb-12 sm:text-center"
      >
        <main id="main-content">
          <div
            aria-hidden
            className={cn(
              "flex size-12 items-center justify-center rounded-full sm:size-16",
              SOFT_BG,
              ACCENT,
            )}
          >
            <Icon className="size-6 sm:size-8" />
          </div>

          <div className="flex flex-col items-start gap-1.5 sm:items-center">
            <span
              className={cn(
                "font-body font-medium text-small uppercase leading-small tracking-[0.08em]",
                ACCENT,
              )}
            >
              {copy.label}
            </span>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="m-0 font-extrabold font-heading text-h1 text-primary leading-h1 focus:outline-none dark:text-foreground"
            >
              {copy.title}
            </h1>
            <p className="m-0 max-w-140 font-body text-body-lg text-muted-foreground leading-body">
              {copy.line}
            </p>
          </div>

          {code && <ErrorCode code={code} />}

          {variant === "offline" && (
            <div className="flex w-full flex-col gap-1.5">
              <div className={BOX}>
                <p className="m-0 mb-1 font-body font-medium text-body-lg leading-body">
                  Revisa esto:
                </p>
                <ul className="m-0 list-disc pl-2.5 text-body text-muted-foreground">
                  <li>Que el wifi o los datos móviles estén activos.</li>
                  <li>Que el modo avión esté apagado.</li>
                  <li>
                    Si hay poca señal, cambia de red o acércate a una ventana.
                  </li>
                </ul>
              </div>
              {/* Solo si de verdad hay un borrador guardado: no se promete lo
                  que no pasó. */}
              {savedDraft && (
                <div className={cn(BOX, "flex gap-1.5 border-0", SOFT_BG)}>
                  <ShieldCheck
                    aria-hidden
                    className={cn("size-6 shrink-0", ACCENT)}
                  />
                  <div>
                    <p className="m-0 font-body font-medium text-body-lg leading-body">
                      Lo que estabas llenando está a salvo
                    </p>
                    <p className="m-0 font-body text-body-lg text-muted-foreground leading-body">
                      Tu reporte de pago quedó guardado en este dispositivo, tal
                      como lo dejaste. Todavía no se ha enviado: cuando vuelva
                      la conexión, revísalo y envíalo.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {isMaintenance && returnAt && <ReturnAt iso={returnAt} />}

          {copy.actions.length > 0 && (
            <div className="mt-1 flex w-full flex-col justify-center gap-1.5 sm:flex-row">
              {copy.actions.map((action) =>
                action.href ? (
                  <Button
                    key={action.label}
                    asChild
                    size="large"
                    variant={action.primary ? "contained" : "outlined"}
                    // CTA principal naranja, igual que /pago/resultado y
                    // "Ofrendar" (design-qa fase 09).
                    color={action.primary ? "secondary" : "primary"}
                    className={action.primary ? undefined : OUTLINED}
                  >
                    <Link href={action.href}>{action.label}</Link>
                  </Button>
                ) : (
                  <Button
                    key={action.label}
                    size="large"
                    color="secondary"
                    disabled={retrying}
                    onClick={() => startRetry(() => onRetry?.())}
                  >
                    {retrying ? (
                      <LoaderCircle
                        aria-hidden
                        className="size-5 animate-spin motion-reduce:animate-none"
                      />
                    ) : (
                      <RefreshCw aria-hidden className="size-5" />
                    )}
                    {retrying ? "Reintentando…" : action.label}
                  </Button>
                ),
              )}
            </div>
          )}

          {variant === "500" && (
            <p className="m-0 font-body text-muted-foreground text-small leading-small">
              ¿Necesitas ayuda? Escríbenos a{" "}
              {/* Subrayado: el enlace no se distingue solo por color (axe
                  link-in-text-block, design-qa fase 09). 44px de alto en móvil. */}
              <a
                href={`mailto:${SITE_CONTACT_EMAIL}`}
                className="inline-flex min-h-11 items-center text-foreground underline underline-offset-3 sm:min-h-0"
              >
                {SITE_CONTACT_EMAIL}
              </a>
            </p>
          )}
        </main>
      </Container>
    </div>
  );
}

function ErrorCode({ code }: { code: string }) {
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
    <div
      className={cn(BOX, "flex flex-wrap items-center justify-between gap-2")}
    >
      <div className="min-w-0">
        <span className="block font-body text-muted-foreground text-small leading-small">
          Código del error
        </span>
        <p className="m-0 select-all wrap-anywhere font-heading font-semibold text-h4 leading-h4 tracking-[0.04em] tabular-nums">
          {code}
        </p>
      </div>
      <Button variant="outlined" onClick={copyCode} className={OUTLINED}>
        {copied ? (
          <Check aria-hidden className="size-5" />
        ) : (
          <Copy aria-hidden className="size-5" />
        )}
        {copied ? "Copiado" : "Copiar código"}
      </Button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Código copiado" : ""}
      </span>
    </div>
  );
}

function ReturnAt({ iso }: { iso: string }) {
  // Se formatea en el cliente, en la zona de quien mira; en el servidor
  // queda vacío para no hidratar con otra zona horaria.
  const [label, setLabel] = React.useState<string | null>(null);
  React.useEffect(() => {
    const date = new Date(iso);
    if (!Number.isNaN(date.getTime())) setLabel(formatReturnAt(date));
  }, [iso]);
  if (!label) return null;

  return (
    <div className={cn(BOX, "flex items-start gap-1.5")}>
      <Clock aria-hidden className={cn("mt-px size-6 shrink-0", ACCENT)} />
      <div>
        <p className="m-0 font-body text-body-lg text-muted-foreground leading-body">
          Volvemos aproximadamente:
        </p>
        <time
          dateTime={iso}
          className="m-0 font-heading font-semibold text-h4 leading-h4"
        >
          {label}
        </time>
        <span className="block font-body text-muted-foreground text-small leading-small">
          En tu hora local
        </span>
      </div>
    </div>
  );
}
