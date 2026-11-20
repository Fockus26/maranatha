"use client";

import FolderOutlinedIcon from "@mui/icons-material/FolderRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardRounded";
import { Box } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { common, fontScale, primary, radius } from "@/theme/tokens";

const DASHBOARD_ITEMS = [
  { label: "Resumen", href: "/dashboard", icon: SpaceDashboardOutlinedIcon },
  {
    label: "Proyectos",
    href: "/dashboard/proyectos",
    icon: FolderOutlinedIcon,
  },
] as const;

export const DASHBOARD_SIDEBAR_WIDTH = 260;

// Blanco fijo: el sidebar es navy sólido permanente (primary[900]) sin
// importar el modo claro/oscuro activo en el resto del dashboard (D024) —
// theme.palette.primary.contrastText no sirve acá porque cambia entre modos.
const ON_DARK = common.white;

export interface DashboardSidebarProps {
  onLogout?: () => void;
}

/**
 * Sidebar fijo del dashboard privado (D024): navy sólido permanente
 * (`primary[900]`, no ligado al ThemeToggle), z-index de la capa "sidebar"
 * ya reservada en tokens.ts desde fase 03. Ítem activo con acento izquierdo
 * en `secondary.main` en vez de un fill naranja completo, para no gastar el
 * color reservado a CTAs de alta prioridad (D011) en navegación.
 */
export function DashboardSidebar({ onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <Box
      component="aside"
      data-surface="navy"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        bottom: 0,
        width: DASHBOARD_SIDEBAR_WIDTH,
        zIndex: (theme) => theme.zIndex.drawer,
        bgcolor: primary[900],
        display: "flex",
        flexDirection: "column",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Box sx={{ px: 3, py: 3 }}>
        <Logo tone="inverse" size={40} />
      </Box>

      <Box
        component="nav"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 0.5,
          px: 2,
          mt: 1,
        }}
      >
        {DASHBOARD_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              (pathname?.startsWith(`${item.href}/`) ?? false));
          const Icon = item.icon;
          return (
            <Box
              key={item.href}
              component={Link}
              href={item.href}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                px: 2,
                py: 1.25,
                borderRadius: `${radius.md}px`,
                textDecoration: "none",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: fontScale[14],
                color: isActive ? ON_DARK : "rgba(255,255,255,0.65)",
                bgcolor: isActive ? primary[800] : "transparent",
                borderLeft: "3px solid",
                borderLeftColor: isActive ? "secondary.main" : "transparent",
                transition: (theme) =>
                  theme.transitions.create(["background-color", "color"], {
                    duration: theme.transitions.duration.shortest,
                  }),
                "&:hover": { color: ON_DARK, bgcolor: primary[800] },
              }}
            >
              <Icon sx={{ fontSize: fontScale[20] }} />
              {item.label}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: "auto", px: 2, pb: 3 }}>
        <Box
          sx={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            pt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <ThemeToggle size="small" />
          <Box
            component="button"
            type="button"
            onClick={onLogout}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              fontSize: fontScale[13],
              color: "rgba(255,255,255,0.65)",
              p: 0,
              "&:hover": { color: "secondary.main" },
            }}
          >
            <LogoutRoundedIcon sx={{ fontSize: fontScale[18] }} />
            Salir
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
