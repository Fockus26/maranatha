"use client";

import { motion } from "framer-motion";
import { ExternalLink, Menu } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_NAME } from "@/lib/siteConfig";
import { useTitheModal } from "@/lib/titheModalStore";
import { cn } from "@/lib/utils";
import MobileMenuOverlay from "./MobileMenuOverlay";
import {
  HOME_ANCHOR_ITEMS,
  type MobileNavLink,
  PAGE_NAV_ITEMS,
} from "./navItems";
import { useActiveAnchor } from "./useActiveAnchor";
import { useScrolled } from "./useScrolled";

const ANCHOR_IDS = HOME_ANCHOR_ITEMS.map((item) => item.id);
const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Navbar de Home (D023): anclas a las secciones de Home con scroll-spy real
 * (`useActiveAnchor`) + enlaces de página a Historia/Proyectos + CTA Ofrendar.
 * Por debajo de `md` los links se reemplazan por el ícono de hamburguesa que
 * abre `MobileMenuOverlay` (D025).
 *
 * Para el resto de páginas públicas (sin secciones/anclas) usar `PageNavbar`.
 *
 * Publica su propia altura real como variable CSS `--navbar-height` en
 * `:root` (medida vía `ResizeObserver`, no un valor fijo estimado) — la usa
 * el Hero (`components/sections/Hero.tsx`) para ocupar exactamente el resto
 * del viewport (`calc(100vh - var(--navbar-height))`) sin adivinar la altura
 * del navbar a mano ni desincronizarse si esta cambia (ej. breakpoint).
 */
export default function Navbar() {
  const scrolled = useScrolled(8);
  const activeAnchor = useActiveAnchor(ANCHOR_IDS);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { openTithe } = useTitheModal();
  const appBarRef = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = appBarRef.current;
    if (!el) return;

    const setNavbarHeightVar = () => {
      document.documentElement.style.setProperty(
        "--navbar-height",
        `${el.getBoundingClientRect().height}px`,
      );
    };
    setNavbarHeightVar();

    const observer = new ResizeObserver(setNavbarHeightVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mobileLinks: MobileNavLink[] = [
    ...HOME_ANCHOR_ITEMS.map((item) => ({
      kind: "anchor" as const,
      id: item.id,
      label: item.label,
      active: activeAnchor === item.id,
    })),
    ...PAGE_NAV_ITEMS.map((item) => ({
      kind: "page" as const,
      href: item.href,
      label: item.label,
      active: false,
    })),
  ];

  return (
    <>
      <header
        ref={appBarRef}
        className={cn(
          "sticky top-0 z-navbar box-border flex w-full flex-col border-b bg-background text-foreground transition-[box-shadow,border-color] duration-150",
          scrolled ? "border-transparent shadow-sm" : "border-border",
        )}
      >
        <Container maxWidth="lg">
          <div className="relative flex items-center justify-between py-3">
            {/* Logo */}
            <Link
              href="/"
              aria-label={`${SITE_NAME}, ir al inicio`}
              className="flex min-h-11 items-center no-underline"
            >
              <Logo variant="responsive" size={{ xs: 32, sm: 40 }} />
            </Link>

            {/* Links de escritorio: anclas + páginas */}
            <nav
              aria-label="Principal"
              className="hidden items-center gap-6 md:flex"
            >
              {HOME_ANCHOR_ITEMS.map((item) => {
                const isActive = activeAnchor === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className={cn(
                      "relative pb-px font-body font-medium text-13 no-underline hover:text-secondary wide:text-15",
                      isActive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {item.label}
                    {/* Antes: `borderBottom` estático que solo cambiaba de
                        color entre anclas — el cliente pidió una animación
                        de layout al pasar de una sección activa a otra.
                        `layoutId` compartido (mismo criterio que
                        `SegmentedToggle.tsx`) hace que el subrayado se
                        deslice de una ancla a la siguiente en vez de
                        aparecer/desaparecer de golpe. */}
                    {isActive && (
                      <motion.span
                        layoutId="navbar-active-underline"
                        transition={{ duration: 0.25, ease: EASE }}
                        aria-hidden
                        className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-xs bg-secondary"
                      />
                    )}
                  </a>
                );
              })}
              {/* Links de página (Proyectos, etc.), separados visualmente de
                  las anclas de arriba — feedback del cliente: al verse
                  igual que las anclas, alguien que entra por primera vez
                  puede pensar que "Proyectos" es también una sección de
                  esta misma página. Un divisor + forma de píldora con
                  ícono (en vez de texto plano subrayado) comunica "esto te
                  lleva a otro lugar" sin depender solo del color — Opción 1
                  del comparador de navbar (/design), elegida por el
                  cliente. Mismo trío hover que el resto de links del
                  navbar (`secondary.main`, D023) — la píldora es la que
                  cambia, no el criterio de color. */}
              {PAGE_NAV_ITEMS.length > 0 && (
                <div aria-hidden className="h-5 w-px bg-border" />
              )}
              {PAGE_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex items-center gap-0.75 rounded-pill border border-border py-0.75 pr-1.75 pl-1.5 font-body font-medium text-13 text-muted-foreground no-underline hover:border-secondary hover:text-secondary"
                >
                  <ExternalLink className="size-3.25 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Theme toggle + CTA (escritorio) / hamburguesa (mobile) */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-3 md:flex">
                <ThemeToggle />
                <Button
                  onClick={openTithe}
                  color="secondary"
                  size="small"
                  className="rounded-sm px-2"
                >
                  Ofrendar
                </Button>
              </div>
              <Button
                variant="plain"
                size="icon"
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                className="size-11 text-foreground md:hidden dark:text-foreground"
              >
                <Menu aria-hidden />
              </Button>
            </div>
          </div>
        </Container>
      </header>

      <MobileMenuOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={mobileLinks}
        onCtaClick={openTithe}
      />
    </>
  );
}
