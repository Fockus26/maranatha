import type { ReactNode } from "react";

/**
 * Envoltorio común de los esqueletos del panel (D102): marca la región como
 * ocupada y anuncia "Cargando <página>…" a lectores de pantalla. El pulso de
 * los `Skeleton` de shadcn se apaga solo con "reducir movimiento" (también
 * los de `DashboardTable`, D135).
 */
export function SkeletonFrame({
  label,
  children,
}: {
  /** Nombre de la página, para el aviso "Cargando <label>…". */
  label: string;
  children: ReactNode;
}) {
  return (
    <div aria-busy="true">
      <output className="sr-only">Cargando {label}…</output>
      {children}
    </div>
  );
}
