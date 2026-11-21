"use client";

import { Folder, LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

const DASHBOARD_ITEMS = [
  { label: "Resumen", href: "/dashboard", icon: LayoutDashboard },
  { label: "Proyectos", href: "/dashboard/proyectos", icon: Folder },
] as const;

export const DASHBOARD_SIDEBAR_WIDTH = 260;

export interface DashboardSidebarProps {
  onLogout?: () => void;
}

/**
 * Sidebar fijo del dashboard privado (D024): navy sólido permanente
 * (`primary[900]`, no ligado al ThemeToggle), z-index de la capa "sidebar"
 * ya reservada en tokens.ts desde fase 03. Ítem activo con acento izquierdo
 * en `secondary` en vez de un fill naranja completo, para no gastar el
 * color reservado a CTAs de alta prioridad (D011) en navegación.
 * Sin uso hoy (lo reemplazó `DashboardTopbar`); migrado a Tailwind igual.
 */
export function DashboardSidebar({ onLogout }: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      data-surface="navy"
      className="fixed inset-y-0 left-0 z-sidebar flex w-65 flex-col border-r border-on-navy-border bg-primary-900"
    >
      <div className="p-6">
        <Logo tone="inverse" size={40} />
      </div>

      <nav className="mt-3 flex flex-col gap-1 px-4">
        {DASHBOARD_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              (pathname?.startsWith(`${item.href}/`) ?? false));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-md border-l-3 px-2 py-1.25 font-body text-14 font-medium no-underline transition-colors duration-150",
                "hover:bg-primary-800 hover:text-on-navy",
                isActive
                  ? "border-l-secondary bg-primary-800 text-on-navy"
                  : "border-l-transparent bg-transparent text-on-navy-subtle",
              )}
            >
              <Icon className="size-5" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 pb-6">
        <div className="flex items-center justify-between border-t border-on-navy-border pt-4">
          <ThemeToggle size="small" />
          <button
            type="button"
            onClick={onLogout}
            className="flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 font-body text-13 font-medium text-on-navy-subtle hover:text-secondary"
          >
            <LogOut className="size-4.5" aria-hidden="true" />
            Salir
          </button>
        </div>
      </div>
    </aside>
  );
}
