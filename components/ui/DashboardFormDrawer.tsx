"use client";

import { LoaderCircle, X } from "lucide-react";
import { type ReactNode, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "./ConfirmDialog";

export interface DashboardFormDrawerProps {
  open: boolean;
  title: string;
  /** `id` del `<form>` del contenido: el botón Guardar del pie lo envía con `form=`. */
  formId: string;
  /** Hay cambios sin guardar: cerrar pide confirmación. */
  dirty: boolean;
  /** Guardado en curso: deshabilita los botones y evita cerrar. */
  saving?: boolean;
  submitLabel?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Panel lateral derecho de los formularios de crear/editar del dashboard
 * (D096), sobre el `sheet` de shadcn (D134): cabecera fija con título y
 * cerrar, cuerpo con scroll propio y pie fijo con Cancelar / Guardar. Desde
 * `md` mide `max-w-form-drawer`; debajo, la pantalla completa. Cerrar (X,
 * Cancelar, Esc o clic fuera) con cambios sin guardar abre un `ConfirmDialog`.
 * El `<form>` vive en `children` y se envía desde el pie por el atributo
 * `form`. Se abre sin `SheetTrigger` (desde un store o un botón de la
 * página): guarda quién lo abrió y le devuelve el foco al cerrar (D129).
 */
export function DashboardFormDrawer({
  open,
  title,
  formId,
  dirty,
  saving = false,
  submitLabel = "Guardar",
  onClose,
  children,
}: DashboardFormDrawerProps) {
  const [confirmingClose, setConfirmingClose] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  function requestClose() {
    if (saving) return;
    if (dirty) setConfirmingClose(true);
    else onClose();
  }

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
        }}
      >
        <SheetContent
          side="right"
          showCloseButton={false}
          aria-describedby={undefined}
          className="overflow-hidden"
          onOpenAutoFocus={(event) => {
            // El foco va al primer campo del formulario, no al botón Cerrar
            // de la cabecera (el primero del orden de tabulación).
            openerRef.current = document.activeElement as HTMLElement | null;
            const first = bodyRef.current?.querySelector<HTMLElement>(
              "input:not([type=hidden]):not([disabled]),textarea,[role=radio][data-state=checked]",
            );
            if (first) {
              event.preventDefault();
              first.focus();
            }
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            openerRef.current?.focus();
          }}
        >
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2.5 sm:px-4">
            <SheetTitle asChild>
              <h2>{title}</h2>
            </SheetTitle>
            <Button
              variant="plain"
              size="icon"
              aria-label="Cerrar"
              onClick={requestClose}
              disabled={saving}
              className="size-11 text-muted-foreground dark:text-muted-foreground"
            >
              <X aria-hidden="true" className="size-5" />
            </Button>
          </div>

          <div
            ref={bodyRef}
            className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-4"
          >
            {children}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border bg-card px-3 py-2.5 sm:px-4">
            <Button variant="action" onClick={requestClose} disabled={saving}>
              Cancelar
            </Button>
            <Button
              type="submit"
              form={formId}
              variant="contained"
              color="primary"
              disabled={saving}
              aria-busy={saving || undefined}
            >
              <span className={cn(saving && "invisible")}>{submitLabel}</span>
              {saving && (
                <>
                  <LoaderCircle
                    aria-hidden="true"
                    className="absolute size-5 animate-spin motion-reduce:animate-none"
                  />
                  <span className="sr-only">Guardando…</span>
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmingClose}
        title="¿Descartar los cambios?"
        description="Hay cambios sin guardar. Si cierras el panel se perderán."
        confirmLabel="Descartar"
        cancelLabel="Seguir editando"
        destructive
        onConfirm={() => {
          setConfirmingClose(false);
          onClose();
        }}
        onClose={() => setConfirmingClose(false)}
      />
    </>
  );
}

/** Subtítulo de sección dentro del cuerpo del panel (h3). */
export function DrawerSection({
  title,
  action,
  children,
  first,
  className,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(!first && "mt-4 border-t border-border pt-4", className)}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="font-heading text-14 font-semibold text-foreground">
          {title}
        </h3>
        {action}
      </div>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}
