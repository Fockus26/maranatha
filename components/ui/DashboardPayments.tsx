"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsRounded";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { type FormEvent, useState, useTransition } from "react";
import {
  type AdminActionError,
  approvePayment,
  getReceiptLink,
  rejectPayment,
  saveFallbackRates,
} from "@/app/actions/adminPayments";
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
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import {
  common,
  fontScale,
  gray,
  radius,
  semantic,
  typography,
} from "@/theme/tokens";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardStatBand } from "./DashboardStatBand";
import { EmptyState } from "./EmptyState";

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

function StatusBadge({ status }: { status: PaymentStatus }) {
  const theme = useTheme();
  const colors: Record<PaymentStatus, { bg: string; fg: string }> = {
    // "Pendiente" en ámbar para no confundirse con el gris de "Cancelado"
    // (design-qa fase 09). gray[900] sobre warning: 9.6:1.
    pending: { bg: semantic.warning, fg: gray[900] },
    confirmed: { bg: semantic.successFilled, fg: common.white },
    rejected: {
      bg: theme.palette.error.main,
      fg: theme.palette.error.contrastText,
    },
    cancelled: {
      bg: theme.palette.action.hover,
      fg: theme.palette.text.secondary,
    },
  };
  return (
    <Box
      component="span"
      sx={{
        display: "inline-block",
        fontSize: fontScale[11],
        fontWeight: 600,
        borderRadius: `${radius.pill}px`,
        px: 1.25,
        py: 0.25,
        bgcolor: colors[status].bg,
        color: colors[status].fg,
        whiteSpace: "nowrap",
      }}
    >
      {STATUS_LABEL[status]}
    </Box>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        component="dt"
        sx={{ fontSize: fontScale[11], color: "text.secondary", mb: 0.25 }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{
          m: 0,
          fontSize: fontScale[13],
          fontWeight: 500,
          overflowWrap: "anywhere",
        }}
      >
        {children}
      </Typography>
    </Box>
  );
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
  return (
    <Dialog
      open={Boolean(row)}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: { elevation: 0 },
        transition: { onExited: () => setNote("") },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, px: 3.5, pt: 3.5, pb: 1 }}>
        Rechazar pago
      </DialogTitle>
      <DialogContent sx={{ px: 3.5, pb: 1 }}>
        <DialogContentText sx={{ mb: 2 }}>
          {row && (
            <>
              El reporte de <strong>{row.donorName}</strong> por{" "}
              {formatUsd(row.amountUsd)} (ref. {row.reference}) quedará como
              rechazado y no sumará a lo recaudado.
            </>
          )}
        </DialogContentText>
        <TextField
          label="Motivo (opcional)"
          sx={SMALL_FIELD_SX}
          fullWidth
          size="small"
          multiline
          maxRows={5}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          slotProps={{ htmlInput: { maxLength: 500 } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={pending}>
          Cancelar
        </Button>
        <Button
          onClick={() => onConfirm(note)}
          variant="contained"
          color="error"
          disabled={pending}
        >
          Rechazar
        </Button>
      </DialogActions>
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
  const theme = useTheme();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<RatePair | null>(null);
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
      onClose={pending ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="rates-dialog-title"
      slotProps={{ paper: { elevation: 0 } }}
    >
      <DialogTitle
        id="rates-dialog-title"
        sx={{ fontWeight: 700, px: 3.5, pt: 3.5, pb: 1 }}
      >
        Tasas de cambio
      </DialogTitle>
      <DialogContent sx={{ px: 3.5 }}>
        <DialogContentText sx={{ fontSize: fontScale[13], mb: 3 }}>
          Se usan para mostrarle al donante cuánto pagar en bolívares o pesos.
          Primero se consulta DolarApi (tasa BCV y la cotización en Colombia);
          la tasa de respaldo solo se usa si DolarApi no responde.
        </DialogContentText>

        <Box
          component="dl"
          sx={{
            m: 0,
            mb: 3,
            display: "grid",
            gap: 1.5,
            p: 2,
            borderRadius: `${radius.sm}px`,
            border: `1px solid ${theme.palette.divider}`,
          }}
        >
          {currencies.map(({ currency, label }) => {
            const live = liveRates[currency];
            const inUse = live ?? fallback[currency];
            return (
              <Box
                key={currency}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 2,
                  flexWrap: "wrap",
                }}
              >
                <Typography component="dt" sx={{ fontSize: fontScale[13] }}>
                  {label}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    fontSize: fontScale[13],
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  {inUse ? formatAmount(inUse, currency) : "Sin tasa"} por USD
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      fontSize: fontScale[11],
                      fontWeight: 400,
                      color: "text.secondary",
                    }}
                  >
                    {live
                      ? "En uso: DolarApi"
                      : fallback[currency]
                        ? "En uso: respaldo (DolarApi no responde)"
                        : "Sin DolarApi ni respaldo: se muestra el monto en USD"}
                  </Box>
                </Typography>
              </Box>
            );
          })}
        </Box>

        <Box
          component="form"
          id="rates-form"
          onSubmit={handleSubmit}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            name="VES"
            label="Respaldo Bs. por USD"
            // "text": con "number" el navegador muestra su propia burbuja
            // ("valores válidos 0 y 0,0001") y convierte "0x10" en "010"; así
            // el valor llega tal cual y el servidor responde con el rango.
            type="text"
            size="small"
            defaultValue={fallbackRates.VES ?? ""}
            slotProps={{
              htmlInput: { inputMode: "decimal", autoComplete: "off" },
            }}
            sx={SMALL_FIELD_SX}
          />
          <TextField
            name="COP"
            label="Respaldo COP por USD"
            // "text": con "number" el navegador muestra su propia burbuja
            // ("valores válidos 0 y 0,0001") y convierte "0x10" en "010"; así
            // el valor llega tal cual y el servidor responde con el rango.
            type="text"
            size="small"
            defaultValue={fallbackRates.COP ?? ""}
            slotProps={{
              htmlInput: { inputMode: "decimal", autoComplete: "off" },
            }}
            sx={SMALL_FIELD_SX}
          />
        </Box>
        <Typography
          role="status"
          sx={{ fontSize: fontScale[12], color: "text.secondary", mt: 2 }}
        >
          Respaldo guardado:{" "}
          {fallback.VES ? formatAmount(fallback.VES, "VES") : "sin Bs."} ·{" "}
          {fallback.COP ? formatAmount(fallback.COP, "COP") : "sin COP"} por
          USD.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3.5, pb: 3, pt: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit" disabled={pending}>
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
      </DialogActions>
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
    <Box
      component="nav"
      aria-label="Páginas de pagos"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 2,
        mt: 3,
      }}
    >
      <Typography sx={{ fontSize: fontScale[13], color: "text.secondary" }}>
        {shown > 0
          ? `Mostrando ${first}–${last} de ${total}`
          : `Esta página está vacía; hay ${total} en total.`}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        {hasPrev ? (
          <Button
            component={Link}
            href={paymentsHref(filter, prevPage)}
            color="inherit"
            size="small"
          >
            Anterior
          </Button>
        ) : null}
        {hasNext ? (
          <Button
            component={Link}
            href={paymentsHref(filter, page + 1)}
            variant="outlined"
            color="secondary"
            size="small"
          >
            Siguiente
          </Button>
        ) : null}
      </Box>
    </Box>
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
}: DashboardPaymentsProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [ratesOpen, setRatesOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [approving, setApproving] = useState<DashboardPaymentRow | null>(null);
  const [rejecting, setRejecting] = useState<DashboardPaymentRow | null>(null);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(
    null,
  );

  function notify(message: string, ok: boolean) {
    setToast({ message, ok });
  }

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

      <Box
        sx={{
          px: { xs: 3, md: 5 },
          pt: { xs: "32px", md: "48px" },
          pb: 5,
          maxWidth: 1400,
          mx: "auto",
        }}
      >
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 0, flex: "1 1 320px" }}>
            <Typography
              component="h1"
              sx={{
                fontFamily: typography.fontFamily.heading,
                fontWeight: 800,
                fontSize: fontScale[26],
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Pagos
            </Typography>
            <Typography
              sx={{
                fontSize: fontScale[13],
                color: theme.palette.text.secondary,
              }}
            >
              Verifica cada reporte contra tu banco o app antes de confirmarlo.
              Solo los pagos confirmados suman a lo recaudado.
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<CurrencyExchangeRoundedIcon fontSize="small" />}
            onClick={() => setRatesOpen(true)}
          >
            Tasas de cambio
          </Button>
        </Box>

        <Box
          component="nav"
          aria-label="Filtrar pagos por estado"
          sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}
        >
          {FILTER_ORDER.map((f) => {
            const active = f === filter;
            return (
              <Box
                key={f}
                component={Link}
                href={
                  f === "pending"
                    ? "/dashboard/pagos"
                    : `/dashboard/pagos?estado=${f}`
                }
                aria-current={active ? "page" : undefined}
                sx={{
                  px: 2,
                  py: 0.75,
                  borderRadius: `${radius.pill}px`,
                  fontSize: fontScale[13],
                  fontWeight: 500,
                  textDecoration: "none",
                  border: `1px solid ${active ? theme.palette.secondary.main : theme.palette.divider}`,
                  color: active
                    ? theme.palette.text.primary
                    : theme.palette.text.secondary,
                  bgcolor: active
                    ? `${theme.palette.secondary.light}22`
                    : "transparent",
                  "&:hover": { color: theme.palette.text.primary },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.palette.secondary.main}`,
                    outlineOffset: 2,
                  },
                }}
              >
                {FILTER_LABEL[f]}
              </Box>
            );
          })}
        </Box>

        {loadError ? (
          <Alert severity="error" role="alert">
            No se pudieron cargar los pagos. Revisa la conexión con la base de
            datos.
          </Alert>
        ) : (
          <>
            {rows.length === 0 && (
              <Box
                component={motion.div}
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: reduceMotion ? 0 : LIST_DURATION,
                  delay: reduceMotion ? 0 : LIST_DURATION,
                  ease: LIST_EASE,
                }}
              >
                <EmptyState
                  icon={PaymentsOutlinedIcon}
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
              </Box>
            )}
            <Box
              component="ul"
              aria-label={`Pagos: ${FILTER_LABEL[filter].toLowerCase()}`}
              aria-hidden={rows.length === 0 || undefined}
              sx={{
                listStyle: "none",
                m: 0,
                p: 0,
                display: "grid",
                gap: 2,
                position: "relative",
              }}
            >
              <AnimatePresence mode="popLayout" initial={false}>
                {rows.map((row, index) => (
                  <Box
                    component={motion.li}
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
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: `${radius.md}px`,
                      bgcolor: "background.paper",
                      p: { xs: 2.5, md: 3 },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 2,
                        flexWrap: "wrap",
                        mb: 2,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          component="h2"
                          sx={{
                            fontWeight: 700,
                            fontSize: fontScale[15],
                            overflowWrap: "anywhere",
                          }}
                        >
                          {row.donorName}{" "}
                          <Box
                            component="span"
                            sx={{
                              fontWeight: 400,
                              fontSize: fontScale[13],
                              color: "text.secondary",
                            }}
                          >
                            · {row.donorEmail}
                          </Box>
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: fontScale[12],
                            color: "text.secondary",
                            mt: 0.25,
                          }}
                        >
                          {PURPOSE_LABEL[row.purpose]}
                          {row.projectTitle ? `: ${row.projectTitle}` : ""}
                          {row.frequency === "monthly" ? " · Mensual" : ""} ·
                          Reportado {formatDate(row.createdAt, true)}
                        </Typography>
                        {isGatewayRow(row) && row.status === "pending" && (
                          <Typography
                            sx={{
                              fontSize: fontScale[12],
                              color: "text.secondary",
                              mt: 0.5,
                            }}
                          >
                            Esperando que el donante complete el pago en{" "}
                            {row.method === "binance"
                              ? "Binance Pay"
                              : "PayPal"}
                            . Se confirma solo; no hace falta verificarlo.
                          </Typography>
                        )}
                      </Box>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <Typography
                          sx={{
                            fontFamily: typography.fontFamily.heading,
                            fontWeight: 800,
                            fontSize: fontScale[20],
                          }}
                        >
                          {formatUsd(row.amountUsd)}
                        </Typography>
                        <StatusBadge status={row.status} />
                      </Box>
                    </Box>

                    <Box
                      component="dl"
                      sx={{
                        m: 0,
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr 1fr",
                          md: "repeat(4, 1fr)",
                        },
                        gap: 2,
                      }}
                    >
                      <Field label="Método">{METHOD_LABEL[row.method]}</Field>
                      <Field label="Monto pagado">
                        {row.amountPaid != null
                          ? formatAmount(row.amountPaid, row.currency)
                          : "—"}
                        {row.exchangeRate &&
                          row.currency !== "USD" &&
                          row.currency !== "USDT" && (
                            <Box
                              component="span"
                              sx={{
                                display: "block",
                                fontSize: fontScale[11],
                                fontWeight: 400,
                                color: "text.secondary",
                              }}
                            >
                              Tasa{" "}
                              {formatAmount(row.exchangeRate, row.currency)}
                            </Box>
                          )}
                        {expectedIfMismatch(row) != null && (
                          <Box
                            component="span"
                            sx={{
                              display: "block",
                              fontSize: fontScale[11],
                              fontWeight: 600,
                              color: "error.main",
                            }}
                          >
                            ⚠ No coincide: se esperaba ≈{" "}
                            {formatAmount(
                              expectedIfMismatch(row) ?? 0,
                              row.currency,
                            )}
                          </Box>
                        )}
                      </Field>
                      <Field label="Referencia">{row.reference ?? "—"}</Field>
                      <Field label="Fecha del pago">
                        {row.paidAt ? formatDate(row.paidAt) : "—"}
                      </Field>
                    </Box>

                    {(row.reviewedBy || row.notes) &&
                      row.status !== "pending" && (
                        <Typography
                          sx={{
                            fontSize: fontScale[12],
                            color: "text.secondary",
                            mt: 2,
                          }}
                        >
                          {STATUS_LABEL[row.status]} por {row.reviewedBy ?? "—"}
                          {row.notes ? ` · Nota: ${row.notes}` : ""}
                        </Typography>
                      )}

                    {(row.hasReceipt ||
                      (row.status === "pending" && !isGatewayRow(row))) && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                          mt: 2.5,
                          pt: 2.5,
                          borderTop: `1px solid ${theme.palette.divider}`,
                        }}
                      >
                        {row.hasReceipt && (
                          <Button
                            size="small"
                            variant="outlined"
                            color="inherit"
                            startIcon={
                              <ReceiptLongOutlinedIcon fontSize="small" />
                            }
                            onClick={() => handleReceipt(row)}
                            disabled={pending}
                            aria-label={`Ver comprobante de ${row.donorName}`}
                          >
                            Ver comprobante
                          </Button>
                        )}
                        {row.status === "pending" && !isGatewayRow(row) && (
                          <>
                            <Box sx={{ flex: 1 }} />
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<CloseRoundedIcon fontSize="small" />}
                              onClick={() => setRejecting(row)}
                              disabled={pending}
                              aria-label={`Rechazar pago de ${row.donorName}`}
                            >
                              Rechazar
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="secondary"
                              startIcon={<CheckRoundedIcon fontSize="small" />}
                              onClick={() => setApproving(row)}
                              disabled={pending}
                              aria-label={`Confirmar pago de ${row.donorName}`}
                            >
                              Confirmar
                            </Button>
                          </>
                        )}
                      </Box>
                    )}
                  </Box>
                ))}
              </AnimatePresence>
            </Box>
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
      </Box>

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
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    mt: 1.5,
                    color: "error.main",
                    fontWeight: 600,
                  }}
                >
                  ⚠ Lo pagado no coincide con el monto declarado (se esperaba ≈{" "}
                  {formatAmount(
                    expectedIfMismatch(approving) ?? 0,
                    approving.currency,
                  )}
                  ). Si no corresponde, recházalo con el motivo para que el
                  donante lo reporte de nuevo.
                </Box>
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

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={5000}
        onClose={() => setToast(null)}
      >
        <Alert
          onClose={() => setToast(null)}
          severity={toast?.ok ? "success" : "error"}
          variant="filled"
          sx={
            toast?.ok
              ? {
                  bgcolor: semantic.successFilled,
                  color: common.white,
                  "& .MuiAlert-icon, & .MuiAlert-action": {
                    color: common.white,
                  },
                }
              : undefined
          }
        >
          {toast?.message}
        </Alert>
      </Snackbar>
    </>
  );
}
