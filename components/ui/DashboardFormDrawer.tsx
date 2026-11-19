"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { type ReactNode, useId, useState } from "react";
import { fontScale, formDrawer, typography } from "@/theme/tokens";
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
 * (D096): cabecera fija con título y cerrar, cuerpo con scroll propio y pie
 * fijo con Cancelar / Guardar. Desde `md` mide `formDrawer.width`; debajo, la
 * pantalla completa. Cerrar (X, Cancelar, Esc o clic fuera) con cambios sin
 * guardar abre un `ConfirmDialog`. El `<form>` vive en `children` y se envía
 * desde el pie por el atributo `form`.
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
  const theme = useTheme();
  const titleId = useId();
  const [confirmingClose, setConfirmingClose] = useState(false);

  function requestClose() {
    if (saving) return;
    if (dirty) setConfirmingClose(true);
    else onClose();
  }

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={requestClose}
        slotProps={{
          paper: {
            // `elevation: 0`: sin el overlay blanco de MUI en oscuro (D057).
            elevation: 0,
            role: "dialog",
            "aria-modal": true,
            "aria-labelledby": titleId,
            sx: {
              width: { xs: "100%", md: formDrawer.width },
              maxWidth: "100%",
              backgroundImage: "none",
              display: "flex",
              flexDirection: "column",
            },
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: { xs: 3, sm: 4 },
            py: 2.5,
            borderBottom: `1px solid ${theme.palette.divider}`,
            flexShrink: 0,
          }}
        >
          <Typography
            id={titleId}
            component="h2"
            sx={{
              fontFamily: typography.fontFamily.heading,
              fontWeight: 700,
              fontSize: fontScale[20],
              color: theme.palette.text.primary,
            }}
          >
            {title}
          </Typography>
          <IconButton
            onClick={requestClose}
            aria-label="Cerrar"
            disabled={saving}
            sx={{ color: theme.palette.text.secondary }}
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            px: { xs: 3, sm: 4 },
            py: 4,
          }}
        >
          {children}
        </Box>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: 2,
            px: { xs: 3, sm: 4 },
            py: 2.5,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            flexShrink: 0,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            color="primary"
            onClick={requestClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={formId}
            variant="contained"
            color="primary"
            loading={saving}
          >
            {submitLabel}
          </Button>
        </Box>
      </Drawer>

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
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  first?: boolean;
}) {
  const theme = useTheme();
  return (
    <Box
      component="section"
      sx={{
        pt: first ? 0 : 4,
        mt: first ? 0 : 4,
        borderTop: first ? 0 : `1px solid ${theme.palette.divider}`,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 600,
            fontSize: fontScale[14],
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
        {action}
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {children}
      </Box>
    </Box>
  );
}
