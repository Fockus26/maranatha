"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { Box, Button, IconButton, useTheme } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import * as React from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { primary, secondary } from "@/theme/tokens";
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
  ctaLabel = "Diezmo",
}: MobileMenuOverlayProps) {
  const theme = useTheme();
  const isLight = theme.palette.mode === "light";
  const reduceMotion = useReducedMotion();
  const containerRef = React.useRef<HTMLDivElement>(null);
  const closeButtonRef = React.useRef<HTMLButtonElement>(null);
  // Elemento que tenía el foco al abrir — se le devuelve al cerrar (WCAG 2.4.3).
  const openerRef = React.useRef<Element | null>(null);

  const overlayBg = isLight ? theme.palette.background.default : primary[900];
  const textColor = isLight ? theme.palette.text.primary : "#FFFFFF";
  const mutedColor = isLight
    ? theme.palette.text.secondary
    : "rgba(255,255,255,0.75)";
  const hoverBg = isLight
    ? theme.palette.action.hover
    : "rgba(255,255,255,0.12)";
  const dividerColor = isLight
    ? theme.palette.divider
    : "rgba(255,255,255,0.24)";

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
        <Box
          ref={containerRef}
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          role="dialog"
          aria-modal="true"
          aria-label="Menú de navegación"
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: theme.zIndex.modal,
            bgcolor: overlayBg,
            transition: "background-color 0.2s ease",
            display: { xs: "flex", md: "none" },
            flexDirection: "column",
            // Fase QA (design-qa, crítico): en viewports bajos (teléfono en
            // horizontal) el CTA "Diezmo" y el toggle quedaban fuera de
            // pantalla sin forma de llegar. Ahora el overlay scrollea.
            overflowY: "auto",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "flex-end", p: 2 }}>
            <IconButton
              ref={closeButtonRef}
              onClick={onClose}
              aria-label="Cerrar menú"
              sx={{ color: textColor }}
            >
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box
            component="nav"
            aria-label="Navegación del menú"
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              // `safe center`: centra si entra, pero no recorta el borde
              // superior cuando el contenido es más alto que el viewport.
              justifyContent: "safe center",
              gap: { xs: 2.5, sm: 4 },
              py: 3,
            }}
          >
            {links.map((link, index) => {
              const isActive = link.active;
              const key = link.kind === "anchor" ? link.id : link.href;

              return (
                <Box
                  key={key}
                  component={motion.div}
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.25,
                    delay: reduceMotion ? 0 : index * 0.05,
                  }}
                >
                  {link.kind === "anchor" ? (
                    <Box
                      component="a"
                      href={`#${link.id}`}
                      onClick={handleAnchorClick(link.id)}
                      sx={{
                        fontFamily: "var(--font-heading)",
                        fontWeight: 700,
                        fontSize: "28px",
                        textDecoration: "none",
                        color: isActive ? "secondary.main" : textColor,
                        borderBottom: "2px solid",
                        borderColor: isActive
                          ? "secondary.main"
                          : "transparent",
                        pb: 0.5,
                      }}
                    >
                      {link.label}
                    </Box>
                  ) : (
                    // Píldora con ícono — mismo criterio visual que los links
                    // de página en `Navbar`/`PageNavbar` (D023): borde +
                    // ícono en vez de texto plano, para distinguirse de las
                    // anclas de arriba. "Inicio" usa el ícono de casa, el
                    // resto (Proyectos, etc.) el de "abrir en otro lugar".
                    <Box
                      component={Link}
                      href={link.href}
                      onClick={onClose}
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                        fontFamily: "var(--font-body)",
                        fontWeight: isActive ? 600 : 500,
                        fontSize: "16px",
                        textDecoration: "none",
                        color: isActive
                          ? isLight
                            ? secondary[700]
                            : secondary[300]
                          : mutedColor,
                        border: "1.5px solid",
                        borderColor: isActive
                          ? isLight
                            ? secondary[700]
                            : secondary[300]
                          : dividerColor,
                        backgroundColor: "transparent",
                        borderRadius: "999px",
                        pl: 2,
                        pr: 2.5,
                        py: 1,
                      }}
                    >
                      {link.href === "/" ? (
                        <HomeRoundedIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <OpenInNewRoundedIcon sx={{ fontSize: 16 }} />
                      )}
                      {link.label}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              pb: 5,
              pt: 2,
            }}
          >
            <ThemeToggle
              size="medium"
              sx={{
                color: mutedColor,
                "&:hover": { backgroundColor: hoverBg, color: textColor },
              }}
            />
            <Button
              onClick={() => {
                onClose();
                onCtaClick();
              }}
              variant="contained"
              color="secondary"
              size="large"
              sx={{ px: 5 }}
            >
              {ctaLabel}
            </Button>
          </Box>
        </Box>
      )}
    </AnimatePresence>
  );
}
