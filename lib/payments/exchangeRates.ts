import "server-only";
import { getSetting } from "./repository";
import type { PaymentCurrency } from "./schema";

/**
 * Tasas USD → moneda del método, para mostrarle al donante cuánto pagar en
 * Pago Móvil (Bs, tasa oficial BCV) y Bancolombia (COP). USD y USDT son 1:1.
 *
 * Fuentes públicas (DolarApi), cacheadas 1 h por el fetch de Next. Si fallan,
 * se usa la tasa manual guardada por el admin en `settings.exchange_rates`
 * (`{ "VES": 850.5, "COP": 3900 }`). Sin ninguna de las dos, el método se
 * ofrece igual pero sin monto convertido — el donante reporta lo que pagó.
 */

export type ExchangeRates = Record<PaymentCurrency, number | null>;

const SOURCES: Record<
  "VES" | "COP",
  { url: string; pick: (json: Record<string, unknown>) => unknown }
> = {
  VES: {
    url: "https://ve.dolarapi.com/v1/dolares/oficial",
    pick: (j) => j.promedio,
  },
  COP: {
    url: "https://co.dolarapi.com/v1/cotizaciones/usd",
    pick: (j) => j.venta,
  },
};

const REVALIDATE_SECONDS = 3600;

async function fetchRate(currency: "VES" | "COP"): Promise<number | null> {
  const source = SOURCES[currency];
  try {
    const res = await fetch(source.url, {
      next: { revalidate: REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const value = Number(source.pick(await res.json()));
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch (error) {
    console.error(`[payments] tasa ${currency} no disponible:`, error);
    return null;
  }
}

type Pair = Record<"VES" | "COP", number | null>;

/** Tasas de DolarApi y de respaldo por separado (para mostrarlas al admin). */
export async function getExchangeRateSources(): Promise<{
  live: Pair;
  fallback: Pair;
}> {
  const [ves, cop, manual] = await Promise.all([
    fetchRate("VES"),
    fetchRate("COP"),
    getSetting<Partial<Record<"VES" | "COP", number>>>("exchange_rates"),
  ]);
  return {
    live: { VES: ves, COP: cop },
    fallback: { VES: manual?.VES ?? null, COP: manual?.COP ?? null },
  };
}

export async function getExchangeRates(): Promise<ExchangeRates> {
  const { live, fallback } = await getExchangeRateSources();
  return {
    USD: 1,
    USDT: 1,
    VES: live.VES ?? fallback.VES,
    COP: live.COP ?? fallback.COP,
  };
}

/** Monto a pagar en la moneda del método, redondeado como lo cobra cada moneda. */
export function convertFromUsd(
  amountUsd: number,
  currency: PaymentCurrency,
  rates: ExchangeRates,
): number | null {
  const rate = rates[currency];
  if (!rate) return null;
  const value = amountUsd * rate;
  // COP no usa decimales en la práctica; el resto va a 2 decimales.
  return currency === "COP" ? Math.ceil(value) : Math.round(value * 100) / 100;
}
