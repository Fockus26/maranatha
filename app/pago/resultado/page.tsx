import {
  CircleAlert,
  CircleCheck,
  Hourglass,
  type LucideIcon,
  Undo2,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/layout/Footer";
import PageNavbar from "@/components/layout/PageNavbar";
import { Button } from "@/components/ui/button";
import type { CheckoutOutcome } from "@/lib/payments/returnPaths";
import { getProjectBySlug } from "@/lib/projectsData";

export const metadata: Metadata = {
  title: "Resultado del aporte",
  robots: { index: false, follow: false },
};

const CONTENT: Record<
  CheckoutOutcome,
  {
    icon: LucideIcon;
    color: string;
    title: string;
    body: string;
  }
> = {
  confirmado: {
    icon: CircleCheck,
    color: "text-success",
    title: "¡Gracias por tu aporte!",
    body: "Recibimos tu pago. PayPal te enviará el comprobante a tu correo.",
  },
  suscrito: {
    icon: CircleCheck,
    color: "text-success",
    title: "¡Tu aporte mensual quedó activo!",
    body: "PayPal hará el cobro cada mes y te enviará un comprobante por correo. Puedes cancelarlo cuando quieras desde tu cuenta PayPal (Configuración → Pagos automáticos).",
  },
  pendiente: {
    icon: Hourglass,
    color: "text-warning",
    title: "Tu pago está en revisión",
    body: "PayPal está procesando el cobro. Cuando se acredite quedará registrado automáticamente; no necesitas hacer nada más.",
  },
  cancelado: {
    icon: Undo2,
    color: "text-muted-foreground",
    title: "Cancelaste el pago",
    body: "No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras, con PayPal u otro método.",
  },
  error: {
    icon: CircleAlert,
    color: "text-destructive",
    title: "No pudimos completar el pago",
    body: "El cobro no se realizó (por ejemplo, la tarjeta fue rechazada). Puedes intentarlo de nuevo o elegir otro método de pago.",
  },
};

/**
 * Textos de Binance Pay donde el de PayPal no aplica (comprobante, tarjeta).
 * "suscrito" no existe con Binance: no admite aportes mensuales.
 */
const BINANCE_BODY: Partial<Record<CheckoutOutcome, string>> = {
  confirmado:
    "Recibimos tu pago. El comprobante queda en el historial de Binance Pay, en tu app de Binance.",
  pendiente:
    "Binance Pay todavía está procesando el pago. Cuando se acredite quedará registrado automáticamente; no necesitas hacer nada más.",
  cancelado:
    "El pago en Binance Pay no se completó y no se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras, con Binance u otro método.",
  error:
    "No pudimos verificar el pago con Binance Pay. Si ya pagaste, quedará registrado solo en unos minutos; si no, puedes intentarlo de nuevo o elegir otro método.",
};

/**
 * Página a la que vuelve el donante desde PayPal o Binance Pay (vía las
 * rutas `/pago/<pasarela>/retorno` y `/pago/<pasarela>/cancelado`). Solo muestra el
 * resultado: el estado real del pago ya se resolvió en el servidor.
 */
export default async function PagoResultadoPage({
  searchParams,
}: PageProps<"/pago/resultado">) {
  const params = await searchParams;
  const estado = (
    typeof params.estado === "string" ? params.estado : ""
  ) as CheckoutOutcome;
  const outcome: CheckoutOutcome = Object.hasOwn(CONTENT, estado)
    ? estado
    : "error";
  const project =
    typeof params.proyecto === "string"
      ? getProjectBySlug(params.proyecto)
      : undefined;
  const { icon: Icon, color, title, body: paypalBody } = CONTENT[outcome];
  const body =
    (params.pasarela === "binance" && BINANCE_BODY[outcome]) || paypalBody;

  const backHref = project ? `/proyectos/${project.slug}` : "/";
  const backLabel = project
    ? `Volver a "${project.title}"`
    : "Volver al inicio";

  return (
    <>
      <PageNavbar />
      <main
        id="main-content"
        className="flex min-h-[60vh] items-center justify-center px-2 py-8 md:py-12"
      >
        <div className="max-w-120 text-center">
          <Icon
            className={`mb-2 inline-block size-14 ${color}`}
            aria-hidden="true"
          />
          <h1 className="m-0 mb-1.5 font-extrabold font-heading text-26 md:text-32">
            {title}
          </h1>
          <p className="m-0 mb-4 font-body text-16 text-muted-foreground leading-body">
            {body}
          </p>
          <Button asChild color="secondary">
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
}
