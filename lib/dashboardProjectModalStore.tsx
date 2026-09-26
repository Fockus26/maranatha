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
 * Estado global del modal "Crear/editar proyecto" del dashboard — antes
 * vivía como estado local de `app/dashboard/proyectos/page.tsx` (D045), pero
 * el botón "Nuevo proyecto" de Resumen (D059) necesita poder abrirlo sin
 * navegar primero a `/dashboard/proyectos`. Mismo criterio que
 * `titheModalStore.tsx` (D049): el botón que lo abre vive en más de una
 * página, así que el modal se monta una sola vez (`DashboardProjectModal` en
 * `app/dashboard/layout.tsx`) y se controla vía Context en vez de
 * prop-drilling o de reinstanciar el modal por página.
 */

interface DashboardProjectModalContextValue {
  open: boolean;
  editingId: string | null;
  openCreate: () => void;
  openEdit: (id: string) => void;
  close: () => void;
}

const DashboardProjectModalContext =
  createContext<DashboardProjectModalContextValue | null>(null);

export function DashboardProjectModalProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const openCreate = useCallback(() => {
    setEditingId(null);
    setOpen(true);
  }, []);

  const openEdit = useCallback((id: string) => {
    setEditingId(id);
    setOpen(true);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setEditingId(null);
  }, []);

  const value = useMemo(
    () => ({ open, editingId, openCreate, openEdit, close }),
    [open, editingId, openCreate, openEdit, close],
  );

  return (
    <DashboardProjectModalContext.Provider value={value}>
      {children}
    </DashboardProjectModalContext.Provider>
  );
}

export function useDashboardProjectModal() {
  const ctx = useContext(DashboardProjectModalContext);
  if (!ctx) {
    throw new Error(
      "useDashboardProjectModal debe usarse dentro de <DashboardProjectModalProvider>",
    );
  }
  return ctx;
}
