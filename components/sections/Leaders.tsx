"use client";

import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { LeaderCard } from "@/components/ui/LeaderCard";
import { Reveal } from "@/components/ui/Reveal";

/**
 * Sección "Liderazgo" (fase 06) — componente + datos en un solo archivo,
 * mismo criterio que ServiceAreas.tsx (D030): un archivo por sección.
 *
 * Heading — mismo patrón que Áreas de Servicio: eyebrow + título + copy
 * corto, izquierda en desktop (`md`+) y centrado de tablet para abajo.
 * Se reutiliza el mismo tratamiento para mantener el heading de las
 * secciones de Home consistente, no porque esta sección lo haya definido
 * de cero.
 *
 * Datos y fotos — mismos 4 líderes que ya existían (Daniel Ramírez, Andrea
 * Torres, Carlos Medina, Valeria Soto), sin cambios. La foto de Carlos
 * Medina también se reutiliza en ServiceAreas para la card "Jóvenes" (D031)
 * — coherente, ya que aquí mismo está descrito como "Líder de jóvenes".
 */

const LEADERS = [
  {
    name: "Daniel Ramírez",
    role: "Pastor principal",
    imageUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&q=80",
    instagramUrl: "https://instagram.com",
  },
  {
    name: "Andrea Torres",
    role: "Líder de alabanza",
    imageUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&h=800&fit=crop&q=80",
    instagramUrl: "https://instagram.com",
  },
  {
    name: "Carlos Medina",
    role: "Líder de jóvenes",
    imageUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=600&h=800&fit=crop&q=80",
    instagramUrl: "https://instagram.com",
  },
  {
    name: "Valeria Soto",
    role: "Coordinadora de niños",
    imageUrl:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=800&fit=crop&q=80",
    instagramUrl: "https://instagram.com",
  },
] as const;

export function Leaders() {
  return (
    <Box component="section" id="liderazgo" sx={{ py: { xs: 8, md: 12 } }}>
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
              Nuestro equipo
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
              Personas que lideran con propósito
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
              Un equipo comprometido con acompañarte en cada etapa de tu fe.
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
                lg: "repeat(4, 1fr)",
              },
              gap: "24px",
            }}
          >
            {LEADERS.map((leader) => (
              <LeaderCard key={leader.name} {...leader} />
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
