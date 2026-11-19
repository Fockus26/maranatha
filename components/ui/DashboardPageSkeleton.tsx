import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { DASHBOARD_CONTENT_SX } from "@/components/layout/DashboardShell";
import { radius } from "@/theme/tokens";

/** Contenido en gris del panel mientras llega la página (D095). */
export function DashboardPageSkeleton() {
  return (
    <Box
      aria-busy="true"
      sx={{ ...DASHBOARD_CONTENT_SX, py: { xs: 4, md: 6 } }}
    >
      <Skeleton variant="text" width="35%" sx={{ fontSize: 32 }} />
      <Skeleton variant="text" width="55%" sx={{ fontSize: 16, mb: 4 }} />
      <Skeleton
        variant="rounded"
        height={360}
        sx={{ borderRadius: `${radius.lg}px` }}
      />
    </Box>
  );
}
