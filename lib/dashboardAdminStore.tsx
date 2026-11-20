"use client";

import { createContext, type ReactNode, useContext } from "react";

/**
 * Admin con sesión, para lo que el panel muestra de él (las iniciales de la
 * barra, D107). Lo siembra `app/dashboard/(panel)/layout.tsx` con lo que ya
 * leyó `requireAdmin()`; por Context y no por props para que el `loading.tsx`
 * del panel, que monta `DashboardShell` sin props, también lo muestre. Solo
 * nombre y correo: nada de esto autoriza (eso es `getAdminStrict()`).
 */

export interface DashboardAdmin {
  name: string;
  email: string;
}

const DashboardAdminContext = createContext<DashboardAdmin | null>(null);

export function DashboardAdminProvider({
  admin,
  children,
}: {
  admin: DashboardAdmin;
  children: ReactNode;
}) {
  return (
    <DashboardAdminContext.Provider value={admin}>
      {children}
    </DashboardAdminContext.Provider>
  );
}

/** `null` fuera del provider (no debería pasar en el panel). */
export function useDashboardAdmin(): DashboardAdmin | null {
  return useContext(DashboardAdminContext);
}
