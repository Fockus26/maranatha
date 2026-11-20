import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import { radius, typography } from "@/theme/tokens";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SkeletonButton,
  SkeletonHeading,
  skeletonContentSx,
} from "./skeletonParts";

const GROUPS = [
  { title: "Reuniones semanales", rows: [0, 1, 2] },
  { title: "Eventos especiales", rows: [0, 1] },
] as const;

/** Esqueleto de `/dashboard/agenda`: mismos grupos y filas que `EventGroup`. */
export function AgendaSkeleton() {
  return (
    <SkeletonFrame label="agenda">
      <Box sx={skeletonContentSx(1000)}>
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
          <SkeletonHeading
            title="Agenda"
            subtitle="Lo que se muestra en la sección «Agenda» de la página de inicio."
          />
          <SkeletonButton width={150} />
        </Box>
        {GROUPS.map((group) => (
          <Box component="section" key={group.title} sx={{ mb: 5 }}>
            <Typography
              component="h2"
              sx={{
                fontFamily: typography.fontFamily.heading,
                fontWeight: 700,
                fontSize: typography.size.h4.mobile,
                color: "text.primary",
                mb: 1.5,
              }}
            >
              {group.title}
            </Typography>
            <Box
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: `${radius.lg}px`,
                bgcolor: "background.paper",
                overflow: "hidden",
              }}
            >
              {group.rows.map((row) => (
                <Box
                  key={row}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    "&:not(:last-of-type)": {
                      borderBottom: 1,
                      borderColor: "divider",
                    },
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Skeleton
                      variant="text"
                      width="45%"
                      sx={{ fontSize: typography.size.body }}
                    />
                    <Skeleton
                      variant="text"
                      width="30%"
                      sx={{ fontSize: typography.size.small }}
                    />
                  </Box>
                  <Skeleton
                    variant="rounded"
                    width={64}
                    height={28}
                    sx={{ borderRadius: `${radius.sm}px` }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        ))}
      </Box>
    </SkeletonFrame>
  );
}
