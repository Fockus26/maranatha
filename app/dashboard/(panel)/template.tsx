import { PageTransition } from "@/components/layout/PageTransition";

/**
 * Transición entre pantallas del panel (pedido de César, 2026-11-10): la de
 * `app/template.tsx` no se repite al navegar dentro de `/dashboard`, porque
 * ese segmento no cambia. Un `template` en este nivel se vuelve a montar en
 * cada pantalla del panel, y como vive dentro del layout solo anima el
 * contenido: el sidebar y la barra superior quedan quietos. Mismo criterio
 * que D055 (solo entrada, sin `AnimatePresence`) y respeta movimiento reducido.
 */
export default function PanelTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
