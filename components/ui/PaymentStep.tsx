"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, Check, Copy, LoaderCircle, Paperclip } from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import {
  type CheckoutMethod,
  getCheckoutOptions,
  type PaypalCheckoutError,
  type ReportPaymentError,
  reportManualPayment,
  startBinanceCheckout,
  startPaypalCheckout,
} from "@/app/actions/payments";
import { formatAmount } from "@/lib/payments/labels";
import type { PaymentFrequency, PaymentPurpose } from "@/lib/payments/schema";
import { cn } from "@/lib/utils";
import { Alert } from "./alert";
import { Button } from "./button";
import { DateField } from "./DateField";
import { DonationFormCard } from "./DonationFormCard";
import { Field } from "./field";
import { Input } from "./input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/** Igual a `MAX_RECEIPT_BYTES` de lib/payments/receipts.ts (solo servidor). */
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

/** Texto secundario de 12 px (ayudas, etiquetas de los datos de la cuenta). */
const HINT_CLASSES = "font-body text-12 leading-body text-muted-foreground";
/** Avisos del paso: el `Alert` con el texto de 12 px que tenía en MUI. */
const ALERT_CLASSES = "text-12";

/**
 * Paso 2 del aporte: el donante elige método de pago.
 *
 * - Métodos manuales (Pago Móvil, Zelle, Bancolombia, Binance):
 *   se muestran los datos de la cuenta receptora y el monto en la moneda del
 *   método; el donante paga desde su app y reporta la referencia. Queda
 *   `pending` hasta que un admin lo verifica en `/dashboard/pagos`.
 * - Pasarelas: el servidor crea la orden y el navegador redirige a la
 *   pasarela. PayPal: al volver, `/pago/paypal/retorno` captura y confirma.
 *   Binance (solo con credenciales de Binance Pay Merchant; si no, es
 *   manual): el webhook confirma el pago.
 *
 * "Mensual" solo se ofrece con PayPal: los métodos manuales no pueden cobrar
 * de forma recurrente, así que el servidor ni siquiera los devuelve.
 *
 * No depende de dónde se monte (sección del inicio, modal de diezmo o el
 * diálogo de un proyecto): el `DateField` busca su propio `role="dialog"`.
 */

export interface PaymentStepContribution {
  purpose: PaymentPurpose;
  projectSlug?: string;
  frequency: PaymentFrequency;
  amountUsd: number;
  name: string;
  email: string;
}

export interface PaymentStepProps {
  contribution: PaymentStepContribution;
  /** Texto corto del resumen bajo el monto (ej. "Diezmo · Única vez"). */
  summary: string;
  width?: number;
  onBack: () => void;
  onReported: () => void;
}

const REPORT_ERROR_TEXT: Record<ReportPaymentError, string> = {
  invalid_input:
    "Revisa los datos del reporte: referencia, fecha y monto pagado.",
  invalid_project: "Este proyecto ya no recibe aportes.",
  method_unavailable: "Este método de pago no está disponible en este momento.",
  invalid_receipt:
    "El comprobante debe ser una imagen (JPG, PNG, WebP) o PDF de hasta 4 MB.",
  duplicate_reference:
    "Esa referencia ya fue reportada. Si crees que es un error, escríbenos.",
  too_many_requests:
    "Recibimos varios reportes seguidos de este correo. Prueba de nuevo en un rato.",
  not_configured: "Los pagos todavía no están habilitados. Prueba más tarde.",
  server_error:
    "No pudimos registrar el reporte. Prueba de nuevo en unos minutos.",
};

function todayIso() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

/**
 * Botón de copiar con tooltip (hover y foco por teclado). Radix cierra el
 * tooltip al pulsar el disparador, así que se mantiene abierto mientras dura
 * el "Copiado"; el aviso también va a una región `aria-live` para el lector
 * de pantalla (el tooltip solo se lee al enfocar).
 */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const [hoverOpen, setHoverOpen] = useState(false);
  const name = `Copiar ${label.toLowerCase()}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el valor sigue visible para copiarlo a mano.
    }
  }

  return (
    <>
      <Tooltip open={hoverOpen || copied} onOpenChange={setHoverOpen}>
        <TooltipTrigger asChild>
          <Button
            variant="plain"
            size="icon"
            // El `IconButton size="small"` de MUI: 28 px con ícono de 18.
            className="size-7 p-1.25"
            onClick={copy}
            aria-label={name}
          >
            {copied ? (
              <Check className="size-4.5" aria-hidden="true" />
            ) : (
              <Copy className="size-4.5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{copied ? "Copiado" : name}</TooltipContent>
      </Tooltip>
      <span className="sr-only" aria-live="polite">
        {copied ? "Copiado" : ""}
      </span>
    </>
  );
}

/**
 * Anima el cambio de alto cuando el contenido cambia (al elegir otro método
 * el panel crece o se achica). Mide el contenido con ResizeObserver y anima
 * la altura del contenedor; con `prefers-reduced-motion` el cambio es
 * instantáneo.
 */
function AnimatedHeight({ children }: { children: ReactNode }) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      animate={{ height }}
      initial={false}
      transition={{
        duration: reduceMotion ? 0 : 0.32,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      // `clip` en vez de `hidden`: recorta solo durante la animación sin
      // crear un contenedor de scroll; el margen negativo + padding deja
      // lugar a los anillos de foco de los campos para que no se corten.
      // `content-box`: la altura animada es la del contenido; el padding va
      // aparte (con border-box el padding se comía 8px y cortaba el botón).
      className="-m-1 box-content overflow-clip p-1"
    >
      <div ref={innerRef}>{children}</div>
    </motion.div>
  );
}

function MethodOption({
  method,
  checked,
  name,
  onSelect,
}: {
  method: CheckoutMethod;
  checked: boolean;
  name: string;
  onSelect: () => void;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-1.5 rounded-sm border px-2 py-1.5 transition-[border-color,background-color] duration-150",
        "has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-secondary",
        checked
          ? "border-secondary bg-secondary-light/13"
          : "border-border bg-transparent",
      )}
    >
      <input
        type="radio"
        aria-label={method.label}
        name={name}
        value={method.id}
        checked={checked}
        onChange={onSelect}
        className="m-0 accent-secondary"
      />
      {/* Logos servidos desde /public (sin terceros). Decorativos: el
          nombre del método ya está en el texto y en el aria-label. */}
      {/* biome-ignore lint/performance/noImgElement: SVG local de 20 px; `next/image` no aporta nada aquí. */}
      <img
        src={`/payment-methods/${method.id}.svg`}
        alt=""
        width={20}
        height={20}
        className="block shrink-0"
      />
      <span className="font-body text-13 font-medium leading-body">
        {method.label}
      </span>
    </label>
  );
}

function gatewayErrorText(
  error: PaypalCheckoutError,
  gatewayName: string,
): string {
  switch (error) {
    case "invalid_input":
      return "Revisa el monto y tus datos en el paso anterior.";
    case "invalid_project":
      return "Este proyecto ya no recibe aportes.";
    case "method_unavailable":
      return `${gatewayName} no está disponible en este momento. Prueba con otro método.`;
    case "too_many_requests":
      return "Iniciaste varios pagos seguidos. Prueba de nuevo en un rato.";
    case "not_configured":
      return "Los pagos todavía no están habilitados. Prueba más tarde.";
    case "server_error":
      return `No pudimos conectar con ${gatewayName}. Prueba de nuevo en unos minutos.`;
  }
}

/** Pasarelas: nombre que ve el donante y acción que crea la orden. */
const GATEWAYS = {
  paypal: { name: "PayPal", start: startPaypalCheckout },
  binance: { name: "Binance", start: startBinanceCheckout },
} as const;

/**
 * Pasarela (PayPal o Binance Pay): el servidor crea la orden y devuelve el
 * link de pago; el navegador redirige ahí. Con PayPal, las tarjetas
 * Visa/Mastercard (incluidas prepago) también pasan por acá, sin crear cuenta.
 */
function GatewayPanel({
  method,
  contribution,
}: {
  method: CheckoutMethod;
  contribution: PaymentStepContribution;
}) {
  const gateway = method.id === "binance" ? GATEWAYS.binance : GATEWAYS.paypal;
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<PaypalCheckoutError | null>(null);

  // Si el donante vuelve con "atrás" desde la pasarela, el navegador restaura la
  // página desde el bfcache con el botón aún en "Redirigiendo…".
  useEffect(() => {
    function onPageShow(event: PageTransitionEvent) {
      if (event.persisted) setRedirecting(false);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleClick() {
    if (redirecting) return;
    setRedirecting(true);
    setError(null);
    try {
      const result = await gateway.start(contribution);
      if (result.ok) {
        // Se queda en "Redirigiendo…" hasta que el navegador sale de la página.
        window.location.assign(result.data.approveUrl);
        return;
      }
      setError(result.error);
    } catch {
      setError("server_error");
    }
    setRedirecting(false);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className={HINT_CLASSES}>
        {method.hint} Te llevaremos a {gateway.name} para completar el pago de
        forma segura y volverás aquí al terminar.
      </p>
      {contribution.frequency === "monthly" && (
        <Alert severity="info" className={ALERT_CLASSES}>
          PayPal cobrará {formatAmount(contribution.amountUsd, "USD")} hoy y el
          mismo día de cada mes. Puedes cancelarlo cuando quieras desde tu
          cuenta PayPal (Configuración → Pagos automáticos).
        </Alert>
      )}
      {error && (
        <Alert severity="error" className={ALERT_CLASSES}>
          {gatewayErrorText(error, gateway.name)}
        </Alert>
      )}
      <Button
        color="secondary"
        className="w-full"
        onClick={handleClick}
        disabled={redirecting}
      >
        {redirecting
          ? `Redirigiendo a ${gateway.name}…`
          : `Continuar a ${gateway.name}`}
      </Button>
    </div>
  );
}

function ManualPaymentPanel({
  method,
  contribution,
  onReported,
}: {
  method: CheckoutMethod;
  contribution: PaymentStepContribution;
  onReported: () => void;
}) {
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [reference, setReference] = useState("");
  const [paidAt, setPaidAt] = useState(todayIso);
  const [amountPaid, setAmountPaid] = useState(
    method.amountDue != null ? String(method.amountDue) : "",
  );
  const [receipt, setReceipt] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<ReportPaymentError | null>(null);

  // Igual que `manualReportSchema`: caracteres permitidos y al menos una
  // letra o número.
  const referenceValid =
    /^[A-Za-z0-9@._\- ]{3,64}$/.test(reference.trim()) &&
    /[A-Za-z0-9]/.test(reference);
  const amountValid = Number(amountPaid) > 0;
  const dateValid = paidAt !== "" && paidAt <= todayIso();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!referenceValid || !amountValid || !dateValid || submitting) return;

    setSubmitting(true);
    setError(null);
    const data = new FormData(event.currentTarget);
    data.set("purpose", contribution.purpose);
    if (contribution.projectSlug)
      data.set("projectSlug", contribution.projectSlug);
    data.set("frequency", contribution.frequency);
    // Con 2 decimales, como lo exige el esquema y como se le mostró al donante.
    data.set("amountUsd", contribution.amountUsd.toFixed(2));
    data.set("name", contribution.name);
    data.set("email", contribution.email);
    data.set("method", method.id);
    if (receipt) data.set("receipt", receipt);
    else data.delete("receipt");

    try {
      const result = await reportManualPayment(data);
      if (result.ok) {
        onReported();
        return;
      }
      setError(result.error);
    } catch {
      setError("server_error");
    }
    setSubmitting(false);
  }

  return (
    <div>
      <p className={cn(HINT_CLASSES, "mb-2")}>{method.hint}</p>

      <div className="mb-3 rounded-sm border border-border p-2">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <p className={HINT_CLASSES}>Monto a pagar</p>
          <div className="flex items-center gap-0.5">
            <p className="font-heading text-16 font-bold leading-body">
              {method.amountDue != null
                ? formatAmount(method.amountDue, method.currency)
                : `${formatAmount(contribution.amountUsd, "USD")} (al cambio del día)`}
            </p>
            {method.amountDue != null && (
              <CopyButton value={String(method.amountDue)} label="Monto" />
            )}
          </div>
        </div>
        {method.currency !== "USD" &&
          method.currency !== "USDT" &&
          method.exchangeRate && (
            <p className="mb-1.5 text-right font-body text-11 leading-body text-muted-foreground">
              Tasa {method.currency === "VES" ? "BCV" : "del día"}:{" "}
              {formatAmount(method.exchangeRate, method.currency)} por USD
            </p>
          )}
        <dl className="m-0 grid gap-1">
          {method.details.map((detail) => (
            <div
              key={detail.label}
              className="flex items-center justify-between gap-2"
            >
              <dt className={HINT_CLASSES}>{detail.label}</dt>
              <dd className="m-0 flex min-w-0 items-center gap-0.5">
                <span className="text-right font-body text-13 font-medium leading-body wrap-anywhere">
                  {detail.value}
                </span>
                {detail.copyable && (
                  <CopyButton value={detail.value} label={detail.label} />
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-3">
        <h3 className="font-body text-12 font-medium leading-body">
          Cuando hayas pagado, repórtalo aquí
        </h3>

        {/* Honeypot anti-spam: oculto para personas y lectores de pantalla. */}
        <div
          aria-hidden="true"
          className="absolute -left-2500 size-px overflow-hidden"
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </div>

        {/* Referencia + comprobante en la misma fila, a la altura de la caja
            (la etiqueta va encima, D114); el texto completo del botón queda
            en aria-label. */}
        <Field
          label="Referencia"
          required
          description={method.referenceHint}
          error={
            touched && !referenceValid
              ? "Ingresa la referencia: letras o números (puede llevar guiones o puntos)."
              : undefined
          }
        >
          {(control) => (
            <div className="flex items-start gap-1.5">
              <Input
                {...control}
                name="reference"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="flex-1"
              />
              <Button
                variant="action"
                onClick={() => fileInputRef.current?.click()}
                aria-label={
                  receipt
                    ? `Cambiar comprobante (${receipt.name})`
                    : "Adjuntar comprobante (opcional)"
                }
                aria-describedby={receipt ? `${fileInputId}-name` : undefined}
                className="whitespace-nowrap text-12"
              >
                <Paperclip className="size-5" aria-hidden="true" />
                {receipt ? "Cambiar" : "Comprobante"}
              </Button>
            </div>
          )}
        </Field>
        {/* El input real queda fuera del orden de tabulación y del árbol
            accesible: el botón de arriba es el único control visible. */}
        <input
          ref={fileInputRef}
          type="file"
          hidden
          tabIndex={-1}
          aria-hidden="true"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0] ?? null;
            // Mismo límite que el servidor; más grande, el servidor ni
            // siquiera recibe la petición y el error sería engañoso.
            if (file && file.size > MAX_RECEIPT_BYTES) {
              setReceipt(null);
              setError("invalid_receipt");
              e.target.value = "";
              return;
            }
            setError(null);
            setReceipt(file);
          }}
        />
        {receipt && (
          <p
            id={`${fileInputId}-name`}
            className="-mt-1.5 font-body text-11 leading-body text-muted-foreground wrap-anywhere"
          >
            Comprobante: {receipt.name}
          </p>
        )}

        {/* Mismo calendario que el formulario de proyectos; no se puede
            elegir una fecha futura. */}
        <input type="hidden" name="paidAt" value={paidAt} />
        <DateField
          label="Fecha del pago"
          value={paidAt}
          onChange={setPaidAt}
          max={todayIso()}
          error={touched && !dateValid}
          helperText="Elige una fecha válida."
        />
        <Field
          label={`Monto pagado (${method.currency === "VES" ? "Bs" : method.currency})`}
          required
          error={
            touched && !amountValid
              ? "Ingresa el monto que pagaste."
              : undefined
          }
        >
          <Input
            name="amountPaid"
            type="number"
            required
            min={0}
            step="0.01"
            inputMode="decimal"
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
          />
        </Field>

        {error && (
          <Alert severity="error" className={ALERT_CLASSES}>
            {REPORT_ERROR_TEXT[error]}
          </Alert>
        )}

        <Button
          type="submit"
          color="secondary"
          className="w-full"
          disabled={submitting}
        >
          {submitting ? "Enviando…" : "Enviar reporte de pago"}
        </Button>
      </form>
    </div>
  );
}

export function PaymentStep({
  contribution,
  summary,
  width,
  onBack,
  onReported,
}: PaymentStepProps) {
  const groupName = useId();
  const [methods, setMethods] = useState<CheckoutMethod[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<CheckoutMethod["id"] | null>(
    null,
  );
  const [attempt, setAttempt] = useState(0);
  const backRef = useRef<HTMLButtonElement>(null);

  // El botón que abrió este paso desaparece (el formulario queda oculto):
  // sin esto el foco caería al <body> y un lector de pantalla perdería el hilo.
  useEffect(() => {
    backRef.current?.focus();
  }, []);

  const { amountUsd, frequency } = contribution;

  // biome-ignore lint/correctness/useExhaustiveDependencies: `attempt` no se lee adentro, pero cambiarlo es lo que dispara el botón "Reintentar".
  useEffect(() => {
    let cancelled = false;
    setMethods(null);
    setLoadError(null);
    getCheckoutOptions({ amountUsd, frequency })
      .then((result) => {
        if (cancelled) return;
        if (result.ok) setMethods(result.data);
        else
          setLoadError(
            result.error === "not_configured"
              ? "Los pagos todavía no están habilitados."
              : result.error === "invalid_input"
                ? "El monto debe estar entre US$ 1 y US$ 10.000. Vuelve atrás y corrígelo."
                : "No pudimos cargar los métodos de pago.",
          );
      })
      .catch(() => {
        if (!cancelled) setLoadError("No pudimos cargar los métodos de pago.");
      });
    return () => {
      cancelled = true;
    };
  }, [amountUsd, frequency, attempt]);

  const selected = methods?.find((m) => m.id === selectedId) ?? null;

  return (
    <DonationFormCard width={width}>
      <div className="mb-3 flex items-center gap-1">
        {/* El `Button size="small" color="inherit"` de MUI: hereda el color
            del texto y resalta con el gris de acción. */}
        <Button
          ref={backRef}
          onClick={onBack}
          variant="text"
          size="small"
          className="-ml-1 text-12 text-inherit hover:bg-accent hover:text-inherit"
        >
          <ArrowLeft className="size-4.5" aria-hidden="true" />
          Volver
        </Button>
      </div>

      <div className="mb-4 border-b border-border pb-4 text-center">
        <p className="font-heading text-32 font-extrabold leading-body">
          {formatAmount(amountUsd, "USD")}
        </p>
        <p className={cn(HINT_CLASSES, "mt-0.25")}>{summary}</p>
      </div>

      <p
        id={`${groupName}-label`}
        className="mb-2 font-body text-12 font-medium leading-body"
      >
        Método de pago
      </p>

      {!methods && !loadError && (
        <output className="flex justify-center py-4">
          <LoaderCircle
            className="size-6 animate-spin text-secondary"
            aria-hidden="true"
          />
          <span className="sr-only">Cargando métodos de pago</span>
        </output>
      )}

      {loadError && (
        <Alert severity="error" className={ALERT_CLASSES}>
          <div className="flex items-center justify-between gap-2">
            <span>{loadError}</span>
            <Button
              variant="text"
              size="small"
              className="shrink-0 text-inherit hover:bg-accent hover:text-inherit"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Reintentar
            </Button>
          </div>
        </Alert>
      )}

      {methods && (
        <>
          {frequency === "monthly" && (
            <p className={cn(HINT_CLASSES, "mb-2")}>
              Los aportes mensuales solo se pueden hacer con PayPal o tarjeta,
              que cobran automáticamente cada mes.
            </p>
          )}
          {methods.length === 0 ? (
            <Alert severity="info" className={ALERT_CLASSES}>
              {frequency === "monthly"
                ? "El aporte mensual todavía no está disponible. Puedes hacer un aporte de única vez."
                : "No hay métodos de pago disponibles en este momento."}
            </Alert>
          ) : (
            <div
              role="radiogroup"
              aria-labelledby={`${groupName}-label`}
              className={cn(
                "grid grid-cols-1 gap-1.5 sm:grid-cols-2",
                selected && "mb-4",
              )}
            >
              {methods.map((method) => (
                <MethodOption
                  key={method.id}
                  method={method}
                  name={groupName}
                  checked={selectedId === method.id}
                  onSelect={() => setSelectedId(method.id)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <AnimatedHeight>
        {selected && selected.kind === "gateway" && (
          <div className="border-t border-border pt-4">
            <GatewayPanel
              key={selected.id}
              method={selected}
              contribution={contribution}
            />
          </div>
        )}

        {selected && selected.kind === "manual" && (
          <div className="border-t border-border pt-4">
            {/* `key`: al cambiar de método se reinicia el formulario de reporte. */}
            <ManualPaymentPanel
              key={selected.id}
              method={selected}
              contribution={contribution}
              onReported={onReported}
            />
          </div>
        )}
      </AnimatedHeight>
    </DonationFormCard>
  );
}
