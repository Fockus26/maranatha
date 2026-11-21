import { Skeleton } from "@/components/ui/skeleton";
import { DashboardTable } from "../DashboardTable";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SkeletonButton,
  SkeletonContent,
  SkeletonHeading,
} from "./skeletonParts";

function noop() {}

/** Esqueleto de `/dashboard/proyectos`: encabezado, buscador y la tabla en carga. */
export function ProyectosSkeleton() {
  return (
    <SkeletonFrame label="proyectos">
      <SkeletonContent maxWidthClass="max-w-[1400px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SkeletonHeading title="Proyectos" />
          <SkeletonButton widthClass="w-40" />
        </div>
        <Skeleton className="mb-3 h-10 w-full sm:w-80" />
        {/* En carga la tabla no pinta filas: las acciones nunca se llaman. */}
        <DashboardTable projects={[]} loading onEdit={noop} onDelete={noop} />
      </SkeletonContent>
    </SkeletonFrame>
  );
}
