import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SkeletonButton,
  SkeletonContent,
  SkeletonHeading,
  SkeletonLine,
} from "./skeletonParts";

const GROUPS = [
  { title: "Reuniones semanales", rows: [0, 1, 2] },
  { title: "Eventos especiales", rows: [0, 1] },
] as const;

/** Esqueleto de `/dashboard/agenda`: mismos grupos y filas que `EventGroup`. */
export function AgendaSkeleton() {
  return (
    <SkeletonFrame label="agenda">
      <SkeletonContent maxWidthClass="max-w-[1000px]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <SkeletonHeading
            title="Agenda"
            subtitle="Lo que se muestra en la sección «Agenda» de la página de inicio."
          />
          <SkeletonButton widthClass="w-37.5" />
        </div>
        {GROUPS.map((group) => (
          <section key={group.title} className="mb-5">
            <h2 className="mb-1.5 font-heading text-18 font-bold text-foreground">
              {group.title}
            </h2>
            <div className="overflow-hidden rounded-lg border border-border bg-card">
              {group.rows.map((row) => (
                <div
                  key={row}
                  className="flex items-center gap-2 px-2 py-2 not-last:border-b not-last:border-border sm:px-3"
                >
                  <div className="min-w-0 flex-1">
                    <SkeletonLine size="text-body" className="w-9/20" />
                    <SkeletonLine size="text-small" className="w-3/10" />
                  </div>
                  <Skeleton className="h-7 w-16" />
                </div>
              ))}
            </div>
          </section>
        ))}
      </SkeletonContent>
    </SkeletonFrame>
  );
}
