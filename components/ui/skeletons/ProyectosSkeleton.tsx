import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { radius } from "@/theme/tokens";
import { DashboardTable } from "../DashboardTable";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SKELETON_BUTTON_HEIGHT,
  SkeletonButton,
  SkeletonHeading,
  skeletonContentSx,
} from "./skeletonParts";

/** Esqueleto de `/dashboard/proyectos`: encabezado, buscador y la tabla en carga. */
export function ProyectosSkeleton() {
  return (
    <SkeletonFrame label="proyectos">
      <Box sx={skeletonContentSx(1400)}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 4,
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <SkeletonHeading title="Proyectos" />
          <SkeletonButton width={160} />
        </Box>
        <Skeleton
          variant="rounded"
          height={SKELETON_BUTTON_HEIGHT}
          sx={{
            width: { xs: "100%", sm: 320 },
            mb: 3,
            borderRadius: `${radius.sm}px`,
          }}
        />
        <DashboardTable projects={[]} loading />
      </Box>
    </SkeletonFrame>
  );
}
