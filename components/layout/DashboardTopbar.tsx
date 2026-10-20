"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { fontScale, onNavy, primary, radius, secondary } from "@/theme/tokens";
import { DASHBOARD_CONTENT_SX } from "./DashboardShell";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const NAV_ITEMS = [
  { label: "Resumen", href: "/dashboard" },
  { label: "Proyectos", href: "/dashboard/proyectos" },
  { label: "Pagos", href: "/dashboard/pagos" },
  { label: "Agenda", href: "/dashboard/agenda" },
] as const;

// Blanco fijo: igual que el sidebar que reemplaza (D024/D025), el topbar es
// navy sólido permanente (primary[900]) sin importar el modo claro/oscuro
// activo en el resto del dashboard — theme.palette.primary.contrastText no
// sirve acá porque cambia entre modos.
const ON_DARK = onNavy.text;

function isActiveHref(pathname: string | null, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && (pathname?.startsWith(`${href}/`) ?? false))
  );
}

export interface DashboardTopbarProps {
  onLogout?: () => void;
}

/**
 * Topbar del dashboard privado — Opción B ("Panel Superior"), elegida por el
 * cliente entre 3 direcciones comparadas en `/design`. Reemplaza al
 * `DashboardSidebar` fijo (D024/D025): en vez de un sidebar de 260px que le
 * resta ancho al contenido, la navegación (Resumen/Proyectos) vive en una
 * barra navy horizontal — mismo navy sólido permanente, mismo criterio de
 * "ítem activo con acento de marca" que el sidebar, pero como píldora
 * (`secondary[700]`, el mismo naranja apagado de "seleccionado" ya usado en
 * el tab de Proyectos D051 y la píldora activa del navbar público D054) en
 * vez de un acento lateral de 3px.
 */
export function DashboardTopbar({ onLogout }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <Box
      component="header"
      data-surface="navy"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: primary[900],
        borderBottom: `1px solid ${onNavy.border}`,
      }}
    >
      {/* El fondo navy ocupa todo el ancho; el contenido se alinea con el de
          las páginas (`DASHBOARD_CONTENT_SX`: 1400px centrado, mismo padding). */}
      <Box
        sx={{
          ...DASHBOARD_CONTENT_SX,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 72,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: { xs: 1.5, sm: 3, md: 5 },
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              flexShrink: 0,
            }}
          >
            <Logo
              variant="mark"
              tone="inverse"
              size={32}
              sx={{ display: { xs: "inline-flex", sm: "none" } }}
            />
            <Logo
              variant="compact"
              tone="inverse"
              size={32}
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            />
          </Box>

          {/* design-qa fase 09: con 4 ítems la fila no entra bajo 900px
            ("Agenda" quedaba oculta). Bajo `md` la navegación pasa a un
            menú lateral (Drawer); desde `md` sigue siendo la fila de píldoras. */}
          <Box
            component="nav"
            aria-label="Secciones del panel"
            sx={{
              display: { xs: "none", md: "flex" },
              gap: 0.75,
              minWidth: 0,
            }}
          >
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveHref(pathname, item.href);
              return (
                <Box
                  key={item.href}
                  component={Link}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  sx={{
                    position: "relative",
                    px: 2.5,
                    py: 1.1,
                    borderRadius: `${radius.pill}px`,
                    textDecoration: "none",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                    fontSize: fontScale[14],
                    color: isActive ? ON_DARK : onNavy.subtle,
                    transition: (theme) =>
                      theme.transitions.create(["color", "background-color"], {
                        duration: theme.transitions.duration.shortest,
                      }),
                    "&:hover": {
                      color: ON_DARK,
                      bgcolor: isActive ? "transparent" : onNavy.hover,
                    },
                  }}
                >
                  {/* Píldora animada compartida (`layoutId`, mismo criterio que
                    `SegmentedToggle.tsx`) — se desliza de "Resumen" a
                    "Proyectos" dentro de un mismo montaje. Nota: el topbar se
                    remonta en cada navegación de dashboard (`app/template.tsx`,
                    D055/D056, envuelve a `app/dashboard/layout.tsx`), así que
                    entre páginas la píldora reaparece con un fade en vez de
                    deslizarse — la animación de layout sí ocurre dentro de una
                    misma carga (p. ej. si el ítem activo cambia sin recargar). */}
                  {isActive && (
                    <Box
                      component={motion.div}
                      layoutId="dashboard-nav-active-pill"
                      transition={{ duration: 0.25, ease: EASE }}
                      sx={{
                        position: "absolute",
                        inset: 0,
                        borderRadius: `${radius.pill}px`,
                        bgcolor: secondary[700],
                        zIndex: 0,
                      }}
                    />
                  )}
                  <Box
                    component="span"
                    sx={{ position: "relative", zIndex: 1 }}
                  >
                    {item.label}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </Box>

        <Box
          sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}
        >
          <IconButton
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menú del panel"
            aria-expanded={menuOpen}
            aria-controls="dashboard-nav-drawer"
            sx={{
              display: { xs: "inline-flex", md: "none" },
              width: 44,
              height: 44,
              color: ON_DARK,
              "&:hover": { bgcolor: onNavy.hover },
            }}
          >
            <MenuRoundedIcon />
          </IconButton>
          <ThemeToggle
            size="small"
            sx={{
              color: onNavy.muted,
              "&:hover": {
                backgroundColor: onNavy.hover,
                color: ON_DARK,
              },
            }}
          />
          {/* Divisor puramente decorativo — se oculta en mobile para ganar
            espacio en el topbar (fase 08). */}
          <Box
            sx={{
              display: { xs: "none", sm: "block" },
              width: "1px",
              height: 24,
              bgcolor: onNavy.divider,
            }}
          />
          {/* Iniciales placeholder (decorativas): se ocultan en xs para dar
            espacio a la navegación. */}
          <Box
            aria-hidden="true"
            sx={{
              display: { xs: "none", sm: "flex" },
              width: 32,
              height: 32,
              borderRadius: `${radius.pill}px`,
              bgcolor: primary[600],
              alignItems: "center",
              justifyContent: "center",
              color: ON_DARK,
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: fontScale[12],
              flexShrink: 0,
            }}
          >
            PD
          </Box>
          <Box
            component="button"
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            sx={{
              display: "flex",
              alignItems: "center",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: onNavy.subtle,
              justifyContent: "center",
              minWidth: 44,
              minHeight: 44,
              "&:hover": { color: "secondary.main" },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: fontScale[20] }} />
          </Box>
        </Box>
      </Box>

      <Drawer
        anchor="right"
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        slotProps={{
          paper: {
            id: "dashboard-nav-drawer",
            sx: { bgcolor: primary[900], color: ON_DARK, width: 280 },
          },
        }}
      >
        <Box
          data-surface="navy"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            height: 72,
            px: 2,
            borderBottom: `1px solid ${onNavy.border}`,
          }}
        >
          <Logo variant="compact" tone="inverse" size={32} />
          <IconButton
            onClick={() => setMenuOpen(false)}
            aria-label="Cerrar menú del panel"
            sx={{
              width: 44,
              height: 44,
              color: ON_DARK,
              "&:hover": { bgcolor: onNavy.hover },
            }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <Box
          component="nav"
          aria-label="Secciones del panel"
          data-surface="navy"
          sx={{ display: "flex", flexDirection: "column", gap: 0.75, p: 2 }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = isActiveHref(pathname, item.href);
            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive ? "page" : undefined}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  minHeight: 48,
                  px: 2,
                  borderRadius: `${radius.md}px`,
                  textDecoration: "none",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: fontScale[16],
                  color: isActive ? ON_DARK : onNavy.muted,
                  bgcolor: isActive ? secondary[700] : "transparent",
                  "&:hover": {
                    color: ON_DARK,
                    bgcolor: isActive ? secondary[700] : onNavy.hover,
                  },
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Box>
      </Drawer>
    </Box>
  );
}
