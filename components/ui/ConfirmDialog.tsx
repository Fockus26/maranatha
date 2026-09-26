"use client";

import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import type { ReactNode } from "react";

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
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    // `elevation: 0` — el Paper del Dialog usa `elevation={24}` por defecto y
    // en modo oscuro MUI le suma automáticamente un overlay blanco
    // translúcido proporcional a la elevación, lo que aclara el fondo del
    // modal más de lo esperado (mismo diagnóstico que `TitheModal`, D057/D058).
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { elevation: 0 } }}
    >
      {/* Feedback de cliente: el modal de confirmar (usado para eliminar
          proyecto, entre otros) se sentía "apretado" — se sube el padding
          horizontal/vertical en las 3 secciones del dialog en vez de dejar
          el default de MUI (16-20px). */}
      <DialogTitle sx={{ fontWeight: 700, px: 3.5, pt: 3.5, pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent sx={{ px: 3.5, pb: 1 }}>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3.5, pb: 3.5, pt: 1.5 }}>
        <Button onClick={onClose} color="primary" variant="outlined">
          {cancelLabel}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          color={destructive ? "error" : "secondary"}
          variant="contained"
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
