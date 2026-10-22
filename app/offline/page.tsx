import type { Metadata } from "next";
import { OfflineScreen } from "./OfflineScreen";

/**
 * Página "Sin conexión" para el service worker (`public/sw.js`): la guarda al
 * instalarse y la sirve cuando una navegación falla por falta de red. Desde
 * la app, el mismo estado lo muestra `app/error.tsx`.
 */
export const metadata: Metadata = {
  title: "Sin conexión",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return <OfflineScreen />;
}
