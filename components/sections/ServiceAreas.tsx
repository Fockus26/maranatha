"use client";

import { Baby, Heart, PersonStanding, Users, UsersRound } from "lucide-react";
import { Container } from "@/components/ui/container";
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
    icon: <Users aria-hidden className="size-5" />,
    imageUrl:
      "https://images.unsplash.com/photo-1573152958734-1922c188fba3?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Jóvenes",
    description: "Un espacio para crecer en fe, amistad y propósito.",
    icon: <UsersRound aria-hidden className="size-5" />,
    imageUrl:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Niños",
    description: "Espacio seguro y divertido para los más pequeños.",
    icon: <Baby aria-hidden className="size-5" />,
    imageUrl:
      "https://images.unsplash.com/photo-1761208663763-c4d30657c910?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Oración",
    description: "Un lugar para buscar a Dios en comunidad, cada semana.",
    icon: <PersonStanding aria-hidden className="size-5" />,
    // Placeholder temporal (foto que antes usaba Evangelismo) — reemplazar
    // por una foto real de un servicio/noche de oración cuando esté disponible.
    imageUrl:
      "https://images.unsplash.com/photo-1764455488345-47cff12340d6?w=800&h=1000&fit=crop&q=80",
  },
  {
    name: "Servicio comunitario",
    description: "Apoyo directo a familias y vecinos de la zona.",
    icon: <Heart aria-hidden className="size-5" />,
    imageUrl:
      "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=800&h=1000&fit=crop&q=80",
  },
] as const;

// Feedback de cliente: con 5 áreas, el grid cae en columnas que no dividen 5
// exacto en `sm` (2 cols) ni en `md` (3 cols) — quedaría una fila con un hueco
// vacío. En vez de eso, 3 filas simétricas:
// - `sm` (2 columnas): fila 1 → items 1-2 normales (1 col c/u); fila 2 →
//   item 3 solo, ancho completo (2 cols); fila 3 → items 4-5 normales.
// - `md` (3 columnas): fila 1 → item 1 (1 col) + item 2 (2 cols); fila 2 →
//   item 3 solo, ancho completo (3 cols); fila 3 → item 4 (2 cols) + item 5
//   (1 col).
// - `lg` (5 columnas, calzan exactas): cada una vuelve a 1 col.
// (Clases literales para que Tailwind las vea.)
const AREA_SPAN = [
  "",
  "md:col-span-2 lg:col-auto",
  "sm:col-[1/-1] lg:col-auto",
  "md:col-span-2 lg:col-auto",
  "",
] as const;

export function ServiceAreas() {
  return (
    <section id="areas" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em] wide:text-13">
              Cómo servimos
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-[1.2] tracking-[-0.01em] md:text-[38px] wide:text-46">
              Encuentra tu lugar para servir
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-[1.6] wide:text-19">
              Cada área es una forma distinta de vivir la fe en comunidad —
              súmate a la que resuene contigo.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {SERVICE_AREAS.map((area, index) => (
              <div key={area.name} className={AREA_SPAN[index]}>
                <ServiceAreaCard {...area} />
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
