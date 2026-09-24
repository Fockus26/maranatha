"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { motion } from "framer-motion";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { primary, secondary } from "@/theme/tokens";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const NAV_ITEMS = [
  { label: "Resumen", href: "/dashboard" },
  { label: "Proyectos", href: "/dashboard/proyectos" },
  { label: "Pagos", href: "/dashboard/pagos" },
] as const;

// Blanco fijo: igual que el sidebar que reemplaza (D024/D025), el topbar es
// navy sólido permanente (primary[900]) sin importar el modo claro/oscuro
// activo en el resto del dashboard — theme.palette.primary.contrastText no
// sirve acá porque cambia entre modos.
const ON_DARK = "#FFFFFF";

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

  return (
    <Box
      component="header"
      sx={{
        position: "sticky",
        top: 0,
        zIndex: (theme) => theme.zIndex.appBar,
        bgcolor: primary[900],
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 72,
        px: { xs: 2, sm: 3, md: 5 },
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1.5, sm: 3, md: 5 }, minWidth: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexShrink: 0 }}>
          <Box sx={{ width: 18, height: 18, borderRadius: "4px", bgcolor: "secondary.main" }} />
          <Typography
            component="span"
            sx={{ fontFamily: "var(--font-heading)", fontWeight: 600, fontSize: 14, color: ON_DARK, display: { xs: "none", sm: "inline" } }}
          >
            Iglesia Maranatha
          </Typography>
        </Box>

        {/* Fase 08: padding horizontal de las píldoras y gap entre ellas se
            reducen en mobile para que el topbar (logo + nav + acciones) no
            desborde en viewports angostos (~360px) — la barra sigue siendo
            una sola fila, sin colapsar a un menú hamburguesa. */}
        {/* Con 3 ítems (se sumó "Pagos") la barra no entra completa a ~360px:
            la navegación scrollea horizontalmente dentro de sí misma en vez
            de desbordar la página (WCAG 1.4.10). Scrollbar oculto; el
            recorte del último ítem ya indica que hay más. */}
        <Box
          component="nav"
          aria-label="Secciones del panel"
          sx={{
            display: "flex",
            gap: { xs: 0.5, sm: 0.75 },
            minWidth: 0,
            overflowX: "auto",
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
          }}
        >
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href || (item.href !== "/dashboard" && (pathname?.startsWith(`${item.href}/`) ?? false));
            return (
              <Box
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  position: "relative",
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1.1,
                  borderRadius: "999px",
                  textDecoration: "none",
                  fontFamily: "var(--font-body)",
                  fontWeight: 500,
                  fontSize: 14,
                  color: isActive ? ON_DARK : "rgba(255,255,255,0.65)",
                  transition: (theme) =>
                    theme.transitions.create(["color", "background-color"], { duration: theme.transitions.duration.shortest }),
                  "&:hover": { color: ON_DARK, bgcolor: isActive ? "transparent" : "rgba(255,255,255,0.08)" },
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
                      borderRadius: "999px",
                      bgcolor: secondary[700],
                      zIndex: 0,
                    }}
                  />
                )}
                <Box component="span" sx={{ position: "relative", zIndex: 1 }}>
                  {item.label}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 2 } }}>
        <ThemeToggle
          size="small"
          sx={{ color: "rgba(255,255,255,0.75)", "&:hover": { backgroundColor: "rgba(255,255,255,0.08)", color: ON_DARK } }}
        />
        {/* Divisor puramente decorativo — se oculta en mobile para ganar
            espacio en el topbar (fase 08). */}
        <Box sx={{ display: { xs: "none", sm: "block" }, width: "1px", height: 24, bgcolor: "rgba(255,255,255,0.15)" }} />
        {/* Iniciales placeholder (decorativas): se ocultan en xs para dar
            espacio a la navegación. */}
        <Box
          aria-hidden="true"
          sx={{
            display: { xs: "none", sm: "flex" },
            width: 32,
            height: 32,
            borderRadius: "999px",
            bgcolor: primary[600],
            alignItems: "center",
            justifyContent: "center",
            color: ON_DARK,
            fontFamily: "var(--font-heading)",
            fontWeight: 700,
            fontSize: 12,
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
            color: "rgba(255,255,255,0.65)",
            p: 0.5,
            "&:hover": { color: "secondary.main" },
          }}
        >
          <LogoutRoundedIcon sx={{ fontSize: 20 }} />
        </Box>
      </Box>
    </Box>
  );
}
