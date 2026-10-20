import type { MetadataRoute } from "next";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/siteConfig";
import { gray, primary } from "@/theme/tokens";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Maranatha",
    description: SITE_DESCRIPTION,
    start_url: "/",
    display: "standalone",
    background_color: gray[50],
    theme_color: primary[700],
    lang: "es",
    // Derivados de `public/brand/logo-mark.svg` (`bun run brand:icons`, D078).
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/brand/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
