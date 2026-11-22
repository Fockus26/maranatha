"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeftRight, Banknote, Check, ReceiptText, X } from "lucide-react";
import Link from "next/link";
import { type FormEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  type AdminActionError,
  approvePayment,
  getReceiptLink,
  rejectPayment,
  saveFallbackRates,
} from "@/app/actions/adminPayments";
import { DASHBOARD_CONTENT_CLASS } from "@/components/layout/DashboardShell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PanelVersion } from "@/lib/panelFreshness";
import {
  formatAmount,
  METHOD_LABEL,
  PURPOSE_LABEL,
  STATUS_LABEL,
} from "@/lib/payments/labels";
import {
  FALLBACK_RATE_RANGE,
  type PaymentCurrency,
  type PaymentFrequency,
  type PaymentMethodId,
  type PaymentPurpose,
  type PaymentStatus,
} from "@/lib/payments/schema";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardStatBand } from "./DashboardStatBand";
import { EmptyState } from "./EmptyState";
import { PanelFreshness } from "./PanelFreshness";

// Patrón de animación de listas (D087).
const LIST_EASE = [0.2, 0.8, 0.2, 1] as const;
const LIST_DURATION = 0.28;
const LIST_SHIFT = 8;
const LIST_STAGGER = 0.03;
const LIST_STAGGER_MAX = 0.2;

/**
 * Panel de pagos del dashboard. Recibe los datos ya leídos en el servidor
 * (`app/dashboard/(panel)/pagos/page.tsx`); las acciones son Server Actions
 * que re-verifican al admin y revalidan la ruta, así que la lista se
 * actualiza sola después de aprobar o rechazar.
 *
 * Migrado a shadcn (D136): los dos diálogos (rechazo y tasas) sobre `dialog`,
 * los avisos con `toast()` de sonner y los campos con `Field` + `Input`. Las
 * acciones del servidor y cuándo se llaman no cambian.
 */

export type PaymentFilter = PaymentStatus | "all";

export type RatePair = { VES: number | null; COP: number | null };

export interface DashboardPaymentRow {
  id: string;
  createdAt: string;
  purpose: PaymentPurpose;
  projectTitle: string | null;
  frequency: PaymentFrequency;
  method: PaymentMethodId;
  status: PaymentStatus;
  amountUsd: number;
  amountPaid: number | null;
  currency: PaymentCurrency;
  exchangeRate: number | null;
  donorName: string;
  donorEmail: string;
  reference: string | null;
  paidAt: string | null;
  hasReceipt: boolean;
  reviewedBy: string | null;
  notes: string | null;
}

/**
 * Pago por pasarela (PayPal, o Binance Pay Merchant): se confirma solo, el
 * admin no lo aprueba. Los manuales siempre llevan la referencia que reportó
 * el donante; los de pasarela nunca.
 */
function isGatewayRow(row: Pick<DashboardPaymentRow, "reference">): boolean {
  return row.reference === null;
}

export interface DashboardPaymentsProps {
  filter: PaymentFilter;
  rows: DashboardPaymentRow[];
  /** Página actual (desde 1), tamaño de página y total del filtro. */
  page: number;
  pageSize: number;
  total: number;
  loadError: boolean;
  stats: {
    pendingCount: number;
    confirmedThisMonthUsd: number;
    confirmedThisMonthCount: number;
  } | null;
  /** Tasas de DolarApi (null si no respondió). */
  liveRates: RatePair;
  /** Tasas de respaldo guardadas por el admin. */
  fallbackRates: RatePair;
  /** Versión de los datos con la que se renderizó (D104); null si no se leyó. */
  version: PanelVersion | null;
}

const FILTER_LABEL: Record<PaymentFilter, string> = {
  pending: "Pendientes",
  confirmed: "Confirmados",
  rejected: "Rechazados",
  cancelled: "Cancelados",
  all: "Todos",
};
const FILTER_ORDER: PaymentFilter[] = [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
  "all",
];

const ACTION_ERROR_TEXT: Record<AdminActionError, string> = {
  unauthorized: "Tu sesión expiró. Vuelve a iniciar sesión.",
  invalid_input: "Datos inválidos.",
  not_found: "No se encontró el pago o su comprobante.",
  already_processed: "Este pago ya fue procesado por otra persona.",
  server_error: "No se pudo completar la acción. Prueba de nuevo.",
};

/**
 * La Server Action no respondió (red caída o 500). Sin esto la excepción sube
 * al error boundary y reemplaza todo el panel. Puede que el servidor sí la
 * haya procesado: por eso se pide revisar la lista antes de repetir.
 */
const NETWORK_ERROR_TEXT =
  "No hubo respuesta del servidor. Revisa tu conexión y la lista antes de intentarlo de nuevo.";

/** Llama a la Server Action y convierte un fallo de red en `null`. */
async function callAction<T>(action: () => Promise<T>): Promise<T | null> {
  try {
    return await action();
  } catch {
    return null;
  }
}

/** Aviso de resultado (antes `Snackbar` + `Alert filled`): éxito o error. */
function notify(message: string, ok: boolean) {
  if (ok) toast.success(message);
  else toast.error(message);
}

function formatUsd(value: number) {
  return formatAmount(value, "USD");
}

function formatDate(iso: string, withTime = false) {
  // Fechas sin hora (`YYYY-MM-DD`) se interpretan en UTC para no correrse un día.
  const date = iso.length === 10 ? new Date(`${iso}T12:00:00Z`) : new Date(iso);
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

/**
 * Monto esperado en la moneda del método (USD × tasa registrada) cuando lo
 * reportado se aleja más de un 2% — el donante declara el monto en USD y lo
 * pagado por separado, y el admin aprueba el monto en USD: una diferencia
 * grande puede ser un error o un intento de inflar lo recaudado.
 */
function expectedIfMismatch(row: DashboardPaymentRow): number | null {
  if (row.amountPaid == null) return null;
  const rate =
    row.currency === "USD" || row.currency === "USDT" ? 1 : row.exchangeRate;
  if (!rate) return null;
  const expected = row.amountUsd * rate;
  return Math.abs(row.amountPaid - expected) / expected > 0.02
    ? expected
    : null;
}

const STATUS_CLASS: Record<PaymentStatus, string> = {
  // "Pendiente" en ámbar para no confundirse con el gris de "Cancelado"
  // (design-qa fase 09). gray[900] sobre warning: 9.6:1.
  pending: "bg-warning text-gray-900",
  confirmed: "bg-success-filled text-white",
  rejected: "bg-destructive text-destructive-foreground",
  cancelled: "bg-accent text-muted-foreground",
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={cn(
        "inline-block rounded-pill px-1.25 py-0.25 text-11 font-semibold whitespace-nowrap",
        STATUS_CLASS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Dato de la tarjeta (`<dt>` + `<dd>`). */
function DetailField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="mb-0.25 text-11 leading-body text-muted-foreground">
        {label}
      </dt>
      <dd className="m-0 text-13 leading-body font-medium wrap-anywhere">
        {children}
      </dd>
    </div>
  );
}

/**
 * Diálogo abierto sin `DialogTrigger` (desde un botón de la fila o de la
 * cabecera): guarda quién lo abrió y le devuelve el foco al cerrar (D129).
 */
function useOpenerFocus() {
  const openerRef = useRef<HTMLElement | null>(null);
  return {
    onOpenAutoFocus: () => {
      openerRef.current = document.activeElement as HTMLElement | null;
    },
    onCloseAutoFocus: (event: Event) => {
      event.preventDefault();
      openerRef.current?.focus();
    },
  };
}

function RejectDialog({
  row,
  pending,
  onClose,
  onConfirm,
}: {
  row: DashboardPaymentRow | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note: string) => void;
}) {
  const [note, setNote] = useState("");
  const focus = useOpenerFocus();
  return (
    <Dialog
      open={Boolean(row)}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        onOpenAutoFocus={focus.onOpenAutoFocus}
        onCloseAutoFocus={(event) => {
          setNote("");
          focus.onCloseAutoFocus(event);
        }}
        onEscapeKeyDown={(e) => {
          if (pending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <DialogTitle>Rechazar pago</DialogTitle>
        <DialogDescription className="mb-2">
          {row && (
            <>
              El reporte de <strong>{row.donorName}</strong> por{" "}
              {formatUsd(row.amountUsd)} (ref. {row.reference}) quedará como
              rechazado y no sumará a lo recaudado.
            </>
          )}
        </DialogDescription>
        <Field label="Motivo (opcional)">
          <Textarea
            className="max-h-30 min-h-10"
            rows={1}
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Field>
        <DialogFooter className="mt-3">
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => onConfirm(note)}
            disabled={pending}
          >
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Tasas de cambio: muestra cuál está en uso para cada moneda (DolarApi o el
 * respaldo) y permite guardar el respaldo. Tras guardar se ve de inmediato la
 * tasa de respaldo que se aplicará si DolarApi no responde.
 */
function RatesDialog({
  open,
  onClose,
  liveRates,
  fallbackRates,
  onResult,
}: {
  open: boolean;
  onClose: () => void;
  liveRates: RatePair;
  fallbackRates: RatePair;
  onResult: (message: string, ok: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<RatePair | null>(null);
  const focus = useOpenerFocus();
  // Tras guardar, lo guardado manda hasta que el servidor re-renderice.
  const fallback = saved ?? fallbackRates;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next: RatePair = {
      VES: data.get("VES") ? Number(data.get("VES")) : null,
      COP: data.get("COP") ? Number(data.get("COP")) : null,
    };
    startTransition(async () => {
      const result = await callAction(() => saveFallbackRates(data));
      if (!result) {
        onResult(NETWORK_ERROR_TEXT, false);
        return;
      }
      if (result.ok) setSaved(next);
      onResult(
        result.ok
          ? "Tasas de respaldo guardadas."
          : result.error === "invalid_input"
            ? `Revisa las tasas: Bs. entre ${FALLBACK_RATE_RANGE.VES.min} y ${FALLBACK_RATE_RANGE.VES.max.toLocaleString("es-VE")}, COP entre ${FALLBACK_RATE_RANGE.COP.min} y ${FALLBACK_RATE_RANGE.COP.max.toLocaleString("es-VE")} por USD.`
            : ACTION_ERROR_TEXT[result.error],
        result.ok,
      );
    });
  }

  const currencies: { currency: "VES" | "COP"; label: string }[] = [
    { currency: "VES", label: "Bolívares (Pago Móvil)" },
    { currency: "COP", label: "Pesos colombianos (Bancolombia)" },
  ];

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-page-sm"
        onOpenAutoFocus={focus.onOpenAutoFocus}
        onCloseAutoFocus={focus.onCloseAutoFocus}
      >
        <DialogTitle>Tasas de cambio</DialogTitle>
        <DialogDescription className="mb-3 text-13">
          Se usan para mostrarle al donante cuánto pagar en bolívares o pesos.
          Primero se consulta DolarApi (tasa BCV y la cotización en Colombia);
          la tasa de respaldo solo se usa si DolarApi no responde.
        </DialogDescription>

        <dl className="m-0 mb-3 grid gap-1.5 rounded-sm border border-border p-2">
          {currencies.map(({ currency, label }) => {
            const live = liveRates[currency];
            const inUse = live ?? fallback[currency];
            return (
              <div
                key={currency}
                className="flex flex-wrap justify-between gap-2"
              >
                <dt className="text-13 leading-body">{label}</dt>
                <dd className="m-0 text-right text-13 leading-body font-semibold">
                  {inUse ? formatAmount(inUse, currency) : "Sin tasa"} por USD
                  <span className="block text-11 font-normal text-muted-foreground">
                    {live
                      ? "En uso: DolarApi"
                      : fallback[currency]
                        ? "En uso: respaldo (DolarApi no responde)"
                        : "Sin DolarApi ni respaldo: se muestra el monto en USD"}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>

        <form
          id="rates-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-2 sm:grid-cols-2"
        >
          <Field label="Respaldo Bs. por USD">
            <Input
              name="VES"
              // "text": con "number" el navegador muestra su propia burbuja
              // ("valores válidos 0 y 0,0001") y convierte "0x10" en "010"; así
              // el valor llega tal cual y el servidor responde con el rango.
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={fallbackRates.VES ?? ""}
            />
          </Field>
          <Field label="Respaldo COP por USD">
            <Input
              name="COP"
              // "text": con "number" el navegador muestra su propia burbuja
              // ("valores válidos 0 y 0,0001") y convierte "0x10" en "010"; así
              // el valor llega tal cual y el servidor responde con el rango.
              type="text"
              inputMode="decimal"
              autoComplete="off"
              defaultValue={fallbackRates.COP ?? ""}
            />
          </Field>
        </form>
        <output className="mt-2 block text-12 text-muted-foreground">
          Respaldo guardado:{" "}
          {fallback.VES ? formatAmount(fallback.VES, "VES") : "sin Bs."} ·{" "}
          {fallback.COP ? formatAmount(fallback.COP, "COP") : "sin COP"} por
          USD.
        </output>
        <DialogFooter className="mt-3">
          <Button
            variant="text"
            color="inherit"
            onClick={onClose}
            disabled={pending}
          >
            Cerrar
          </Button>
          <Button
            type="submit"
            form="rates-form"
            variant="contained"
            color="secondary"
            disabled={pending}
          >
            {pending ? "Guardando…" : "Guardar respaldo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function paymentsHref(filter: PaymentFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== "pending") params.set("estado", filter);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `/dashboard/pagos?${query}` : "/dashboard/pagos";
}

/** "Mostrando 51–100 de 232" + anterior / siguiente. */
function PaymentsPagination({
  filter,
  page,
  pageSize,
  shown,
  total,
}: {
  filter: PaymentFilter;
  page: number;
  pageSize: number;
  shown: number;
  total: number;
}) {
  const first = (page - 1) * pageSize + 1;
  const last = first + shown - 1;
  const hasPrev = page > 1;
  const hasNext = last < total;
  // Página fuera de rango (vacía): "Anterior" lleva a la última que tiene filas.
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = shown > 0 ? page - 1 : Math.min(page - 1, lastPage);
  return (
    <nav
      aria-label="Páginas de pagos"
      className="mt-3 flex flex-wrap items-center justify-between gap-2"
    >
      <p className="text-13 leading-body text-muted-foreground">
        {shown > 0
          ? `Mostrando ${first}–${last} de ${total}`
          : `Esta página está vacía; hay ${total} en total.`}
      </p>
      <div className="flex gap-1">
        {hasPrev ? (
          <Button asChild variant="text" color="inherit" size="small">
            <Link href={paymentsHref(filter, prevPage)}>Anterior</Link>
          </Button>
        ) : null}
        {hasNext ? (
          <Button asChild variant="outlined" color="secondary" size="small">
            <Link href={paymentsHref(filter, page + 1)}>Siguiente</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}

export function DashboardPayments({
  filter,
  rows,
  page,
  pageSize,
  total,
  loadError,
  stats,
  liveRates,
  fallbackRates,
  version,
}: DashboardPaymentsProps) {
  const reduceMotion = useReducedMotion();
  const [ratesOpen, setRatesOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [approving, setApproving] = useState<DashboardPaymentRow | null>(null);
  const [rejecting, setRejecting] = useState<DashboardPaymentRow | null>(null);

  function handleApprove() {
    const row = approving;
    if (!row) return;
    startTransition(async () => {
      const result = await callAction(() => approvePayment(row.id));
      // El diálogo queda abierto: el admin puede reintentar sin buscar la fila.
      if (!result) {
        notify(NETWORK_ERROR_TEXT, false);
        return;
      }
      setApproving(null);
      notify(
        result.ok
          ? `Pago de ${row.donorName} confirmado.`
          : ACTION_ERROR_TEXT[result.error],
        result.ok,
      );
    });
  }

  function handleReject(note: string) {
    const row = rejecting;
    if (!row) return;
    startTransition(async () => {
      const result = await callAction(() => rejectPayment(row.id, note));
      if (!result) {
        notify(NETWORK_ERROR_TEXT, false);
        return;
      }
      setRejecting(null);
      notify(
        result.ok
          ? `Pago de ${row.donorName} rechazado.`
          : ACTION_ERROR_TEXT[result.error],
        result.ok,
      );
    });
  }

  function handleReceipt(row: DashboardPaymentRow) {
    // La ventana se abre en el mismo gesto del clic (si se abre después del
    // await, los bloqueadores de popups la cancelan) y luego se le asigna la URL.
    const win = window.open("", "_blank");
    startTransition(async () => {
      const result = await callAction(() => getReceiptLink(row.id));
      if (!result) {
        win?.close();
        notify(NETWORK_ERROR_TEXT, false);
        return;
      }
      if (result.ok && win) {
        win.opener = null;
        win.location.href = result.data;
      } else {
        win?.close();
        notify(
          result.ok
            ? "El navegador bloqueó la ventana."
            : ACTION_ERROR_TEXT[result.error],
          false,
        );
      }
    });
  }

  return (
    <>
      <PanelFreshness scope="payments" version={version} />
      <DashboardStatBand
        stats={[
          {
            label: "Pendientes de verificar",
            value: stats ? String(stats.pendingCount) : "—",
            accent: true,
          },
          {
            label: "Confirmado este mes",
            value: stats ? formatUsd(stats.confirmedThisMonthUsd) : "—",
          },
          {
            label: "Aportes confirmados este mes",
            value: stats ? String(stats.confirmedThisMonthCount) : "—",
          },
        ]}
      />

      <div className={cn(DASHBOARD_CONTENT_CLASS, "pt-8 pb-5 md:pt-12")}>
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1 basis-80">
            <h1 className="mb-0.5 font-heading text-26 font-extrabold text-foreground">
              Pagos
            </h1>
            <p className="text-13 leading-body text-muted-foreground">
              Verifica cada reporte contra tu banco o app antes de confirmarlo.
              Solo los pagos confirmados suman a lo recaudado.
            </p>
          </div>
          <Button
            variant="action"
            size="small"
            onClick={() => setRatesOpen(true)}
          >
            <ArrowLeftRight aria-hidden="true" className="size-4.5" />
            Tasas de cambio
          </Button>
        </div>

        <nav
          aria-label="Filtrar pagos por estado"
          className="mb-3 flex flex-wrap gap-1 max-md:gap-y-4"
        >
          {FILTER_ORDER.map((f) => {
            const active = f === filter;
            return (
              <Link
                key={f}
                href={
                  f === "pending"
                    ? "/dashboard/pagos"
                    : `/dashboard/pagos?estado=${f}`
                }
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-pill border px-2 py-0.75 text-13 leading-body font-medium no-underline hover:text-foreground max-md:tap-target",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
                  active
                    ? "border-secondary bg-secondary-300/13 text-foreground"
                    : "border-border bg-transparent text-muted-foreground",
                )}
              >
                {FILTER_LABEL[f]}
              </Link>
            );
          })}
        </nav>

        {loadError ? (
          <Alert severity="error">
            No se pudieron cargar los pagos. Revisa la conexión con la base de
            datos.
          </Alert>
        ) : (
          <>
            {rows.length === 0 && (
              <motion.div
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : LIST_DURATION,
                  delay: reduceMotion ? 0 : LIST_DURATION,
                  ease: LIST_EASE,
                }}
              >
                <EmptyState
                  icon={Banknote}
                  title={
                    filter === "pending"
                      ? "No hay pagos pendientes"
                      : "No hay pagos en esta vista"
                  }
                  description={
                    filter === "pending"
                      ? "Cuando alguien reporte un pago manual, aparecerá acá para que lo verifiques."
                      : undefined
                  }
                />
              </motion.div>
            )}
            <ul
              aria-label={`Pagos: ${FILTER_LABEL[filter].toLowerCase()}`}
              aria-hidden={rows.length === 0 || undefined}
              className="relative m-0 grid list-none gap-2 p-0"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {rows.map((row, index) => (
                  <motion.li
                    key={row.id}
                    layout={!reduceMotion}
                    initial={
                      reduceMotion ? false : { opacity: 0, y: LIST_SHIFT }
                    }
                    animate={{
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: reduceMotion ? 0 : LIST_DURATION,
                        ease: LIST_EASE,
                        delay: reduceMotion
                          ? 0
                          : Math.min(index * LIST_STAGGER, LIST_STAGGER_MAX),
                      },
                    }}
                    exit={{
                      opacity: 0,
                      y: reduceMotion ? 0 : -LIST_SHIFT,
                      transition: {
                        duration: reduceMotion ? 0 : LIST_DURATION / 2,
                      },
                    }}
                    className="rounded-md border border-border bg-card p-2.5 md:p-3"
                  >
                    <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h2 className="text-15 leading-body font-bold wrap-anywhere">
                          {row.donorName}{" "}
                          <span className="text-13 font-normal text-muted-foreground">
                            · {row.donorEmail}
                          </span>
                        </h2>
                        <p className="mt-0.25 text-12 leading-body text-muted-foreground">
                          {PURPOSE_LABEL[row.purpose]}
                          {row.projectTitle ? `: ${row.projectTitle}` : ""}
                          {row.frequency === "monthly" ? " · Mensual" : ""} ·
                          Reportado {formatDate(row.createdAt, true)}
                        </p>
                        {isGatewayRow(row) && row.status === "pending" && (
                          <p className="mt-0.5 text-12 leading-body text-muted-foreground">
                            Esperando que el donante complete el pago en{" "}
                            {row.method === "binance"
                              ? "Binance Pay"
                              : "PayPal"}
                            . Se confirma solo; no hace falta verificarlo.
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-heading text-20 leading-body font-extrabold">
                          {formatUsd(row.amountUsd)}
                        </p>
                        <StatusBadge status={row.status} />
                      </div>
                    </div>

                    <dl className="m-0 grid grid-cols-2 gap-2 md:grid-cols-4">
                      <DetailField label="Método">
                        {METHOD_LABEL[row.method]}
                      </DetailField>
                      <DetailField label="Monto pagado">
                        {row.amountPaid != null
                          ? formatAmount(row.amountPaid, row.currency)
                          : "—"}
                        {row.exchangeRate &&
                          row.currency !== "USD" &&
                          row.currency !== "USDT" && (
                            <span className="block text-11 font-normal text-muted-foreground">
                              Tasa{" "}
                              {formatAmount(row.exchangeRate, row.currency)}
                            </span>
                          )}
                        {expectedIfMismatch(row) != null && (
                          <span className="block text-11 font-semibold text-destructive">
                            ⚠ No coincide: se esperaba ≈{" "}
                            {formatAmount(
                              expectedIfMismatch(row) ?? 0,
                              row.currency,
                            )}
                          </span>
                        )}
                      </DetailField>
                      <DetailField label="Referencia">
                        {row.reference ?? "—"}
                      </DetailField>
                      <DetailField label="Fecha del pago">
                        {row.paidAt ? formatDate(row.paidAt) : "—"}
                      </DetailField>
                    </dl>

                    {(row.reviewedBy || row.notes) &&
                      row.status !== "pending" && (
                        <p className="mt-2 text-12 leading-body text-muted-foreground">
                          {STATUS_LABEL[row.status]} por {row.reviewedBy ?? "—"}
                          {row.notes ? ` · Nota: ${row.notes}` : ""}
                        </p>
                      )}

                    {(row.hasReceipt ||
                      (row.status === "pending" && !isGatewayRow(row))) && (
                      <div className="mt-2.5 flex flex-wrap gap-1 border-t border-border pt-2.5">
                        {row.hasReceipt && (
                          <Button
                            variant="action"
                            size="small"
                            onClick={() => handleReceipt(row)}
                            disabled={pending}
                            aria-label={`Ver comprobante de ${row.donorName}`}
                          >
                            <ReceiptText
                              aria-hidden="true"
                              className="size-4.5"
                            />
                            Ver comprobante
                          </Button>
                        )}
                        {row.status === "pending" && !isGatewayRow(row) && (
                          <>
                            <div className="flex-1" />
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => setRejecting(row)}
                              disabled={pending}
                              aria-label={`Rechazar pago de ${row.donorName}`}
                            >
                              <X aria-hidden="true" className="size-4.5" />
                              Rechazar
                            </Button>
                            <Button
                              variant="contained"
                              color="secondary"
                              size="small"
                              onClick={() => setApproving(row)}
                              disabled={pending}
                              aria-label={`Confirmar pago de ${row.donorName}`}
                            >
                              <Check aria-hidden="true" className="size-4.5" />
                              Confirmar
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </>
        )}
        {!loadError && total > rows.length ? (
          <PaymentsPagination
            filter={filter}
            page={page}
            pageSize={pageSize}
            shown={rows.length}
            total={total}
          />
        ) : null}
      </div>

      <RatesDialog
        open={ratesOpen}
        onClose={() => setRatesOpen(false)}
        liveRates={liveRates}
        fallbackRates={fallbackRates}
        onResult={notify}
      />

      <ConfirmDialog
        open={Boolean(approving)}
        title="Confirmar pago"
        description={
          approving ? (
            <>
              ¿Verificaste en tu {METHOD_LABEL[approving.method]} el pago de{" "}
              <strong>{approving.donorName}</strong> (ref. {approving.reference}
              ) por{" "}
              {approving.amountPaid != null
                ? formatAmount(approving.amountPaid, approving.currency)
                : formatUsd(approving.amountUsd)}
              ? Se sumarán {formatUsd(approving.amountUsd)} a lo recaudado.
              {expectedIfMismatch(approving) != null && (
                <span className="mt-1.5 block font-semibold text-destructive">
                  ⚠ Lo pagado no coincide con el monto declarado (se esperaba ≈{" "}
                  {formatAmount(
                    expectedIfMismatch(approving) ?? 0,
                    approving.currency,
                  )}
                  ). Si no corresponde, recházalo con el motivo para que el
                  donante lo reporte de nuevo.
                </span>
              )}
            </>
          ) : (
            ""
          )
        }
        confirmLabel="Sí, confirmar"
        onConfirm={handleApprove}
        onClose={() => setApproving(null)}
        pending={pending}
      />

      <RejectDialog
        row={rejecting}
        pending={pending}
        onClose={() => (pending ? undefined : setRejecting(null))}
        onConfirm={handleReject}
      />
    </>
  );
}
