"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Estado global del modal "Diezmo/Aportes" (fase 07): el diezmo dejó de ser
 * una sección al final de Home (`Tithe.tsx`, removida) y ahora es un modal
 * (`components/ui/TitheModal.tsx`) que se abre al hacer click en el botón
 * "Diezmo" desde cualquier página — Navbar (Home), PageNavbar (resto de
 * páginas) y MobileMenuOverlay. Como el botón vive en 3 componentes
 * distintos y el modal debe montarse una sola vez, se resuelve con un
 * Context montado en `app/layout.tsx` (`TitheModalProvider`), en vez de
 * prop-drilling o de instanciar el modal por página.
 */

interface TitheModalContextValue {
  open: boolean;
  openTithe: () => void;
  closeTithe: () => void;
}

const TitheModalContext = createContext<TitheModalContextValue | null>(null);

export function TitheModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openTithe = useCallback(() => setOpen(true), []);
  const closeTithe = useCallback(() => setOpen(false), []);
  const value = useMemo(
    () => ({ open, openTithe, closeTithe }),
    [open, openTithe, closeTithe],
  );

  return (
    <TitheModalContext.Provider value={value}>
      {children}
    </TitheModalContext.Provider>
  );
}

export function useTitheModal() {
  const ctx = useContext(TitheModalContext);
  if (!ctx) {
    throw new Error("useTitheModal debe usarse dentro de <TitheModalProvider>");
  }
  return ctx;
}
