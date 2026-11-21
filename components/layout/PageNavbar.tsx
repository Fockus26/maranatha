"use client";

import { ExternalLink, House, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { SITE_NAME } from "@/lib/siteConfig";
import { useTitheModal } from "@/lib/titheModalStore";
import { cn } from "@/lib/utils";
import MobileMenuOverlay from "./MobileMenuOverlay";
import { type MobileNavLink, PAGE_NAV_ITEMS } from "./navItems";
import { useScrolled } from "./useScrolled";

/**
 * Variante simplificada de `Navbar` para toda página pública que no sea Home
 * (Historia, Proyectos, detalle de proyecto) — D023. Mismo shell (sticky,
 * sombra al hacer scroll, ThemeToggle, CTA Ofrendar, menú mobile), pero sin
 * anclas: solo los enlaces de página, con estado activo resuelto por ruta.
 *
 * El CTA "Ofrendar" abre el modal de ofrenda (`TitheModal`), igual que en Home.
 */

// Píldora de link de página — mismo tratamiento que el Navbar de Home
// (Opción 1 del comparador de navbar, /design): borde + ícono en vez de
// texto plano, para que se lea como "esto te lleva a otro lugar" y no
// como una ancla de la página actual. El estado activo (la página en la
// que ya estás) usa el mismo naranja apagado que el tab seleccionado de
// `/proyectos` (`secondary[700]`, D051) en vez del naranja vivo — mismo
// criterio: como estado persistente (no un hover pasajero), el naranja
// vivo se siente demasiado intenso.
// Naranja del estado activo contrastado según el modo (en oscuro
// `secondary[700]` sobre navy da 3.7:1 → `secondary[300]`). Sin relleno
// translúcido: sobre él el texto quedaba en 4.4:1; el borde ya marca el activo.
function pillClass(active: boolean) {
  return cn(
    "inline-flex items-center gap-0.75 rounded-pill border bg-transparent py-0.75 pr-1.75 pl-1.5 font-body text-13 no-underline wide:text-15",
    active
      ? "border-secondary-700 font-semibold text-secondary-700 dark:border-secondary-300 dark:text-secondary-300"
      : "border-border font-medium text-muted-foreground hover:border-secondary hover:text-secondary",
  );
}

export default function PageNavbar() {
  const pathname = usePathname();
  const scrolled = useScrolled(8);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { openTithe } = useTitheModal();

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

  // "Inicio" también se agrega al menú mobile por la misma razón que en
  // escritorio — antes el overlay mobile de páginas internas tampoco tenía
  // ningún link de regreso más allá de cerrar el menú y tocar el logo.
  const mobileLinks: MobileNavLink[] = [
    { kind: "page" as const, href: "/", label: "Inicio", active: false },
    ...PAGE_NAV_ITEMS.map((item) => ({
      kind: "page" as const,
      href: item.href,
      label: item.label,
      active: isActive(item.href),
    })),
  ];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-navbar box-border flex w-full flex-col border-b bg-background text-foreground transition-[box-shadow,border-color] duration-150",
          scrolled ? "border-transparent shadow-sm" : "border-border",
        )}
      >
        <Container maxWidth="lg">
          <div className="relative flex items-center justify-between py-3">
            {/* Logo (design-qa fase 09: el mismo `<Logo>` que Inicio, antes
                era un cuadrado de relleno con "Iglesia"). */}
            <Link
              href="/"
              aria-label={`${SITE_NAME}, ir al inicio`}
              className="flex min-h-11 items-center no-underline"
            >
              <Logo variant="responsive" size={{ xs: 32, sm: 40 }} />
            </Link>

            {/* Links de escritorio: solo páginas, sin anclas (esta página no
                tiene secciones). Antes solo mostraba el link de página
                actual (ej. "Proyectos" en /proyectos) sin ninguna forma de
                volver a Inicio salvo el logo — el cliente señaló que no
                era suficientemente explícito. Se agrega "Inicio" siempre
                primero, con el mismo tratamiento de píldora que el resto
                (Opción 1 del comparador de navbar, /design). */}
            <nav
              aria-label="Principal"
              className="hidden items-center gap-1.25 md:flex"
            >
              <Link href="/" className={pillClass(false)}>
                <House className="size-3.25 shrink-0" aria-hidden />
                Inicio
              </Link>
              {PAGE_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={pillClass(active)}
                  >
                    <ExternalLink className="size-3.25 shrink-0" aria-hidden />
                    {item.label}
                  </Link>
                );
              })}
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
