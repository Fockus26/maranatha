"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { InstagramIcon, YoutubeIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

// Fase 10 (QA): antes solo tenía 3 de las 5 anclas de Home — se completa
// con Prédicas y Redes para que coincida con `HOME_ANCHOR_ITEMS`
// (`components/layout/navItems.ts`), la misma fuente que usa el Navbar.
//
// Fase QA (functional-qa): los `href` eran relativos (`#areas`) — en toda
// página que no es Home resolvían a `/proyectos#areas`, un ancla que no
// existe ahí. Se prefijan con `/` para que naveguen a Home y hagan scroll.
const NAV_LINKS = [
  { label: "Áreas", href: "/#areas" },
  { label: "Liderazgo", href: "/#liderazgo" },
  { label: "Prédicas", href: "/#predicas" },
  { label: "Redes", href: "/#redes" },
  { label: "Agenda", href: "/#agenda" },
] as const;

// Fase 10 (QA): se quita "Nosotros" → `/nosotros` — esa ruta no existe en
// el árbol de páginas (`app/`), era un link roto (404).
const RESOURCE_LINKS = [{ label: "Proyectos", href: "/proyectos" }] as const;

const SOCIAL_LINKS = [
  {
    label: "Instagram",
    href: "https://www.instagram.com/maranathasancristobal/",
    icon: InstagramIcon,
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCT2A5hFBhTJ5T0CykeCKX7w",
    icon: YoutubeIcon,
  },
] as const;

const linkClass =
  "inline-flex min-h-11 items-center font-body text-12 text-muted-foreground no-underline hover:text-secondary sm:min-h-0 wide:text-14";
const titleClass = "font-body font-medium text-12 text-foreground wide:text-14";

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly { label: string; href: string }[];
}) {
  return (
    <nav aria-label={title} className="flex flex-col gap-0.75">
      <span className={cn(titleClass, "mb-0.5")}>{title}</span>
      <ul className="m-0 flex list-none flex-col gap-0 p-0 sm:gap-0.75">
        {links.map((link) => (
          <li key={link.href}>
            {/* Área táctil de 44px en móvil (design-qa fase 09). */}
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function Footer() {
  return (
    <footer className="border-border border-t bg-background">
      <Container maxWidth="lg" className="py-4 lg:py-8">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div>
            <Logo size={40} className="mb-1.5" />
            <p className="m-0 font-body text-11 text-muted-foreground leading-small wide:text-13">
              Una comunidad creciendo en fe y propósito.
            </p>
          </div>

          <FooterColumn title="Navegación" links={NAV_LINKS} />
          <FooterColumn title="Recursos" links={RESOURCE_LINKS} />

          <div className="flex flex-col gap-1">
            <span className={titleClass}>Conecta</span>
            <a href="mailto:contacto@iglesia.org" className={linkClass}>
              contacto@iglesia.org
            </a>
            <div className="mt-0.5 flex gap-0.75">
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <Button
                  key={label}
                  asChild
                  variant="plain"
                  size="icon"
                  className="size-11 rounded-xs border border-border text-muted-foreground hover:border-secondary hover:text-secondary sm:size-8 dark:text-muted-foreground"
                >
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`${label} (se abre en una pestaña nueva)`}
                  >
                    <Icon className="size-3.5" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Fase 10 (QA): `text.muted` no existe en el tema del proyecto; la
            barra de copyright usa `text-muted-foreground` (el secundario). */}
        <div className="mt-3 flex flex-col justify-between gap-1 border-border border-t pt-1.5 font-body text-11 text-muted-foreground sm:flex-row lg:mt-4 wide:text-13">
          <span>© 2026 Iglesia. Todos los derechos reservados.</span>
          <span>Hecho con propósito</span>
        </div>
      </Container>
    </footer>
  );
}
