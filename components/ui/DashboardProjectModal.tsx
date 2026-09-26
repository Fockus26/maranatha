"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import {
  DashboardProjectForm,
  type DashboardProjectFormValues,
} from "./DashboardProjectForm";

/**
 * Modal "Crear/editar proyecto" del dashboard — montado una sola vez en
 * `app/dashboard/layout.tsx` (mismo patrón que `TitheModal`, D049) para que
 * tanto Resumen como Proyectos puedan abrirlo (`useDashboardProjectModal`)
 * sin duplicar el Dialog ni navegar primero.
 *
 * Revisión (feedback del cliente): altura fija `95vh` con scroll interno del
 * contenido (antes el Dialog crecía con el contenido y usaba `scroll="body"`,
 * lo que scrolleaba la página entera en vez del modal) — `DashboardProjectForm`
 * ahora se usa con la prop `bare` para no duplicar el borde/fondo/padding que
 * ya aporta el propio `Dialog` (antes se veía como una tarjeta blanca flotando
 * sobre el fondo de otra tarjeta, con espacio "de más" alrededor).
 *
 * Segunda revisión (feedback directo del cliente, ronda post-fase 08): el
 * modal pasa a `fullScreen` — mismo criterio que `TitheModal` (D048/fase 07):
 * en vez de un dialog centrado de ancho medio, ocupa toda la pantalla en
 * cualquier tamaño. `DialogContent` sigue haciendo scroll interno igual que
 * antes (MUI ya le da `overflowY: auto` por defecto con `scroll="paper"`),
 * solo que ahora el "paper" es la pantalla completa en vez de un recuadro de
 * 95vh centrado.
 *
 * Tercera revisión (feedback puntual, fase 09): el `fullScreen` fijo se
 * pasó de largo — el cliente solo lo pedía para mobile, no para desktop
 * (a diferencia de `TitheModal`, que sí es fullScreen siempre por decisión
 * explícita, D050). Acá `fullScreen` ahora depende de `useMediaQuery` contra
 * el mismo breakpoint `sm` que usa el resto del sitio para "es mobile"
 * (D064) — en desktop vuelve a ser un dialog centrado con alto acotado
 * (`95vh`, criterio de D060, previo a que D065 lo pasara a fullScreen sin
 * distinguir tamaño de pantalla).
 */
export function DashboardProjectModal() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { open, editingId, close } = useDashboardProjectModal();
  const { projects, addProject, updateProject } = useDashboardProjects();

  const editingProject = editingId
    ? projects.find((project) => project.id === editingId)
    : undefined;

  const initialValues: Partial<DashboardProjectFormValues> | undefined =
    editingProject
      ? {
          title: editingProject.title,
          description: editingProject.description,
          imageUrl: editingProject.imageUrl,
          goalAmount: editingProject.goalAmount,
          currentAmount: editingProject.currentAmount,
          deadline: editingProject.deadline,
          budget: editingProject.budget,
          encargados: editingProject.encargados,
        }
      : undefined;

  function handleSubmit(values: DashboardProjectFormValues) {
    if (editingId) {
      updateProject(editingId, values);
    } else {
      addProject(values);
    }
    close();
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      fullScreen={isMobile}
      fullWidth={!isMobile}
      maxWidth={isMobile ? undefined : "md"}
      slotProps={{
        // `elevation: 0` — mismo diagnóstico que `TitheModal`/`ConfirmDialog`
        // (D057/D058/D061): sin esto, el overlay blanco automático de MUI en
        // modo oscuro aclaraba el fondo del modal más de lo esperado.
        paper: {
          elevation: 0,
          sx: isMobile
            ? { borderRadius: 0 }
            : { height: "95vh", maxHeight: "95vh" },
        },
      }}
    >
      <IconButton
        onClick={close}
        aria-label="Cerrar"
        sx={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1,
          color: theme.palette.text.secondary,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          "&:hover": {
            borderColor: theme.palette.secondary.main,
            color: theme.palette.secondary.main,
          },
        }}
      >
        <CloseRoundedIcon fontSize="small" />
      </IconButton>
      {/* Sin maxWidth: el contenido ocupa todo el ancho del modal (antes
          quedaba en 640px centrado, con franjas vacías a los lados y la
          barra de scroll a mitad del modal). */}
      <DialogContent
        sx={{ p: { xs: 3, sm: 5 }, pt: { xs: 6, sm: 6.5 }, width: "100%" }}
      >
        <DashboardProjectForm
          key={editingId ?? "new"}
          bare
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onCancel={close}
        />
      </DialogContent>
    </Dialog>
  );
}
