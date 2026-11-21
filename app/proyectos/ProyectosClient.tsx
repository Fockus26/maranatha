"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LayoutGrid, List, SearchX } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";
import Footer from "@/components/layout/Footer";
import PageNavbar from "@/components/layout/PageNavbar";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProjectCard } from "@/components/ui/ProjectCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { breadcrumbJsonLd } from "@/lib/jsonLd";
import type { ProjectRecord } from "@/lib/projectsData";
import { cn } from "@/lib/utils";

/**
 * Página "Proyectos" (`/proyectos`, fase 07, D044) — listado completo, a
 * diferencia de los 3 destacados en Home (`components/sections/Projects.tsx`,
 * D041). Usa `ProjectCard` sin modificarlo, alternando entre sus dos layouts
 * ya existentes (D016) según `viewMode` — ver nota más abajo.
 *
 * Filtro: tabs "Todos / Activos / Completados" (elegido explícitamente por el
 * cliente entre 3 opciones — tabs / chips+orden / sidebar de filtros) —
 * filtra por el único dato categórico real que existe hoy (estado); no hay
 * más de un criterio de filtro por ahora, así que un control más pesado
 * (sidebar) no se justifica.
 *
 * Datos: `lib/projectsData.ts`, compartidos con el detalle (`/proyectos/[slug]`)
 * y el dashboard — mismo criterio de contenido placeholder que el resto del
 * sitio.
 */

type FilterTab = "all" | "active" | "completed";
type ViewMode = "list" | "grid";

const EASE = [0.2, 0.8, 0.2, 1] as const;

export function ProyectosClient({ projects }: { projects: ProjectRecord[] }) {
  const [tab, setTab] = useState<FilterTab>("all");
  // Toggle lista / cuadrícula (D016 — `ProjectCard` ya tiene ambos layouts).
  // Solo se muestra desde `sm` en adelante; en mobile no aparece y siempre
  // se renderiza en cuadrícula (`vertical`, una columna) — que es el default.
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filtered = useMemo(() => {
    if (tab === "all") return projects;
    return projects.filter((project) => project.status === tab);
  }, [tab, projects]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Inicio", path: "/" },
          { name: "Proyectos", path: "/proyectos" },
        ])}
      />
      <PageNavbar />

      <main id="main-content" className="py-8 md:py-12">
        <Container maxWidth="lg">
          <div className="mb-5 max-w-160 md:mb-7">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em] wide:text-13">
              Proyectos
            </span>

            <h1 className="m-0 mb-2 font-extrabold font-heading text-32 text-foreground leading-[1.15] tracking-[-0.01em] md:text-[44px] wide:text-54">
              Todos los proyectos
            </h1>

            <p className="m-0 font-body text-16 text-muted-foreground leading-body wide:text-19">
              Cada proyecto es una necesidad real de la iglesia — tu aporte hace
              la diferencia.
            </p>
          </div>

          {/* El indicador del tab usa el naranja de marca a toda intensidad
              (línea de 2px, no compite); el TEXTO del tab activo baja a
              `secondary[700]` (`[300]` en oscuro, D051): el naranja vivo se
              leía demasiado intenso como color de texto. Ambos ya vienen en
              `TabsTrigger` (D119). */}
          <Tabs
            value={tab}
            onValueChange={(value) => setTab(value as FilterTab)}
          >
            <div className="mb-4 flex items-center justify-between gap-2 md:mb-5">
              <TabsList aria-label="Filtrar proyectos por estado">
                <TabsTrigger value="all">Todos ({projects.length})</TabsTrigger>
                <TabsTrigger value="active">
                  Activos (
                  {projects.filter((p) => p.status === "active").length})
                </TabsTrigger>
                <TabsTrigger value="completed">
                  Completados (
                  {projects.filter((p) => p.status === "completed").length})
                </TabsTrigger>
              </TabsList>

              {/* Toggle lista / cuadrícula — oculto en mobile (< sm). */}
              <fieldset
                aria-label="Vista del listado"
                className="m-0 hidden min-w-0 shrink-0 overflow-hidden rounded-md border border-border p-0 sm:inline-flex"
              >
                <ViewButton
                  active={viewMode === "list"}
                  label="Ver en lista"
                  onClick={() => setViewMode("list")}
                >
                  <List className="size-5" aria-hidden />
                </ViewButton>
                <div aria-hidden className="w-px bg-border" />
                <ViewButton
                  active={viewMode === "grid"}
                  label="Ver en cuadrícula"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="size-5" aria-hidden />
                </ViewButton>
              </fieldset>
            </div>

            <TabsContent value={tab}>
              {filtered.length === 0 ? (
                <EmptyState
                  icon={SearchX}
                  title="No hay proyectos en esta categoría"
                  description="Prueba con otra pestaña para ver el resto de los proyectos."
                  ctaLabel={
                    tab !== "all" ? "Ver todos los proyectos" : undefined
                  }
                  onCtaClick={tab !== "all" ? () => setTab("all") : undefined}
                />
              ) : (
                // `layout` en el contenedor y en cada card anima con FLIP
                // (framer-motion) el reflow al cambiar de tab o de vista — mismo
                // criterio de easing/duración que el resto del sitio.
                <motion.div
                  layout
                  transition={{ duration: 0.45, ease: EASE }}
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
                      : "flex flex-col gap-3"
                  }
                >
                  <AnimatePresence mode="popLayout">
                    {filtered.map((project) => (
                      <motion.div
                        key={project.slug}
                        layout
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: EASE }}
                      >
                        <ProjectCard
                          layout={
                            viewMode === "grid" ? "vertical" : "horizontal"
                          }
                          title={project.title}
                          description={project.description}
                          imageUrl={project.imageUrl}
                          status={project.status}
                          currentAmount={project.currentAmount}
                          goalAmount={project.goalAmount}
                          ctaHref={`/proyectos/${project.slug}`}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </TabsContent>
          </Tabs>
        </Container>
      </main>

      <Footer />
    </>
  );
}

/** Botón del toggle lista / cuadrícula (`aria-pressed`, 30 px como el `IconButton` small). */
function ViewButton({
  active,
  label,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Button
      variant="plain"
      size="icon"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "size-7.5 rounded-none p-1.25 hover:bg-primary/8 hover:text-primary dark:hover:bg-primary/8 dark:hover:text-primary",
        active
          ? "bg-primary/8 text-primary dark:text-primary"
          : "text-muted-foreground dark:text-muted-foreground",
      )}
    >
      {children}
    </Button>
  );
}
