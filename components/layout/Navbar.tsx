"use client";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  AppBar,
  Box,
  Button,
  Container,
  IconButton,
  Toolbar,
  useScrollTrigger,
  useTheme,
} from "@mui/material";
import { motion } from "framer-motion";
import Link from "next/link";
import * as React from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTitheModal } from "@/lib/titheModalStore";
import MobileMenuOverlay from "./MobileMenuOverlay";
import {
  HOME_ANCHOR_ITEMS,
  type MobileNavLink,
  PAGE_NAV_ITEMS,
} from "./navItems";
import { useActiveAnchor } from "./useActiveAnchor";

const ANCHOR_IDS = HOME_ANCHOR_ITEMS.map((item) => item.id);
const EASE = [0.2, 0.8, 0.2, 1] as const;

/**
 * Navbar de Home (D023): anclas a las secciones de Home con scroll-spy real
 * (`useActiveAnchor`) + enlaces de página a Historia/Proyectos + CTA Diezmo.
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
  const theme = useTheme();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
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
      <AppBar
        ref={appBarRef}
        position="sticky"
        elevation={0}
        sx={{
          zIndex: theme.zIndex.appBar,
          backgroundColor: "background.default",
          color: "text.primary",
          borderBottom: `1px solid ${scrolled ? "transparent" : theme.palette.divider}`,
          boxShadow: scrolled ? theme.shadows[1] : "none",
          transition: theme.transitions.create(
            ["box-shadow", "border-bottom"],
            {
              duration: theme.transitions.duration.shortest,
            },
          ),
        }}
      >
        <Container maxWidth="lg" disableGutters={false}>
          <Toolbar
            disableGutters
            sx={{
              justifyContent: "space-between",
              py: 1.5,
              minHeight: "auto",
            }}
          >
            {/* Logo */}
            <Box
              component={Link}
              href="/"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                textDecoration: "none",
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "4px",
                  bgcolor: "primary.main",
                }}
              />
              <Box
                component="span"
                sx={{
                  fontFamily: "var(--font-heading)",
                  fontWeight: 600,
                  fontSize: 14,
                  "@media (min-width:1920px)": { fontSize: "16px" },
                  color: (t) =>
                    t.palette.mode === "dark"
                      ? t.palette.primary.light
                      : t.palette.primary.main,
                }}
              >
                Iglesia
              </Box>
            </Box>

            {/* Links de escritorio: anclas + páginas */}
            <Box
              component="nav"
              aria-label="Principal"
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 3,
              }}
            >
              {HOME_ANCHOR_ITEMS.map((item) => {
                const isActive = activeAnchor === item.id;
                return (
                  <Box
                    key={item.id}
                    component="a"
                    href={`#${item.id}`}
                    sx={{
                      position: "relative",
                      fontFamily: "var(--font-body)",
                      fontWeight: 500,
                      fontSize: 13,
                      "@media (min-width:1920px)": { fontSize: "15px" },
                      textDecoration: "none",
                      color: isActive ? "text.primary" : "text.secondary",
                      pb: 0.25,
                      "&:hover": { color: "secondary.main" },
                    }}
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
                      <Box
                        component={motion.div}
                        layoutId="navbar-active-underline"
                        transition={{ duration: 0.25, ease: EASE }}
                        sx={{
                          position: "absolute",
                          left: 0,
                          right: 0,
                          bottom: -2,
                          height: "2px",
                          borderRadius: "2px",
                          bgcolor: "secondary.main",
                        }}
                      />
                    )}
                  </Box>
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
                <Box
                  sx={{ width: "1px", height: 20, backgroundColor: "divider" }}
                />
              )}
              {PAGE_NAV_ITEMS.map((item) => (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 0.75,
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: 13,
                    textDecoration: "none",
                    color: "text.secondary",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: "999px",
                    pl: 1.5,
                    pr: 1.75,
                    py: 0.75,
                    "&:hover": {
                      color: "secondary.main",
                      borderColor: "secondary.main",
                    },
                  }}
                >
                  <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
                  {item.label}
                </Box>
              ))}
            </Box>

            {/* Theme toggle + CTA (escritorio) / hamburguesa (mobile) */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Box
                sx={{
                  display: { xs: "none", md: "flex" },
                  alignItems: "center",
                  gap: 1.5,
                }}
              >
                <ThemeToggle />
                <Button
                  onClick={openTithe}
                  variant="contained"
                  color="secondary"
                  size="small"
                  sx={{ borderRadius: "6px", px: 2 }}
                >
                  Diezmo
                </Button>
              </Box>
              <IconButton
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menú"
                sx={{
                  display: { xs: "inline-flex", md: "none" },
                  color: "text.primary",
                }}
              >
                <MenuRoundedIcon />
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      <MobileMenuOverlay
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={mobileLinks}
        onCtaClick={openTithe}
      />
    </>
  );
}
