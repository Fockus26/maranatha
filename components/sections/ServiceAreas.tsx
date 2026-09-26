"use client";

import ChildCareIcon from "@mui/icons-material/ChildCare";
import FavoriteIcon from "@mui/icons-material/FavoriteBorder";
import GroupsIcon from "@mui/icons-material/Groups";
import UsersIcon from "@mui/icons-material/People";
import SelfImprovementIcon from "@mui/icons-material/SelfImprovement";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { Reveal } from "@/components/ui/Reveal";
import { ServiceAreaCard } from "@/components/ui/ServiceAreaCard";

/**
 * Sección "Áreas de Servicio" (fase 06) — componente + datos en un solo
 * archivo (reemplaza los antiguos `AreasSection.tsx` + `ServiceAreaGrid.tsx`,
 * eliminados a pedido del usuario para mantener sections/ más limpio: un
 * archivo por sección, ya con su contenido adentro).
 *
 * Heading — Opción A "Simple centrado" (D029, sin cambios).
 *
 * Datos — ahora 5 áreas (antes 4, con Evangelismo en vez de Jóvenes/Oración).
 * Orden y nombres tomados de HistoryTimeline (hito 2022: "equipos de
 * alabanza, jóvenes, niños, oración y servicio comunitario"), para que
 * coincida con Historia y con el stat "5 áreas de servicio" del Hero.
 *
 * Fotos: Alabanza/Niños/Servicio comunitario reutilizan las mismas fotos
 * que ya existían. Jóvenes reutiliza la foto de Carlos Medina (LeaderGrid
 * ya lo describe como "Líder de jóvenes" — coherente, no una foto al azar).
 * Oración reutiliza la foto que antes usaba Evangelismo como placeholder
 * temporal — pendiente de una foto real de un servicio/noche de oración.
 */

const SERVICE_AREAS = [
  {
    name: "Alabanza",
    description: "Equipo de música y adoración para los servicios.",
    icon: <UsersIcon fontSize="small" />,
    imageUrl:
      "https://images.unsplash.com/photo-1573152958734-1922c188fba3?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Jóvenes",
    description: "Un espacio para crecer en fe, amistad y propósito.",
    icon: <GroupsIcon fontSize="small" />,
    imageUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Niños",
    description: "Espacio seguro y divertido para los más pequeños.",
    icon: <ChildCareIcon fontSize="small" />,
    imageUrl:
      "https://images.unsplash.com/photo-1761208663763-c4d30657c910?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Oración",
    description: "Un lugar para buscar a Dios en comunidad, cada semana.",
    icon: <SelfImprovementIcon fontSize="small" />,
    // Placeholder temporal (foto que antes usaba Evangelismo) — reemplazar
    // por una foto real de un servicio/noche de oración cuando esté disponible.
    imageUrl:
      "https://images.unsplash.com/photo-1764455488345-47cff12340d6?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Servicio comunitario",
    description: "Apoyo directo a familias y vecinos de la zona.",
    icon: <FavoriteIcon fontSize="small" />,
    imageUrl:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=1000&fit=crop&q=80",
  },
] as const;

export function ServiceAreas() {
  return (
    <Box component="section" id="areas" sx={{ py: { xs: 8, md: 12 } }}>
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
                "@media (min-width:1920px)": { fontSize: "13px" },
              }}
            >
              Cómo servimos
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: { xs: "28px", md: "38px" },
                // Feedback de cliente: tipografía más grande en pantallas
                // ≥1920px — este heading/copy se repite igual en el resto
                // de secciones de Home (Leaders, Sermons, SocialLinks,
                // Agenda, History).
                "@media (min-width:1920px)": { fontSize: "46px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "text.primary",
                mb: 2,
              }}
            >
              Encuentra tu lugar para servir
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
              Cada área es una forma distinta de vivir la fe en comunidad —
              súmate a la que resuene contigo.
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
                md: "repeat(3, 1fr)",
                lg: "repeat(5, 1fr)",
              },
              gap: "24px",
            }}
          >
            {SERVICE_AREAS.map((area, index) => (
              // Feedback de cliente: con 5 áreas, el grid cae en columnas
              // que no dividen 5 exacto en `sm` (2 cols) ni en `md` (3 cols)
              // — quedaría una fila con un hueco vacío. En vez de eso, con
              // 3 filas simétricas:
              // - `sm` (2 columnas): fila 1 → items 1-2 normales (1 col c/u);
              //   fila 2 → item 3 solo, ancho completo (2 cols); fila 3 →
              //   items 4-5 normales.
              // - `md` (3 columnas): fila 1 → item 1 (1 col) + item 2 (2
              //   cols); fila 2 → item 3 solo, ancho completo (3 cols);
              //   fila 3 → item 4 (2 cols) + item 5 (1 col).
              // - `lg` (5 columnas, calzan exactas): cada una vuelve a 1 col.
              <Box
                key={area.name}
                sx={{
                  gridColumn: {
                    sm: index === 2 ? "1 / -1" : "auto",
                    md:
                      index === 1 || index === 3
                        ? "span 2"
                        : index === 2
                          ? "1 / -1"
                          : "auto",
                    lg: "auto",
                  },
                }}
              >
                <ServiceAreaCard {...area} />
              </Box>
            ))}
          </Box>
        </Reveal>
      </Container>
    </Box>
  );
}
