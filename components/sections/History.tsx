"use client";

import { Container } from "@/components/ui/container";
import { Reveal } from "@/components/ui/Reveal";
import { TimelineItem } from "@/components/ui/TimelineItem";

/**
 * Sección "Historia" (fase 06) — componente + datos en un solo archivo (D030).
 *
 * Es un **resumen** de la línea de tiempo completa, no la página completa (esa vive en
 * `/historia`, aún no construida — fase 07, ver PAGE_INVENTORY.md). Reutiliza `TimelineItem`
 * (`components/ui/TimelineItem.tsx`, D015), ya cerrado en fase 04, sin modificarlo: la versión
 * de Home solo muestra un subconjunto de hitos (los más relevantes, no todos).
 *
 * Heading: mismo patrón izquierda/centrado (D032) que el resto de secciones de Home.
 *
 * Revisión (fase 07): se quitó la página `/historia` y su CTA "Ver historia completa" —
 * esta sección resumen de Home es ahora la única superficie de "Historia" del sitio, así
 * que ya no tiene sentido un link hacia una página completa que ya no existe.
 *
 * Contenido placeholder: los hitos (años, títulos, descripciones) son marcadores basados en el
 * stat "11 años sirviendo" del Hero — pendientes de que el cliente confirme la línea de tiempo
 * real. `HISTORY_MILESTONES` es un subconjunto deliberado; cuando exista `/historia` (fase 07)
 * probablemente tendrá más hitos que los que se muestran aquí.
 */

interface Milestone {
  year: string;
  title: string;
  description: string;
}

const HISTORY_MILESTONES: Milestone[] = [
  {
    year: "2015",
    title: "Un grupo pequeño, un mismo propósito",
    description:
      "Un puñado de familias comienza a reunirse en una casa, con el deseo de compartir el evangelio en el barrio.",
  },
  {
    year: "2019",
    title: "Nuestro primer templo propio",
    description:
      "La congregación crece y estrena un espacio propio, dejando atrás los salones prestados de los primeros años.",
  },
  {
    year: "2022",
    title: "Cinco áreas, una sola familia",
    description:
      "Alabanza, jóvenes, niños, oración y servicio comunitario se consolidan como los pilares de todo lo que hacemos.",
  },
  {
    year: "2026",
    title: "Once años sirviendo a la comunidad",
    description:
      "Hoy somos más de 400 personas sirviendo juntas, con la misma convicción del primer día.",
  },
];

export function History() {
  return (
    <section id="historia" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-eyebrow-lg wide:text-13">
              Nuestra historia
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-tight md:text-38 wide:text-46">
              Once años de fe, en unos pocos pasos
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body wide:text-19">
              De un grupo pequeño a una familia que crece cada año, en cinco
              áreas de servicio y una sola comunidad.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mx-auto max-w-180 md:mx-0">
            {HISTORY_MILESTONES.map((milestone, index) => (
              <TimelineItem
                key={milestone.year}
                year={milestone.year}
                title={milestone.title}
                description={milestone.description}
                progress={index / (HISTORY_MILESTONES.length - 1)}
              />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
