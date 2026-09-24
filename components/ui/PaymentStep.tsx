"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import {
  type CheckoutMethod,
  getCheckoutOptions,
  type PaypalCheckoutError,
  type ReportPaymentError,
  reportManualPayment,
  startPaypalCheckout,
} from "@/app/actions/payments";
import { formatAmount } from "@/lib/payments/labels";
import type { PaymentFrequency, PaymentPurpose } from "@/lib/payments/schema";
import { radius, typography } from "@/theme/tokens";
import { DonationFormCard } from "./DonationFormCard";

/** Igual a `MAX_RECEIPT_BYTES` de lib/payments/receipts.ts (solo servidor). */
const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;

/**
 * Paso 2 del aporte: el donante elige método de pago.
 *
 * - Métodos manuales (Pago Móvil, Zelle, Bancolombia, Binance, Zinli, Wally):
 *   se muestran los datos de la cuenta receptora y el monto en la moneda del
 *   método; el donante paga desde su app y reporta la referencia. Queda
 *   `pending` hasta que un admin lo verifica en `/dashboard/pagos`.
 * - PayPal (pasarela): el servidor crea la orden y el navegador redirige a
 *   PayPal; al volver, `/pago/paypal/retorno` captura y confirma.
 *
 * "Mensual" solo se ofrece con PayPal: los métodos manuales no pueden cobrar
 * de forma recurrente, así que el servidor ni siquiera los devuelve.
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

const FIELD_SX = {
  "& .MuiInputLabel-root": { fontSize: typography.size.small },
  "& .MuiInputBase-input": { fontSize: typography.size.small },
} as const;

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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

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
    <Tooltip title={copied ? "Copiado" : `Copiar ${label.toLowerCase()}`}>
      <IconButton
        size="small"
        onClick={copy}
        aria-label={`Copiar ${label.toLowerCase()}`}
      >
        {copied ? (
          <CheckRoundedIcon fontSize="inherit" />
        ) : (
          <ContentCopyRoundedIcon fontSize="inherit" />
        )}
      </IconButton>
    </Tooltip>
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
  const theme = useTheme();
  return (
    <Box
      component="label"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        borderRadius: `${radius.sm}px`,
        border: `1px solid ${checked ? theme.palette.secondary.main : theme.palette.divider}`,
        backgroundColor: checked
          ? `${theme.palette.secondary.light}22`
          : "transparent",
        cursor: "pointer",
        transition: theme.transitions.create(
          ["border-color", "background-color"],
          { duration: 150 },
        ),
        "&:has(input:focus-visible)": {
          outline: `2px solid ${theme.palette.secondary.main}`,
          outlineOffset: 2,
        },
      }}
    >
      <Box
        component="input"
        type="radio"
        aria-label={method.label}
        name={name}
        value={method.id}
        checked={checked}
        onChange={onSelect}
        sx={{ accentColor: theme.palette.secondary.main, m: 0 }}
      />
      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "13px",
          fontWeight: 500,
        }}
      >
        {method.label}
      </Typography>
    </Box>
  );
}

const PAYPAL_ERROR_TEXT: Record<PaypalCheckoutError, string> = {
  invalid_input: "Revisa el monto y tus datos en el paso anterior.",
  invalid_project: "Este proyecto ya no recibe aportes.",
  method_unavailable:
    "PayPal no está disponible en este momento. Prueba con otro método.",
  too_many_requests:
    "Iniciaste varios pagos seguidos. Prueba de nuevo en un rato.",
  not_configured: "Los pagos todavía no están habilitados. Prueba más tarde.",
  server_error:
    "No pudimos conectar con PayPal. Prueba de nuevo en unos minutos.",
};

/**
 * Pasarela (PayPal): el servidor crea la orden y devuelve el link de PayPal;
 * el navegador redirige ahí. Tarjetas Visa/Mastercard (incluidas prepago)
 * también pasan por acá, en la página de PayPal, sin crear cuenta.
 */
function PaypalPanel({
  method,
  contribution,
}: {
  method: CheckoutMethod;
  contribution: PaymentStepContribution;
}) {
  const theme = useTheme();
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<PaypalCheckoutError | null>(null);

  // Si el donante vuelve con "atrás" desde PayPal, el navegador restaura la
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
      const result = await startPaypalCheckout(contribution);
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "12px",
          color: theme.palette.text.secondary,
        }}
      >
        {method.hint} Te llevaremos a PayPal para completar el pago de forma
        segura y volverás aquí al terminar.
      </Typography>
      {contribution.frequency === "monthly" && (
        <Alert severity="info" sx={{ fontSize: "12px" }}>
          PayPal cobrará {formatAmount(contribution.amountUsd, "USD")} hoy y el
          mismo día de cada mes. Puedes cancelarlo cuando quieras desde tu
          cuenta PayPal (Configuración → Pagos automáticos).
        </Alert>
      )}
      {error && (
        <Alert severity="error" role="alert" sx={{ fontSize: "12px" }}>
          {PAYPAL_ERROR_TEXT[error]}
        </Alert>
      )}
      <Button
        fullWidth
        variant="contained"
        color="secondary"
        onClick={handleClick}
        disabled={redirecting}
      >
        {redirecting ? "Redirigiendo a PayPal…" : "Continuar a PayPal"}
      </Button>
    </Box>
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
  const theme = useTheme();
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

  const referenceValid = /^[A-Za-z0-9@._\- ]{3,64}$/.test(reference.trim());
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
    data.set("amountUsd", String(contribution.amountUsd));
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
    <Box>
      <Typography
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "12px",
          color: theme.palette.text.secondary,
          mb: 2,
        }}
      >
        {method.hint}
      </Typography>

      <Box
        sx={{
          borderRadius: `${radius.sm}px`,
          border: `1px solid ${theme.palette.divider}`,
          p: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            gap: 2,
            mb: 1.5,
          }}
        >
          <Typography
            sx={{
              fontFamily: typography.fontFamily.body,
              fontSize: "12px",
              color: theme.palette.text.secondary,
            }}
          >
            Monto a pagar
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Typography
              sx={{
                fontFamily: typography.fontFamily.heading,
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              {method.amountDue != null
                ? formatAmount(method.amountDue, method.currency)
                : `${formatAmount(contribution.amountUsd, "USD")} (al cambio del día)`}
            </Typography>
            {method.amountDue != null && (
              <CopyButton value={String(method.amountDue)} label="Monto" />
            )}
          </Box>
        </Box>
        {method.currency !== "USD" &&
          method.currency !== "USDT" &&
          method.exchangeRate && (
            <Typography
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: "11px",
                color: theme.palette.text.secondary,
                mb: 1.5,
                textAlign: "right",
              }}
            >
              Tasa {method.currency === "VES" ? "BCV" : "del día"}:{" "}
              {formatAmount(method.exchangeRate, method.currency)} por USD
            </Typography>
          )}
        <Box component="dl" sx={{ m: 0, display: "grid", gap: 1 }}>
          {method.details.map((detail) => (
            <Box
              key={detail.label}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                component="dt"
                sx={{
                  fontFamily: typography.fontFamily.body,
                  fontSize: "12px",
                  color: theme.palette.text.secondary,
                }}
              >
                {detail.label}
              </Typography>
              <Box
                component="dd"
                sx={{
                  m: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  minWidth: 0,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: typography.fontFamily.body,
                    fontSize: "13px",
                    fontWeight: 500,
                    overflowWrap: "anywhere",
                    textAlign: "right",
                  }}
                >
                  {detail.value}
                </Typography>
                {detail.copyable && (
                  <CopyButton value={detail.value} label={detail.label} />
                )}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit}
        sx={{ display: "flex", flexDirection: "column", gap: 3 }}
      >
        <Typography
          component="h3"
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: "12px",
            fontWeight: 500,
          }}
        >
          Cuando hayas pagado, repórtalo aquí
        </Typography>

        {/* Honeypot anti-spam: oculto para personas y lectores de pantalla. */}
        <Box
          aria-hidden="true"
          sx={{
            position: "absolute",
            left: "-10000px",
            width: 1,
            height: 1,
            overflow: "hidden",
          }}
        >
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
          />
        </Box>

        <TextField
          name="reference"
          label="Referencia"
          fullWidth
          size="small"
          required
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          error={touched && !referenceValid}
          helperText={
            touched && !referenceValid
              ? "Ingresa la referencia (solo letras, números, guiones o puntos)."
              : method.referenceHint
          }
          sx={FIELD_SX}
        />
        <Box sx={{ display: "grid", gap: 3 }}>
          <TextField
            name="paidAt"
            label="Fecha del pago"
            type="date"
            size="small"
            required
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            error={touched && !dateValid}
            helperText={
              touched && !dateValid ? "Elige una fecha válida." : undefined
            }
            slotProps={{
              inputLabel: { shrink: true },
              htmlInput: { max: todayIso() },
            }}
            sx={FIELD_SX}
          />
          <TextField
            name="amountPaid"
            label={`Monto pagado (${method.currency === "VES" ? "Bs" : method.currency})`}
            type="number"
            size="small"
            required
            value={amountPaid}
            onChange={(e) => setAmountPaid(e.target.value)}
            error={touched && !amountValid}
            helperText={
              touched && !amountValid
                ? "Ingresa el monto que pagaste."
                : undefined
            }
            slotProps={{
              htmlInput: { min: 0, step: "0.01", inputMode: "decimal" },
            }}
            sx={FIELD_SX}
          />
        </Box>

        <Box>
          <Button
            onClick={() => fileInputRef.current?.click()}
            aria-describedby={receipt ? `${fileInputId}-name` : undefined}
            variant="outlined"
            color="inherit"
            size="small"
            startIcon={<AttachFileRoundedIcon fontSize="small" />}
            sx={{ textTransform: "none", fontSize: "12px" }}
          >
            {receipt
              ? "Cambiar comprobante"
              : "Adjuntar comprobante (opcional)"}
          </Button>
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
            <Typography
              id={`${fileInputId}-name`}
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: "11px",
                color: theme.palette.text.secondary,
                mt: 1,
                overflowWrap: "anywhere",
              }}
            >
              {receipt.name}
            </Typography>
          )}
        </Box>

        {error && (
          <Alert severity="error" role="alert" sx={{ fontSize: "12px" }}>
            {REPORT_ERROR_TEXT[error]}
          </Alert>
        )}

        <Button
          fullWidth
          type="submit"
          variant="contained"
          color="secondary"
          disabled={submitting}
        >
          {submitting ? "Enviando…" : "Enviar reporte de pago"}
        </Button>
      </Box>
    </Box>
  );
}

export function PaymentStep({
  contribution,
  summary,
  width,
  onBack,
  onReported,
}: PaymentStepProps) {
  const theme = useTheme();
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
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
        <Button
          ref={backRef}
          onClick={onBack}
          size="small"
          color="inherit"
          startIcon={<ArrowBackRoundedIcon fontSize="small" />}
          sx={{ textTransform: "none", fontSize: "12px", ml: -1 }}
        >
          Volver
        </Button>
      </Box>

      <Box
        sx={{
          textAlign: "center",
          pb: 4,
          mb: 4,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 800,
            fontSize: "32px",
          }}
        >
          {formatAmount(amountUsd, "USD")}
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: "12px",
            color: theme.palette.text.secondary,
            mt: 0.25,
          }}
        >
          {summary}
        </Typography>
      </Box>

      <Typography
        id={`${groupName}-label`}
        sx={{
          fontFamily: typography.fontFamily.body,
          fontSize: "12px",
          fontWeight: 500,
          mb: 2,
        }}
      >
        Método de pago
      </Typography>

      {!methods && !loadError && (
        <Box
          sx={{ display: "flex", justifyContent: "center", py: 4 }}
          role="status"
          aria-label="Cargando métodos de pago"
        >
          <CircularProgress size={24} color="secondary" />
        </Box>
      )}

      {loadError && (
        <Alert
          severity="error"
          role="alert"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setAttempt((n) => n + 1)}
            >
              Reintentar
            </Button>
          }
          sx={{ fontSize: "12px" }}
        >
          {loadError}
        </Alert>
      )}

      {methods && (
        <>
          {frequency === "monthly" && (
            <Typography
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: "12px",
                color: theme.palette.text.secondary,
                mb: 2,
              }}
            >
              Los aportes mensuales solo se pueden hacer con PayPal o tarjeta,
              que cobran automáticamente cada mes.
            </Typography>
          )}
          {methods.length === 0 ? (
            <Alert severity="info" sx={{ fontSize: "12px" }}>
              {frequency === "monthly"
                ? "El aporte mensual todavía no está disponible. Puedes hacer un aporte de única vez."
                : "No hay métodos de pago disponibles en este momento."}
            </Alert>
          ) : (
            <Box
              role="radiogroup"
              aria-labelledby={`${groupName}-label`}
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 1.5,
                mb: selected ? 4 : 0,
              }}
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
            </Box>
          )}
        </>
      )}

      {selected && selected.kind === "gateway" && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4 }}>
          <PaypalPanel
            key={selected.id}
            method={selected}
            contribution={contribution}
          />
        </Box>
      )}

      {selected && selected.kind === "manual" && (
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, pt: 4 }}>
          {/* `key`: al cambiar de método se reinicia el formulario de reporte. */}
          <ManualPaymentPanel
            key={selected.id}
            method={selected}
            contribution={contribution}
            onReported={onReported}
          />
        </Box>
      )}
    </DonationFormCard>
  );
}
