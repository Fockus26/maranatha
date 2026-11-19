"use client";

import { useId, useState } from "react";
import { useDashboardProjectModal } from "@/lib/dashboardProjectModalStore";
import { useDashboardProjects } from "@/lib/dashboardProjectsStore";
import { DashboardFormDrawer } from "./DashboardFormDrawer";
import {
  DashboardProjectForm,
  type DashboardProjectFormValues,
} from "./DashboardProjectForm";

/**
 * Formulario "Crear/editar proyecto" del dashboard — montado una sola vez en
 * `app/dashboard/layout.tsx` (mismo patrón que `TitheModal`, D049) para que
 * tanto Resumen como Proyectos puedan abrirlo (`useDashboardProjectModal`)
 * sin duplicarlo ni navegar primero.
 *
 * Desde D096 ya no es un Dialog: se abre en el panel lateral compartido
 * `DashboardFormDrawer` (reemplaza la decisión de modal a pantalla completa
 * en móvil de D065: el panel ocupa toda la pantalla bajo `md`). El guardado
 * y la validación no cambian.
 */
export function DashboardProjectModal() {
  const formId = useId();
  const [dirty, setDirty] = useState(false);
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
    setDirty(false);
    close();
  }

  return (
    <DashboardFormDrawer
      open={open}
      title={editingId ? "Editar proyecto" : "Nuevo proyecto"}
      formId={formId}
      dirty={dirty}
      onClose={() => {
        setDirty(false);
        close();
      }}
    >
      <DashboardProjectForm
        key={editingId ?? "new"}
        formId={formId}
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onDirtyChange={setDirty}
      />
    </DashboardFormDrawer>
  );
}
