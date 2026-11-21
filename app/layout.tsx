import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import { NavigationProgress } from "@/components/layout/NavigationProgress";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { Toaster } from "@/components/ui/sonner";
import { TitheModal } from "@/components/ui/TitheModal";
import {
  SITE_DESCRIPTION,
  SITE_INDEXABLE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/siteConfig";
import { TitheModalProvider } from "@/lib/titheModalStore";
import { gray, primary } from "@/theme/tokens";
import ColorModeProvider from "../theme/ColorModeProvider";
import { ibmPlexSans, sora } from "../theme/fonts";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  // Marca provisional (D078): todo sale de `public/brand/`. El favicon SVG
  // cambia a la versión inversa en navegadores oscuros (el tile navy se pierde
  // sobre una pestaña oscura); `app/favicon.ico` queda de respaldo.
  icons: {
    icon: [
      {
        url: "/brand/logo-mark.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/logo-mark-inverse.svg",
        type: "image/svg+xml",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: { url: "/brand/apple-touch-icon.png", sizes: "180x180" },
  },
  openGraph: {
    type: "website",
    locale: SITE_LOCALE,
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE_DEFAULT,
    description: SITE_DESCRIPTION,
  },
  robots: { index: SITE_INDEXABLE, follow: SITE_INDEXABLE },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: gray[50] },
    { media: "(prefers-color-scheme: dark)", color: primary[900] },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies();
  const initialMode =
    cookieStore.get("color-mode")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="es"
      className={`${sora.variable} ${ibmPlexSans.variable}`}
      // El modo ya resuelto llega en el HTML del servidor: la variante
      // `dark:` de Tailwind y los roles de `app/tokens.css` lo leen sin
      // esperar al cliente (D109). `ColorModeProvider` lo actualiza al cambiar.
      data-color-mode={initialMode}
      suppressHydrationWarning
    >
      <body>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <ColorModeProvider initialMode={initialMode}>
          <TitheModalProvider>
            {children}
            <TitheModal />
          </TitheModalProvider>
          <NavigationProgress />
        </ColorModeProvider>
        <Toaster />
        <ServiceWorkerRegister />
        {/* Solo en Vercel: fuera de ahí el script `/_vercel/insights` da 404. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
