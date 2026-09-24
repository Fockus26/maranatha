"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { PROJECTS } from "./projectsData";
import type { ProjectStatus } from "@/components/ui/ProjectCard";
import type { DashboardProjectFormValues } from "@/components/ui/DashboardProjectForm";

/**
 * Estado del dashboard de proyectos (fase 07, D045) — vive solo en memoria
 * (React Context), sembrado a partir de `lib/projectsData.ts`. No hay backend
 * todavía: crear/editar/eliminar acá **no** modifica el listado público
 * (`/proyectos`) ni el detalle (`/proyectos/[slug]`), que siguen leyendo el
 * array estático — mismo criterio de placeholder que el resto del sitio
 * (`onSubmit` de Tithe/Aporte, D042). El estado se comparte entre `/dashboard`
 * y `/dashboard/proyectos` (vía `DashboardProjectsProvider` en
 * `app/dashboard/layout.tsx`) para que ambas páginas reflejen los mismos
 * datos durante la sesión, aunque se pierdan al recargar.
 *
 * El formulario del dashboard (`DashboardProjectForm`, D023) no tiene un
 * campo de descripción larga separado — al editar un proyecto sembrado desde
 * `lib/projectsData.ts` se usa su `description` corta (no `longDescription`).
 */

export interface DashboardProject {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  goalAmount: number;
  currentAmount: number;
  deadline: string;
  budget: { id: string; label: string; amount: number }[];
  encargados: { id: string; name: string; role: string; imageUrl: string; instagramUrl: string }[];
}

export interface DashboardProjectWithStatus extends DashboardProject {
  status: ProjectStatus;
  deadlineLabel: string;
}

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
}

function statusOf(project: DashboardProject): ProjectStatus {
  return project.goalAmount > 0 && project.currentAmount >= project.goalAmount ? "completed" : "active";
}

function formatDeadlineLabel(deadline: string): string {
  if (!deadline) return "Sin fecha";
  const date = new Date(`${deadline}T00:00:00`);
  if (Number.isNaN(date.getTime())) return deadline;
  return new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function withDerived(project: DashboardProject): DashboardProjectWithStatus {
  return { ...project, status: statusOf(project), deadlineLabel: formatDeadlineLabel(project.deadline) };
}

// `raisedBySlug`: pagos confirmados por proyecto (Supabase), sumados al
// monto base del array estático — los lee el layout del dashboard en el servidor.
function seedProjects(raisedBySlug: Record<string, number>): DashboardProject[] {
  return PROJECTS.map((project) => ({
    id: project.slug,
    title: project.title,
    description: project.description,
    imageUrl: project.imageUrl,
    goalAmount: project.goalAmount,
    currentAmount: project.currentAmount + (raisedBySlug[project.slug] ?? 0),
    deadline: project.deadline,
    budget: project.budget.map((line) => ({ id: newId(), label: line.label, amount: line.amount })),
    encargados: project.encargados.map((encargado) => ({
      id: newId(),
      name: encargado.name,
      role: encargado.role,
      imageUrl: encargado.imageUrl,
      instagramUrl: encargado.instagramUrl ?? "",
    })),
  }));
}

interface DashboardProjectsContextValue {
  projects: DashboardProjectWithStatus[];
  /**
   * Fase 09 (D067) — patrón de loading elegido por el cliente entre 3
   * opciones (skeleton screens / spinner en botón / barra superior):
   * skeleton screens. No hay backend real todavía (D045), así que no hay
   * ninguna espera real que mostrar hoy — se simula una carga inicial breve
   * (600ms) al montar el Provider, únicamente para dejar el patrón
   * implementado y listo para cuando exista un fetch real; `DashboardTable`
   * y `DashboardStatBand` leen este flag para renderizar sus `Skeleton` en
   * vez de contenido.
   */
  isLoading: boolean;
  addProject: (values: DashboardProjectFormValues) => void;
  updateProject: (id: string, values: DashboardProjectFormValues) => void;
  deleteProject: (id: string) => void;
}

const DashboardProjectsContext = createContext<DashboardProjectsContextValue | null>(null);

export function DashboardProjectsProvider({
  children,
  raisedBySlug = {},
}: {
  children: ReactNode;
  raisedBySlug?: Record<string, number>;
}) {
  const [projects, setProjects] = useState<DashboardProject[]>(() => seedProjects(raisedBySlug));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const addProject = useCallback((values: DashboardProjectFormValues) => {
    setProjects((prev) => [
      ...prev,
      {
        id: newId(),
        title: values.title,
        description: values.description,
        imageUrl: values.imageUrl,
        goalAmount: values.goalAmount,
        currentAmount: values.currentAmount,
        deadline: values.deadline,
        budget: values.budget,
        encargados: values.encargados,
      },
    ]);
  }, []);

  const updateProject = useCallback((id: string, values: DashboardProjectFormValues) => {
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id
          ? {
              ...project,
              title: values.title,
              description: values.description,
              imageUrl: values.imageUrl,
              goalAmount: values.goalAmount,
              currentAmount: values.currentAmount,
              deadline: values.deadline,
              budget: values.budget,
              encargados: values.encargados,
            }
          : project,
      ),
    );
  }, []);

  const deleteProject = useCallback((id: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  const value = useMemo<DashboardProjectsContextValue>(
    () => ({ projects: projects.map(withDerived), isLoading, addProject, updateProject, deleteProject }),
    [projects, isLoading, addProject, updateProject, deleteProject],
  );

  return <DashboardProjectsContext.Provider value={value}>{children}</DashboardProjectsContext.Provider>;
}

export function useDashboardProjects() {
  const ctx = useContext(DashboardProjectsContext);
  if (!ctx) throw new Error("useDashboardProjects debe usarse dentro de DashboardProjectsProvider");
  return ctx;
}
