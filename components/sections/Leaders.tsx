"use client";

import { Container } from "@/components/ui/container";
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
    <section id="liderazgo" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em] wide:text-13">
              Nuestro equipo
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-[-0.01em] md:text-[38px] wide:text-46">
              Personas que lideran con propósito
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body wide:text-19">
              Un equipo comprometido con acompañarte en cada etapa de tu fe.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {LEADERS.map((leader) => (
              <LeaderCard key={leader.name} {...leader} />
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
