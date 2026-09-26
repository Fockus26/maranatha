"use client";

import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
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
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { useTitheModal } from "@/lib/titheModalStore";
import { secondary } from "@/theme/tokens";
import MobileMenuOverlay from "./MobileMenuOverlay";
import { type MobileNavLink, PAGE_NAV_ITEMS } from "./navItems";

/**
 * Variante simplificada de `Navbar` para toda página pública que no sea Home
 * (Historia, Proyectos, detalle de proyecto) — D023. Mismo shell (sticky,
 * sombra al hacer scroll, ThemeToggle, CTA Diezmo, menú mobile), pero sin
 * anclas: solo los enlaces de página, con estado activo resuelto por ruta.
 *
 * El CTA "Diezmo" apunta a `/#diezmo` (navega a Home y hace scroll) porque
 * esa sección solo existe ahí.
 */
export default function PageNavbar() {
  const theme = useTheme();
  const pathname = usePathname();
  const scrolled = useScrollTrigger({ disableHysteresis: true, threshold: 8 });
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { openTithe } = useTitheModal();

  const isActive = (href: string) =>
    pathname === href || (pathname?.startsWith(`${href}/`) ?? false);

  // Píldora de link de página — mismo tratamiento que el Navbar de Home
  // (Opción 1 del comparador de navbar, /design): borde + ícono en vez de
  // texto plano, para que se lea como "esto te lleva a otro lugar" y no
  // como una ancla de la página actual. El estado activo (la página en la
  // que ya estás) usa el mismo naranja apagado que el tab seleccionado de
  // `/proyectos` (`secondary[700]`, D051) en vez del naranja vivo — mismo
  // criterio: como estado persistente (no un hover pasajero), el naranja
  // vivo se siente demasiado intenso.
  // Naranja del estado activo contrastado según el modo (en oscuro
  // `secondary[700]` sobre navy da 3.7:1). Sin relleno translúcido: sobre él
  // el texto quedaba en 4.4:1; el borde ya marca el activo.
  const activeOrange =
    theme.palette.mode === "dark" ? secondary[300] : secondary[700];
  const pillSx = (active: boolean) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 0.75,
    fontFamily: "var(--font-body)",
    fontWeight: active ? 600 : 500,
    fontSize: 13,
    "@media (min-width:1920px)": { fontSize: "15px" },
    textDecoration: "none",
    color: active ? activeOrange : "text.secondary",
    border: "1px solid",
    borderColor: active ? activeOrange : "divider",
    backgroundColor: "transparent",
    borderRadius: "999px",
    pl: 1.5,
    pr: 1.75,
    py: 0.75,
    ...(!active && {
      "&:hover": { color: "secondary.main", borderColor: "secondary.main" },
    }),
  });

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
      <AppBar
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

            {/* Links de escritorio: solo páginas, sin anclas (esta página no
                tiene secciones). Antes solo mostraba el link de página
                actual (ej. "Proyectos" en /proyectos) sin ninguna forma de
                volver a Inicio salvo el logo — el cliente señaló que no
                era suficientemente explícito. Se agrega "Inicio" siempre
                primero, con el mismo tratamiento de píldora que el resto
                (Opción 1 del comparador de navbar, /design). */}
            <Box
              component="nav"
              aria-label="Principal"
              sx={{
                display: { xs: "none", md: "flex" },
                alignItems: "center",
                gap: 1.25,
              }}
            >
              <Box component={Link} href="/" sx={pillSx(false)}>
                <HomeRoundedIcon sx={{ fontSize: 13 }} />
                Inicio
              </Box>
              {PAGE_NAV_ITEMS.map((item) => {
                const active = isActive(item.href);
                return (
                  <Box
                    key={item.href}
                    component={Link}
                    href={item.href}
                    sx={pillSx(active)}
                  >
                    <OpenInNewRoundedIcon sx={{ fontSize: 13 }} />
                    {item.label}
                  </Box>
                );
              })}
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
