import "server-only";
import type { PaymentCurrency, PaymentMethodId } from "./schema";

/**
 * Catálogo de métodos de pago. Los datos de cada cuenta receptora salen de
 * variables de entorno (`PAY_*`, ver `.env.example`): son datos que se le
 * muestran al donante, pero así no quedan hardcodeados en el repo y se
 * cambian sin tocar código. Un método sin sus variables obligatorias queda
 * deshabilitado y no se ofrece.
 */

export interface PaymentMethodDetail {
  label: string;
  value: string;
  /** Muestra un botón "copiar" junto al valor. */
  copyable?: boolean;
}

export interface PaymentMethodInfo {
  id: PaymentMethodId;
  label: string;
  kind: "gateway" | "manual";
  currency: PaymentCurrency;
  supportsMonthly: boolean;
  /** Indicación corta de cómo pagar (texto base; el frontend decide si la muestra). */
  hint: string;
  /** Qué debe escribir el donante como referencia. */
  referenceHint: string;
  details: PaymentMethodDetail[];
}

type Field = {
  env: string;
  label: string;
  copyable?: boolean;
  optional?: boolean;
};

interface MethodDef extends Omit<PaymentMethodInfo, "details"> {
  fields: Field[];
}

const DEFS: MethodDef[] = [
  {
    id: "paypal",
    label: "PayPal / Tarjeta",
    kind: "gateway",
    currency: "USD",
    supportsMonthly: true,
    hint: "Paga con tu cuenta PayPal o con tarjeta Visa/Mastercard (incluye prepago) sin crear cuenta.",
    referenceHint: "",
    fields: [{ env: "PAYPAL_CLIENT_ID", label: "" }],
  },
  {
    id: "pagomovil",
    label: "Pago Móvil",
    kind: "manual",
    currency: "VES",
    supportsMonthly: false,
    hint: "Haz el Pago Móvil desde la app de tu banco por el monto en bolívares.",
    referenceHint: "Número de referencia del Pago Móvil",
    fields: [
      { env: "PAY_PAGOMOVIL_BANK", label: "Banco" },
      { env: "PAY_PAGOMOVIL_PHONE", label: "Teléfono", copyable: true },
      { env: "PAY_PAGOMOVIL_ID", label: "Cédula / RIF", copyable: true },
    ],
  },
  {
    id: "zelle",
    label: "Zelle",
    kind: "manual",
    currency: "USD",
    supportsMonthly: false,
    hint: "Envía el monto por Zelle desde tu banco en EE. UU.",
    referenceHint: "Número de confirmación de Zelle",
    fields: [
      { env: "PAY_ZELLE_EMAIL", label: "Correo o teléfono", copyable: true },
      { env: "PAY_ZELLE_NAME", label: "Titular" },
    ],
  },
  {
    id: "bancolombia",
    label: "Bancolombia",
    kind: "manual",
    currency: "COP",
    supportsMonthly: false,
    hint: "Transfiere el monto en pesos desde Bancolombia, Nequi u otro banco colombiano.",
    referenceHint: "Número de comprobante de la transferencia",
    fields: [
      { env: "PAY_BANCOLOMBIA_ACCOUNT_TYPE", label: "Tipo de cuenta" },
      {
        env: "PAY_BANCOLOMBIA_ACCOUNT",
        label: "Número de cuenta",
        copyable: true,
      },
      { env: "PAY_BANCOLOMBIA_HOLDER", label: "Titular" },
      {
        env: "PAY_BANCOLOMBIA_DOCUMENT",
        label: "Documento",
        copyable: true,
        optional: true,
      },
      {
        env: "PAY_BANCOLOMBIA_BREB_KEY",
        label: "Llave Bre-B",
        copyable: true,
        optional: true,
      },
    ],
  },
  {
    id: "binance",
    label: "Binance Pay",
    kind: "manual",
    currency: "USDT",
    supportsMonthly: false,
    hint: "Envía el monto en USDT por Binance Pay al Pay ID indicado.",
    referenceHint: "ID de la orden de Binance Pay",
    fields: [
      { env: "PAY_BINANCE_PAY_ID", label: "Binance Pay ID", copyable: true },
      { env: "PAY_BINANCE_NAME", label: "Usuario", optional: true },
    ],
  },
  {
    id: "zinli",
    label: "Zinli",
    kind: "manual",
    currency: "USD",
    supportsMonthly: false,
    hint: "Envía el monto desde tu app Zinli al correo indicado.",
    referenceHint: "Número de transacción de Zinli",
    fields: [
      { env: "PAY_ZINLI_EMAIL", label: "Correo Zinli", copyable: true },
      { env: "PAY_ZINLI_NAME", label: "Titular", optional: true },
    ],
  },
  {
    id: "wally",
    label: "Wally",
    kind: "manual",
    currency: "USD",
    supportsMonthly: false,
    hint: "Envía el monto desde tu app Wally al usuario indicado.",
    referenceHint: "Número de transacción de Wally",
    fields: [
      {
        env: "PAY_WALLY_ACCOUNT",
        label: "Teléfono o correo Wally",
        copyable: true,
      },
      { env: "PAY_WALLY_NAME", label: "Titular", optional: true },
    ],
  },
];

function resolve(def: MethodDef): PaymentMethodInfo | null {
  const details: PaymentMethodDetail[] = [];
  for (const field of def.fields) {
    const value = process.env[field.env]?.trim();
    if (!value) {
      if (field.optional) continue;
      return null;
    }
    // PayPal: el client id solo habilita el método, no se muestra.
    if (def.kind === "gateway") continue;
    details.push({ label: field.label, value, copyable: field.copyable });
  }
  const { fields: _fields, ...info } = def;
  return { ...info, details };
}

/** Métodos habilitados (con todas sus variables obligatorias definidas). */
export function getEnabledMethods(): PaymentMethodInfo[] {
  return DEFS.map(resolve).filter((m): m is PaymentMethodInfo => m !== null);
}

export function getEnabledMethod(
  id: PaymentMethodId,
): PaymentMethodInfo | null {
  const def = DEFS.find((d) => d.id === id);
  return def ? resolve(def) : null;
}
