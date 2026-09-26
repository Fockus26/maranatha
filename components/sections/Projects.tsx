"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

  return (
    <Box component="section" id="proyectos" sx={{ py: { xs: 8, md: 12 } }}>
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
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
              }}
            >
              Proyectos
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: { xs: "28px", md: "38px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "text.primary",
                mb: 2,
              }}
            >
              Construimos juntos lo que la comunidad necesita
            </Typography>

            <Typography
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              Cada proyecto es una necesidad real de la iglesia — tu aporte hace
              la diferencia.
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: "24px",
              mb: { xs: 5, md: 6 },
            }}
          >
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
                onCtaClick={() => router.push(`/proyectos/${project.slug}`)}
              />
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            <Button
              href="/proyectos"
              variant="outlined"
              color="primary"
              size="large"
              endIcon={<ArrowForwardRoundedIcon />}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 600,
              }}
            >
              Ver todos los proyectos
            </Button>
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
