"use client";

import { type ReactNode, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /**
   * Antes era `string` — pasa a `ReactNode` para que quien lo use pueda
   * resaltar partes del mensaje (ej. el nombre del elemento a eliminar en
   * negrita, D062) sin depender de HTML crudo dentro de un string.
   */
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * Quien lo usa cierra el diálogo cuando la acción sale bien: si falla (red
   * caída, 500), queda abierto para reintentar (QA 20-10-2026).
   */
  onConfirm: () => void;
  onClose: () => void;
  /** Acción en curso: deshabilita los botones y evita cerrar a mitad. */
  pending?: boolean;
}

/**
 * Confirmación modal sobre el `dialog` de shadcn (D117). Mismo contrato que
 * la versión MUI: con `pending` no se cierra ni con Escape ni con clic fuera.
 * Radix atrapa el Tab dentro; el foco vuelve a quien lo abrió. Se porta a
 * `body` también cuando lo abre un `sheet` o un `dialog` de Radix (la pila de
 * capas de Radix lo pone encima): sin el papel MUI de antes (D134).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onClose,
  pending = false,
}: ConfirmDialogProps) {
  // Radix solo devuelve el foco a su `DialogTrigger`; aquí el diálogo es
  // controlado y no tiene uno: se guarda el elemento que lo abrió.
  const openerRef = useRef<HTMLElement | null>(null);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !pending) onClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        // El foco inicial va al botón de cancelar (el primero), no al de
        // confirmar: una acción destructiva no debe quedar a un Enter.
        onOpenAutoFocus={() => {
          openerRef.current = document.activeElement as HTMLElement | null;
        }}
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          openerRef.current?.focus();
        }}
        onEscapeKeyDown={(e) => {
          if (pending) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (pending) e.preventDefault();
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription asChild>
          <div>{description}</div>
        </DialogDescription>
        <DialogFooter className="mt-3">
          <Button
            onClick={onClose}
            color="primary"
            variant="outlined"
            disabled={pending}
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={pending}
            color={destructive ? "error" : "secondary"}
            variant="contained"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
