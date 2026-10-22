import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El Dockerfile del VPS construye con NEXT_OUTPUT=standalone: genera un
  // `server.js` con solo los archivos que usa el sitio (imagen mucho más
  // chica). En Vercel la variable no existe y el build queda como siempre.
  ...(process.env.NEXT_OUTPUT === "standalone" && {
    output: "standalone" as const,
  }),
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Reporte de pago con comprobante adjunto (máx. 4 MB en
      // `lib/payments/receipts.ts`) + overhead del multipart. Vercel corta el
      // body en ~4.5 MB, así que no tiene sentido subirlo más. En el VPS el
      // límite del proxy está en `deploy/Caddyfile` (request_body 6MB).
      bodySizeLimit: "4.5mb",
    },
  },
  // El service worker nunca se cachea: así cada visita toma la última versión.
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  images: {
    // AVIF además de WebP: ~20-30% menos peso donde el navegador lo soporta.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
