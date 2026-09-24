import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    serverActions: {
      // Reporte de pago con comprobante adjunto (máx. 4 MB en
      // `lib/payments/receipts.ts`) + overhead del multipart. Vercel corta el
      // body en ~4.5 MB, así que no tiene sentido subirlo más.
      bodySizeLimit: "4.5mb",
    },
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
