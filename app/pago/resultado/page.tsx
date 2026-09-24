import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import HourglassEmptyRoundedIcon from "@mui/icons-material/HourglassEmptyRounded";
import UndoRoundedIcon from "@mui/icons-material/UndoRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Footer from "@/components/layout/Footer";
import PageNavbar from "@/components/layout/PageNavbar";
import type { CheckoutOutcome } from "@/lib/payments/returnPaths";
import { getProjectBySlug } from "@/lib/projectsData";

export const metadata: Metadata = {
  title: "Resultado del aporte",
  robots: { index: false, follow: false },
};

const CONTENT: Record<
  CheckoutOutcome,
  {
    icon: typeof CheckCircleOutlineRoundedIcon;
    color: string;
    title: string;
    body: string;
  }
> = {
  confirmado: {
    icon: CheckCircleOutlineRoundedIcon,
    color: "success.main",
    title: "¡Gracias por tu aporte!",
    body: "Recibimos tu pago. PayPal te enviará el comprobante a tu correo.",
  },
  pendiente: {
    icon: HourglassEmptyRoundedIcon,
    color: "warning.main",
    title: "Tu pago está en revisión",
    body: "PayPal está procesando el cobro. Cuando se acredite quedará registrado automáticamente; no necesitas hacer nada más.",
  },
  cancelado: {
    icon: UndoRoundedIcon,
    color: "text.secondary",
    title: "Cancelaste el pago",
    body: "No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras, con PayPal u otro método.",
  },
  error: {
    icon: ErrorOutlineRoundedIcon,
    color: "error.main",
    title: "No pudimos completar el pago",
    body: "El cobro no se realizó (por ejemplo, la tarjeta fue rechazada). Puedes intentarlo de nuevo o elegir otro método de pago.",
  },
};

/**
 * Página a la que vuelve el donante desde PayPal (vía las rutas
 * `/pago/paypal/retorno` y `/pago/paypal/cancelado`). Solo muestra el
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
  const { icon: Icon, color, title, body } = CONTENT[outcome];

  const backHref = project ? `/proyectos/${project.slug}` : "/";
  const backLabel = project
    ? `Volver a "${project.title}"`
    : "Volver al inicio";

  return (
    <>
      <PageNavbar />
      <Box
        component="main"
        id="main-content"
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
          py: { xs: 8, md: 12 },
        }}
      >
        <Box sx={{ maxWidth: 480, textAlign: "center" }}>
          <Icon sx={{ fontSize: 56, color, mb: 2 }} aria-hidden="true" />
          <Typography
            component="h1"
            sx={{
              fontFamily: "var(--font-heading)",
              fontWeight: 800,
              fontSize: { xs: 26, md: 32 },
              mb: 1.5,
            }}
          >
            {title}
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 16,
              lineHeight: 1.6,
              mb: 4,
            }}
          >
            {body}
          </Typography>
          <Button href={backHref} variant="contained" color="secondary">
            {backLabel}
          </Button>
        </Box>
      </Box>
      <Footer />
    </>
  );
}
