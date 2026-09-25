"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CurrencyExchangeRoundedIcon from "@mui/icons-material/CurrencyExchangeRounded";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
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
import type {
  PaymentCurrency,
  PaymentFrequency,
  PaymentMethodId,
  PaymentPurpose,
  PaymentStatus,
} from "@/lib/payments/schema";
import { SMALL_FIELD_SX } from "@/theme/fieldStyles";
import { radius, semantic, typography } from "@/theme/tokens";
import { ConfirmDialog } from "./ConfirmDialog";
import { DashboardStatBand } from "./DashboardStatBand";
import { EmptyState } from "./EmptyState";

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

export interface DashboardPaymentsProps {
  filter: PaymentFilter;
  rows: DashboardPaymentRow[];
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
    pending: { bg: theme.palette.action.hover, fg: theme.palette.text.primary },
    confirmed: { bg: semantic.successFilled, fg: "#FFFFFF" },
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
        fontSize: "11px",
        fontWeight: 600,
        borderRadius: "20px",
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
        sx={{ fontSize: "11px", color: "text.secondary", mb: 0.25 }}
      >
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{
          m: 0,
          fontSize: "13px",
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
          minRows={2}
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
      const result = await saveFallbackRates(data);
      if (result.ok) setSaved(next);
      onResult(
        result.ok
          ? "Tasas de respaldo guardadas."
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
        <DialogContentText sx={{ fontSize: 13, mb: 3 }}>
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
                <Typography component="dt" sx={{ fontSize: 13 }}>
                  {label}
                </Typography>
                <Typography
                  component="dd"
                  sx={{
                    m: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    textAlign: "right",
                  }}
                >
                  {inUse ? formatAmount(inUse, currency) : "Sin tasa"} por USD
                  <Box
                    component="span"
                    sx={{
                      display: "block",
                      fontSize: 11,
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
            type="number"
            size="small"
            defaultValue={fallbackRates.VES ?? ""}
            slotProps={{
              htmlInput: { min: 0, step: "0.0001", inputMode: "decimal" },
            }}
            sx={SMALL_FIELD_SX}
          />
          <TextField
            name="COP"
            label="Respaldo COP por USD"
            type="number"
            size="small"
            defaultValue={fallbackRates.COP ?? ""}
            slotProps={{
              htmlInput: { min: 0, step: "0.01", inputMode: "decimal" },
            }}
            sx={SMALL_FIELD_SX}
          />
        </Box>
        <Typography
          role="status"
          sx={{ fontSize: 12, color: "text.secondary", mt: 2 }}
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

export function DashboardPayments({
  filter,
  rows,
  loadError,
  stats,
  liveRates,
  fallbackRates,
}: DashboardPaymentsProps) {
  const theme = useTheme();
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
      const result = await approvePayment(row.id);
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
      const result = await rejectPayment(row.id, note);
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
      const result = await getReceiptLink(row.id);
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
                fontSize: 26,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              Pagos
            </Typography>
            <Typography
              sx={{ fontSize: 13, color: theme.palette.text.secondary }}
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
                  borderRadius: "999px",
                  fontSize: 13,
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
            No se pudieron cargar los pagos. Revisa la conexión con Supabase.
          </Alert>
        ) : rows.length === 0 ? (
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
        ) : (
          <Box
            component="ul"
            aria-label={`Pagos: ${FILTER_LABEL[filter].toLowerCase()}`}
            sx={{ listStyle: "none", m: 0, p: 0, display: "grid", gap: 2 }}
          >
            {rows.map((row) => (
              <Box
                component="li"
                key={row.id}
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
                        fontSize: 15,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.donorName}{" "}
                      <Box
                        component="span"
                        sx={{
                          fontWeight: 400,
                          fontSize: 13,
                          color: "text.secondary",
                        }}
                      >
                        · {row.donorEmail}
                      </Box>
                    </Typography>
                    <Typography
                      sx={{ fontSize: 12, color: "text.secondary", mt: 0.25 }}
                    >
                      {PURPOSE_LABEL[row.purpose]}
                      {row.projectTitle ? `: ${row.projectTitle}` : ""}
                      {row.frequency === "monthly" ? " · Mensual" : ""} ·
                      Reportado {formatDate(row.createdAt, true)}
                    </Typography>
                    {row.method === "paypal" && row.status === "pending" && (
                      <Typography
                        sx={{ fontSize: 12, color: "text.secondary", mt: 0.5 }}
                      >
                        Esperando que el donante complete el pago en PayPal. Se
                        confirma solo; no hace falta verificarlo.
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                    <Typography
                      sx={{
                        fontFamily: typography.fontFamily.heading,
                        fontWeight: 800,
                        fontSize: 20,
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
                            fontSize: 11,
                            fontWeight: 400,
                            color: "text.secondary",
                          }}
                        >
                          Tasa {formatAmount(row.exchangeRate, row.currency)}
                        </Box>
                      )}
                    {expectedIfMismatch(row) != null && (
                      <Box
                        component="span"
                        sx={{
                          display: "block",
                          fontSize: 11,
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

                {(row.reviewedBy || row.notes) && row.status !== "pending" && (
                  <Typography
                    sx={{ fontSize: 12, color: "text.secondary", mt: 2 }}
                  >
                    {STATUS_LABEL[row.status]} por {row.reviewedBy ?? "—"}
                    {row.notes ? ` · Nota: ${row.notes}` : ""}
                  </Typography>
                )}

                {(row.hasReceipt ||
                  (row.status === "pending" && row.method !== "paypal")) && (
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
                        startIcon={<ReceiptLongOutlinedIcon fontSize="small" />}
                        onClick={() => handleReceipt(row)}
                        disabled={pending}
                        aria-label={`Ver comprobante de ${row.donorName}`}
                      >
                        Ver comprobante
                      </Button>
                    )}
                    {row.status === "pending" && row.method !== "paypal" && (
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
          </Box>
        )}
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
        onClose={() => (pending ? undefined : setApproving(null))}
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
                  color: "#FFFFFF",
                  "& .MuiAlert-icon, & .MuiAlert-action": { color: "#FFFFFF" },
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
