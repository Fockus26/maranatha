import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
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
import { ibmPlexSans, sora } from "../theme/fonts";
import ThemeRegistry from "../theme/ThemeRegistry";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
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
    { media: "(prefers-color-scheme: light)", color: "#F5F6FA" },
    { media: "(prefers-color-scheme: dark)", color: "#060A1D" },
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
      suppressHydrationWarning
    >
      <body>
        <a href="#main-content" className="skip-link">
          Saltar al contenido principal
        </a>
        <ThemeRegistry initialMode={initialMode}>
          <TitheModalProvider>
            {children}
            <TitheModal />
          </TitheModalProvider>
        </ThemeRegistry>
        {/* Solo en Vercel: fuera de ahí el script `/_vercel/insights` da 404. */}
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
