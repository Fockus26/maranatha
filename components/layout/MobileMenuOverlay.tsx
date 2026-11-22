"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ExternalLink, House, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";
import type { MobileNavLink } from "./navItems";

export interface MobileMenuOverlayProps {
  open: boolean;
  onClose: () => void;
  links: MobileNavLink[];
  onCtaClick: () => void;
  ctaLabel?: string;
}

/**
 * Menú mobile — overlay fullscreen con enlaces centrados y aparición en
 * stagger (D025). Compartido entre `Navbar` (Home) y `PageNavbar` (resto de
 * páginas públicas): ambos le pasan su propia lista de `links` ya resuelta
 * (con `active` calculado por scroll-spy o por ruta, según corresponda).
 *
 * Revisión (feedback de cliente, ronda post-fase 08):
 * - Antes el fondo era navy sólido fijo (`primary[900]`) sin importar el
 *   modo claro/oscuro (D025) — a propósito, igual que el sidebar del
 *   dashboard (D024). Pero al tocar el `ThemeToggle` DENTRO de este overlay
 *   fullscreen, el fondo no cambiaba (el resto del sitio sí cambia de modo,
 *   pero queda tapado detrás del propio menú), así que parecía que el botón
 *   no hacía nada. Ahora el fondo sigue el modo activo (igual que
 *   `background.default` del resto del sitio: navy en oscuro, claro en modo
 *   claro) — el toggle da feedback visual inmediato sin salir del menú.
 * - Los enlaces de ancla (secciones de Home) y los de página (Proyectos,
 *   Inicio) se veían idénticos — antes ambos usaban el mismo texto grande
 *   subrayado, sin la distinción que sí existe en escritorio (ahí las
 *   páginas usan una píldora con ícono y borde, ver `Navbar`/`PageNavbar`,
 *   D023). Ahora los links de página se renderizan como esa misma píldora
 *   (ícono + borde, tamaño más chico) para que se lea igual que en
 *   escritorio: "esto te lleva a otro lugar", no una sección de esta misma
 *   página.
 */
export default function MobileMenuOverlay({
  open,
  onClose,
  links,
  onCtaClick,
  ctaLabel = "Ofrendar",
}: MobileMenuOverlayProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  // Elemento que tenía el foco al abrir — se le devuelve al cerrar (WCAG 2.4.3).
  const openerRef = React.useRef<Element | null>(null);

  // Cierra con Escape, bloquea el scroll del body, atrapa el foco dentro del
  // overlay mientras está abierto y lo devuelve al abridor al cerrar.
  React.useEffect(() => {
    if (!open) return;

    openerRef.current = document.activeElement;
    // Mueve el foco al botón de cerrar al abrir.
    const focusTimer = window.setTimeout(
      () => closeButtonRef.current?.focus(),
      0,
    );

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const focusables = containerRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      // Devuelve el foco al elemento que abrió el menú.
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  const handleAnchorClick = (id: string) => (event: React.MouseEvent) => {
    event.preventDefault();
    onClose();
    // Espera a que termine el fade de cierre antes de scrollear, para que
    // el salto de posición no se vea detrás del overlay.
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 250);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={containerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          // Fase QA (design-qa, crítico): en viewports bajos (teléfono en
          // horizontal) el CTA "Ofrendar" y el toggle quedaban fuera de
          // pantalla sin forma de llegar. Ahora el overlay scrollea.
          className="fixed inset-0 z-modal flex flex-col overflow-y-auto bg-background text-foreground transition-colors duration-200 md:hidden dark:bg-primary-900 dark:text-white"
        >
          <div className="flex justify-end p-2">
            <Button
              ref={closeButtonRef}
              variant="plain"
              size="icon"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="text-foreground dark:text-white"
            >
              <X aria-hidden />
            </Button>
          </div>

          {/* `justify-center-safe`: centra si entra, pero no recorta el borde
              superior cuando el contenido es más alto que el viewport. */}
          <nav
            aria-label="Navegación del menú"
            className="flex flex-1 flex-col items-center justify-center-safe gap-2.5 py-3 sm:gap-4"
          >
            {links.map((link, index) => {
              const isActive = link.active;
              const key = link.kind === "anchor" ? link.id : link.href;

              return (
                <motion.div
                  key={key}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.25,
                    delay: reduceMotion ? 0 : index * 0.05,
                  }}
                >
                  {link.kind === "anchor" ? (
                    <a
                      href={`#${link.id}`}
                      onClick={handleAnchorClick(link.id)}
                      className={cn(
                        "border-b-2 pb-0.5 font-bold font-heading text-28 no-underline",
                        isActive
                          ? "border-secondary text-secondary"
                          : "border-transparent text-foreground dark:text-white",
                      )}
                    >
                      {link.label}
                    </a>
                  ) : (
                    // Píldora con ícono — mismo criterio visual que los links
                    // de página en `Navbar`/`PageNavbar` (D023): borde +
                    // ícono en vez de texto plano, para distinguirse de las
                    // anclas de arriba. "Inicio" usa el ícono de casa, el
                    // resto (Proyectos, etc.) el de "abrir en otro lugar".
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={cn(
                        // valor único: borde de 1,5 px de las píldoras del menú móvil
                        "inline-flex items-center gap-1 rounded-pill border-[1.5px] bg-transparent py-1 pr-2.5 pl-2 font-body text-16 no-underline",
                        isActive
                          ? "border-secondary-700 font-semibold text-secondary-700 dark:border-secondary-300 dark:text-secondary-300"
                          : "border-border font-medium text-muted-foreground dark:border-white/24 dark:text-white/75",
                      )}
                    >
                      {link.href === "/" ? (
                        <House className="size-4 shrink-0" aria-hidden />
                      ) : (
                        <ExternalLink className="size-4 shrink-0" aria-hidden />
                      )}
                      {link.label}
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </nav>

          <div className="flex flex-col items-center gap-2 pt-2 pb-5">
            <ThemeToggle
              size="medium"
              className="hover:bg-accent hover:text-foreground dark:text-on-navy-muted dark:hover:text-on-navy"
            />
            <Button
              onClick={() => {
                onClose();
                onCtaClick();
              }}
              color="secondary"
              size="large"
              className="px-5"
            >
              {ctaLabel}
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
