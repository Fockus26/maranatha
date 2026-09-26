"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
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
    <Box component="section" id="historia" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box
            sx={{
              maxWidth: 640,
              mx: { xs: "auto", md: 0 },
              textAlign: { xs: "center", md: "left" },
              mb: { xs: 5, md: 7 },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 11,
                "@media (min-width:1920px)": { fontSize: "13px" },
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
              }}
            >
              Nuestra historia
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: { xs: "28px", md: "38px" },
                "@media (min-width:1920px)": { fontSize: "46px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "text.primary",
                mb: 2,
              }}
            >
              Once años de fe, en unos pocos pasos
            </Typography>

            <Typography
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                "@media (min-width:1920px)": { fontSize: "19px" },
                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              De un grupo pequeño a una familia que crece cada año, en cinco
              áreas de servicio y una sola comunidad.
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.12}>
          <Box sx={{ maxWidth: 720, mx: { xs: "auto", md: 0 } }}>
            {HISTORY_MILESTONES.map((milestone, index) => (
              <TimelineItem
                key={milestone.year}
                year={milestone.year}
                title={milestone.title}
                description={milestone.description}
                progress={index / (HISTORY_MILESTONES.length - 1)}
              />
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
