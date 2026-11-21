"use client";

import { motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { Logo } from "@/components/brand/Logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { initialsOf, realName } from "@/lib/auth/initials";
import { useDashboardAdmin } from "@/lib/dashboardAdminStore";
import { cn } from "@/lib/utils";
import { DASHBOARD_CONTENT_CLASS } from "./DashboardShell";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const NAV_ITEMS = [
  { label: "Resumen", href: "/dashboard" },
  { label: "Proyectos", href: "/dashboard/proyectos" },
  { label: "Pagos", href: "/dashboard/pagos" },
  { label: "Agenda", href: "/dashboard/agenda" },
] as const;

// Botones sobre navy en los dos modos (D025/D113): `plain` pinta el gris de
// acción de MUI, que sobre el navy fijo no se lee; se fuerza el blanco.
const NAVY_ICON_BUTTON =
  "size-11 text-on-navy hover:bg-on-navy-hover dark:text-on-navy dark:hover:bg-on-navy-hover";

function isActiveHref(pathname: string | null, href: string) {
  return (
    pathname === href ||
    (href !== "/dashboard" && (pathname?.startsWith(`${href}/`) ?? false))
  );
}

/**
 * Círculo con las iniciales del admin con sesión (D107), del contexto que
 * siembra el layout del panel. Se anuncia como imagen con el nombre (o el
 * correo, si la cuenta quedó con el nombre por defecto). Oculto en xs para
 * dar espacio a la navegación.
 */
function AdminInitials() {
  const admin = useDashboardAdmin();
  if (!admin) return null;
  const label = realName(admin.name) ?? admin.email;
  return (
    <Avatar
      role="img"
      aria-label={`Sesión de ${label}`}
      title={label}
      className="hidden sm:flex"
    >
      <AvatarFallback>{initialsOf(admin.name, admin.email)}</AvatarFallback>
    </Avatar>
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
 * (`secondary-700`, el mismo naranja apagado de "seleccionado" ya usado en
 * el tab de Proyectos D051 y la píldora activa del navbar público D054) en
 * vez de un acento lateral de 3px.
 *
 * Bajo `md` la navegación pasa a un `sheet` navy (D131): foco atrapado,
 * Escape y retorno del foco al botón de menú los da Radix.
 */
export function DashboardTopbar({ onLogout }: DashboardTopbarProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <header
      data-surface="navy"
      className="sticky top-0 z-navbar border-b border-on-navy-border bg-primary-900"
    >
      {/* El fondo navy ocupa todo el ancho; el contenido se alinea con el de
          las páginas (`DASHBOARD_CONTENT_CLASS`: 1400px centrado, mismo padding). */}
      <div
        className={cn(
          DASHBOARD_CONTENT_CLASS,
          "flex h-18 items-center justify-between",
        )}
      >
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3 md:gap-5">
          <div className="flex shrink-0 items-center gap-1.25">
            <span className="inline-flex sm:hidden">
              <Logo variant="mark" tone="inverse" size={32} />
            </span>
            <span className="hidden sm:inline-flex">
              <Logo variant="compact" tone="inverse" size={32} />
            </span>
          </div>

          {/* design-qa fase 09: con 4 ítems la fila no entra bajo 900px
            ("Agenda" quedaba oculta). Bajo `md` la navegación pasa a un
            menú lateral (sheet); desde `md` sigue siendo la fila de píldoras. */}
          <nav
            aria-label="Secciones del panel"
            className="hidden min-w-0 gap-0.75 md:flex"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = isActiveHref(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "relative rounded-pill px-2.5 py-1.1 font-body text-14 font-medium no-underline transition-colors duration-150 hover:text-on-navy",
                    isActive
                      ? "text-on-navy"
                      : "text-on-navy-subtle hover:bg-on-navy-hover",
                  )}
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
                    <motion.div
                      layoutId="dashboard-nav-active-pill"
                      transition={{ duration: 0.25, ease: EASE }}
                      className="absolute inset-0 z-0 rounded-pill bg-secondary-700"
                    />
                  )}
                  <span className="relative z-1">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="plain"
                size="icon"
                aria-label="Abrir menú del panel"
                className={cn(NAVY_ICON_BUTTON, "md:hidden")}
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              showCloseButton={false}
              data-surface="navy"
              aria-describedby={undefined}
              className="data-[side=right]:max-w-70 data-[side=right]:md:max-w-70"
            >
              <SheetTitle className="sr-only">Menú del panel</SheetTitle>
              <div className="flex h-18 items-center justify-between border-b border-on-navy-border px-4">
                <Logo variant="compact" tone="inverse" size={32} />
                <SheetClose asChild>
                  <Button
                    variant="plain"
                    size="icon"
                    aria-label="Cerrar menú del panel"
                    className={NAVY_ICON_BUTTON}
                  >
                    <X aria-hidden="true" />
                  </Button>
                </SheetClose>
              </div>
              <nav
                aria-label="Secciones del panel"
                className="flex flex-col gap-0.75 p-4"
              >
                {NAV_ITEMS.map((item) => {
                  const isActive = isActiveHref(pathname, item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex min-h-12 items-center rounded-md px-4 font-body text-16 font-medium no-underline hover:text-on-navy",
                        isActive
                          ? "bg-secondary-700 text-on-navy"
                          : "text-on-navy-muted hover:bg-on-navy-hover",
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
          <ThemeToggle size="small" />
          {/* Divisor puramente decorativo — se oculta en mobile para ganar
            espacio en el topbar (fase 08). */}
          <div
            aria-hidden="true"
            className="hidden h-6 w-px bg-on-navy-divider sm:block"
          />
          <AdminInitials />
          <button
            type="button"
            onClick={onLogout}
            aria-label="Cerrar sesión"
            className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center border-0 bg-transparent text-on-navy-subtle hover:text-secondary"
          >
            <LogOut className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
