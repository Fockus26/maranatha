"use client";

import * as React from "react";
import { signOut } from "@/app/actions/auth";
import { DashboardTopbar } from "./DashboardTopbar";

/**
 * Contenedor horizontal único del dashboard: topbar, banda de KPIs y
 * contenido de cada página comparten ancho máximo y padding, así sus bordes
 * quedan alineados (antes el topbar y la banda iban de borde a borde).
 * Clases de Tailwind (ya no `sx`); el tope de 1400 px no tiene token
 * (`layout.page` llega a 1200/1440/1600).
 */
export const DASHBOARD_CONTENT_CLASS =
  "mx-auto w-full max-w-panel px-3 md:px-5";

export interface DashboardShellProps {
  onLogout?: () => void;
  children: React.ReactNode;
}

/**
 * Layout del dashboard privado — Opción B ("Panel Superior"), elegida por el
 * cliente entre 3 direcciones comparadas en `/design` tras pedir un rediseño
 * completo del dashboard (no le convencía el diseño anterior). Reemplaza al
 * shell de D024 (`DashboardSidebar` fijo de 260px + topbar con solo el
 * título): ahora es solo `DashboardTopbar`, una barra navy horizontal con la
 * navegación — sin sidebar fijo, todo el ancho queda libre para el
 * contenido.
 *
 * A diferencia del shell anterior, este NO le pone padding al `<main>`: cada
 * página resuelve su propia estructura porque algunas (Resumen) necesitan
 * una banda a pantalla completa (`DashboardStatBand`) pegada al topbar, que
 * no podría ir de borde a borde si el shell forzara un padding global; otras
 * (Proyectos) arrancan directo con su propio padding. `DashboardSidebar.tsx`
 * queda sin uso (esta sesión no puede eliminar archivos).
 *
 * Uso:
 *
 * ```tsx
 * // app/dashboard/page.tsx
 * export default function DashboardResumenPage() {
 *   return <DashboardShell>{...}</DashboardShell>;
 * }
 * ```
 */
// Por defecto el botón de salir del topbar cierra la sesión (Better Auth)
// (Server Action que borra la cookie y redirige al login).
function defaultLogout() {
  React.startTransition(() => {
    void signOut();
  });
}

export function DashboardShell({
  onLogout = defaultLogout,
  children,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardTopbar onLogout={onLogout} />
      <main id="main-content">{children}</main>
    </div>
  );
}
