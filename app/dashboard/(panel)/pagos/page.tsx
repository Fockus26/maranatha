import type { Metadata } from "next";
import { DashboardShell } from "@/components/layout/DashboardShell";
import {
  type DashboardPaymentRow,
  DashboardPayments,
  type PaymentFilter,
} from "@/components/ui/DashboardPayments";
import { requireAdmin } from "@/lib/auth/admin";
import { getExchangeRates } from "@/lib/payments/exchangeRates";
import {
  getPaymentStats,
  getSetting,
  listPayments,
} from "@/lib/payments/repository";
import { PROJECTS } from "@/lib/projectsData";

export const metadata: Metadata = {
  title: "Pagos",
  robots: { index: false, follow: false },
};

const FILTERS: PaymentFilter[] = ["pending", "confirmed", "rejected", "all"];

/**
 * Panel de pagos (`/dashboard/pagos`): reportes manuales pendientes de
 * verificar y el historial. Server Component — lee con la clave secreta
 * solo después de `requireAdmin()` (el layout del grupo ya lo hizo, pero en
 * navegaciones del cliente el layout no se vuelve a ejecutar).
 */
export default async function DashboardPagosPage({
  searchParams,
}: PageProps<"/dashboard/pagos">) {
  await requireAdmin();

  const params = await searchParams;
  const requested = typeof params.estado === "string" ? params.estado : "";
  const filter: PaymentFilter = (FILTERS as string[]).includes(requested)
    ? (requested as PaymentFilter)
    : "pending";

  const [payments, stats, rates, fallback] = await Promise.all([
    listPayments(
      filter === "all"
        ? {}
        : filter === "pending"
          ? // Los PayPal pendientes son checkouts sin completar: nada que verificar.
            { status: "pending", excludeMethod: "paypal" }
          : { status: filter },
    ),
    getPaymentStats(),
    getExchangeRates(),
    getSetting<{ VES?: number; COP?: number }>("exchange_rates"),
  ]);

  const titles = new Map(PROJECTS.map((p) => [p.slug, p.title]));
  const rows: DashboardPaymentRow[] = payments.ok
    ? payments.data.map((p) => ({
        id: p.id,
        createdAt: p.created_at,
        purpose: p.purpose,
        projectTitle: p.project_slug
          ? (titles.get(p.project_slug) ?? p.project_slug)
          : null,
        frequency: p.frequency,
        method: p.method,
        status: p.status,
        amountUsd: p.amount_usd,
        amountPaid: p.amount_paid,
        currency: p.currency,
        exchangeRate: p.exchange_rate,
        donorName: p.donor_name,
        donorEmail: p.donor_email,
        reference: p.reference,
        paidAt: p.paid_at,
        hasReceipt: Boolean(p.receipt_path),
        reviewedBy: p.confirmed_by,
        notes: p.notes,
      }))
    : [];

  return (
    <DashboardShell>
      <DashboardPayments
        filter={filter}
        rows={rows}
        loadError={!payments.ok}
        stats={stats.ok ? stats.data : null}
        rates={{ VES: rates.VES, COP: rates.COP }}
        fallbackRates={fallback ?? {}}
      />
    </DashboardShell>
  );
}
