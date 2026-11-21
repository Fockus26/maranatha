"use client";

import { ArrowRight } from "lucide-react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { ProjectCard, type ProjectStatus } from "@/components/ui/ProjectCard";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Sección "Proyectos" (fase 06) — componente + datos en un solo archivo (D030).
 *
 * Es un **resumen** (destacados), no el listado completo — ese vive en `/proyectos`
 * (aún no construida, fase 07, ver PAGE_INVENTORY.md). Reutiliza `ProjectCard`
 * (`components/ui/ProjectCard.tsx`, D016) en su layout `vertical`, sin modificarlo.
 *
 * Heading: mismo patrón izquierda/centrado (D032) que el resto de secciones de Home.
 *
 * CTA de cada card ("Aportar"/"Ver proyecto"): ya viene resuelto por `ProjectCard`
 * (naranja `contained` para activos, `outlined` para completados — D011, D016). El
 * click navega a la página de detalle `/proyectos/[slug]` (aún no construida, fase 07
 * — mismo patrón que el link a `/historia` en la sección Historia).
 *
 * CTA de la sección ("Ver todos los proyectos"): outlined `color="primary"`, no lleva
 * naranja — no es un CTA de aporte en sí mismo, solo navegación (mismo criterio que
 * "Ver canal de YouTube" en Prédicas y "Ver historia completa" en Historia).
 *
 * Contenido placeholder: los 3 proyectos destacados (títulos, descripciones, montos,
 * fotos) son marcadores — pendientes de que el cliente entregue los proyectos reales
 * (o de que existan en el dashboard, D023, aún fuera de alcance de esta fase).
 */

interface FeaturedProject {
  slug: string;
  title: string;
  description: string;
  imageUrl: string;
  status: ProjectStatus;
  currentAmount: number;
  goalAmount: number;
}

const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    slug: "techo-para-el-salon-multiusos",
    title: "Techo para el salón multiusos",
    description:
      "Reemplazamos el techo del salón que usamos para jóvenes, conferencias y eventos comunitarios — hoy tiene filtraciones cada temporada de lluvia.",
    imageUrl:
      "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&h=600&fit=crop&q=80",
    status: "active",
    currentAmount: 3200,
    goalAmount: 8000,
  },
  {
    slug: "equipamiento-para-el-area-de-ninos",
    title: "Equipamiento para el área de niños",
    description:
      "Mobiliario, materiales didácticos y mejoras de seguridad para el espacio donde cuidamos a los más pequeños cada domingo.",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=600&fit=crop&q=80",
    status: "active",
    currentAmount: 1450,
    goalAmount: 3000,
  },
  {
    slug: "campana-de-bautismos-2025",
    title: "Campaña de bautismos 2025",
    description:
      "Cubrimos los costos de logística y materiales de la jornada de bautismos del año pasado, con más de 40 personas participando.",
    imageUrl:
      "https://images.unsplash.com/photo-1470114716159-e389f8712fda?w=800&h=600&fit=crop&q=80",
    status: "completed",
    currentAmount: 2100,
    goalAmount: 2100,
  },
];

export function Projects() {
  return (
    <section id="proyectos" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em]">
              Proyectos
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-[-0.01em] md:text-[38px]">
              Construimos juntos lo que la comunidad necesita
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body">
              Cada proyecto es una necesidad real de la iglesia — tu aporte hace
              la diferencia.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mb-6 lg:grid-cols-3">
            {FEATURED_PROJECTS.map((project) => (
              <ProjectCard
                key={project.slug}
                layout="vertical"
                title={project.title}
                description={project.description}
                imageUrl={project.imageUrl}
                status={project.status}
                currentAmount={project.currentAmount}
                goalAmount={project.goalAmount}
                ctaHref={`/proyectos/${project.slug}`}
              />
            ))}
          </div>

          <div className="flex justify-center md:justify-start">
            <Button
              asChild
              variant="outlined"
              color="primary"
              size="large"
              className="rounded-md font-semibold"
            >
              <NextLink href="/proyectos">
                Ver todos los proyectos
                <ArrowRight aria-hidden className="size-5" />
              </NextLink>
            </Button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
