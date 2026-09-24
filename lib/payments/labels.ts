import type {
  PaymentCurrency,
  PaymentMethodId,
  PaymentPurpose,
  PaymentStatus,
} from "./schema";

/** Textos y formato de pagos compartidos por el checkout y el dashboard. */

export const METHOD_LABEL: Record<PaymentMethodId, string> = {
  paypal: "PayPal / Tarjeta",
  pagomovil: "Pago Móvil",
  zelle: "Zelle",
  bancolombia: "Bancolombia",
  binance: "Binance Pay",
  zinli: "Zinli",
  wally: "Wally",
};

export const PURPOSE_LABEL: Record<PaymentPurpose, string> = {
  diezmo: "Diezmo",
  ofrenda: "Ofrenda",
  proyecto: "Proyecto",
};

export const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  rejected: "Rechazado",
  cancelled: "Cancelado",
};

export function formatAmount(value: number, currency: PaymentCurrency) {
  if (currency === "USDT") {
    return `${new Intl.NumberFormat("es", { maximumFractionDigits: 2 }).format(value)} USDT`;
  }
  // es-VE devuelve "Bs.S" (símbolo de 2018-2021); el de uso actual es "Bs.".
  if (currency === "VES") {
    return `Bs. ${new Intl.NumberFormat("es-VE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`;
  }
  // COP: es-CO usa "$", que se confunde con USD — se muestra el código.
  if (currency === "COP") {
    return `COP ${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(value)}`;
  }
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
