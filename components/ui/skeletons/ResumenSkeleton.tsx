import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { visuallyHidden } from "@mui/utils";
import { fontScale, radius, typography } from "@/theme/tokens";
import { DashboardStatBand } from "../DashboardStatBand";
import { SkeletonFrame } from "./SkeletonFrame";
import { SKELETON_ACTION_HEIGHT } from "./skeletonParts";

const STATS = [
  { label: "Total recaudado", value: "", accent: true },
  { label: "Proyectos activos", value: "" },
  { label: "Proyectos completados", value: "" },
];
const ROWS = [0, 1, 2, 3] as const;

const cardSx = {
  border: 1,
  borderColor: "divider",
  borderRadius: `${radius.lg}px`,
  bgcolor: "background.paper",
  p: { xs: 3, md: 4 },
} as const;

const cardTitleSx = {
  fontFamily: typography.fontFamily.heading,
  fontWeight: 700,
  fontSize: fontScale[18],
  color: "text.primary",
} as const;

/** Esqueleto de `/dashboard`: banda de KPIs y las dos tarjetas del Resumen. */
export function ResumenSkeleton() {
  return (
    <SkeletonFrame label="el resumen">
      <Typography component="h1" sx={visuallyHidden}>
        Resumen del dashboard
      </Typography>
      <DashboardStatBand loading stats={STATS} />
      <Box sx={{ px: { xs: 3, md: 5 }, py: 5, maxWidth: 1400, mx: "auto" }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.6fr 1fr" },
            gap: 3,
          }}
        >
          <Box sx={cardSx}>
            <Typography sx={{ ...cardTitleSx, mb: 0.75 }}>
              Próximos cierres
            </Typography>
            <Typography
              sx={{
                fontFamily: typography.fontFamily.body,
                fontSize: fontScale[13],
                color: "text.secondary",
                mb: 3.5,
              }}
            >
              Proyectos activos ordenados por fecha de cierre.
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column" }}>
              {ROWS.map((row) => (
                <Box
                  key={row}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    py: 2.5,
                    borderBottom: 1,
                    borderColor: "divider",
                    "&:last-of-type": { borderBottom: "none", pb: 0 },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton
                      variant="text"
                      width="50%"
                      sx={{ fontSize: fontScale[14], mb: 1 }}
                    />
                    <Skeleton
                      variant="rounded"
                      height={5}
                      sx={{ borderRadius: `${radius.pill}px` }}
                    />
                  </Box>
                  <Box sx={{ flexShrink: 0, minWidth: 110 }}>
                    <Skeleton
                      variant="text"
                      width="70%"
                      sx={{ fontSize: fontScale[13], ml: "auto" }}
                    />
                    <Skeleton variant="text" sx={{ fontSize: fontScale[12] }} />
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={cardSx}>
            <Typography sx={{ ...cardTitleSx, mb: 2.5 }}>
              Acciones rápidas
            </Typography>
            <Skeleton
              variant="rounded"
              height={SKELETON_ACTION_HEIGHT}
              sx={{ borderRadius: `${radius.sm}px`, mb: 1.5 }}
            />
            <Skeleton
              variant="rounded"
              height={SKELETON_ACTION_HEIGHT}
              sx={{ borderRadius: `${radius.sm}px` }}
            />
            <Box sx={{ mt: 3.5, pt: 3, borderTop: 1, borderColor: "divider" }}>
              <Typography
                sx={{
                  fontSize: fontScale[12],
                  color: "text.secondary",
                  mb: 0.5,
                }}
              >
                Meta acumulada
              </Typography>
              <Skeleton
                variant="text"
                width={120}
                sx={{ fontSize: fontScale[20] }}
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </SkeletonFrame>
  );
}
