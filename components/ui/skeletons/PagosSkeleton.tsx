import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { fontScale, radius } from "@/theme/tokens";
import { DashboardStatBand } from "../DashboardStatBand";
import { SkeletonFrame } from "./SkeletonFrame";
import {
  SkeletonButton,
  SkeletonHeading,
  skeletonContentSx,
} from "./skeletonParts";

const STATS = [
  { label: "Pendientes de verificar", value: "", accent: true },
  { label: "Confirmado este mes", value: "" },
  { label: "Aportes confirmados este mes", value: "" },
];
const FILTERS = [
  "Pendientes",
  "Confirmados",
  "Rechazados",
  "Cancelados",
  "Todos",
] as const;
const CARDS = [0, 1, 2] as const;
const CARD_FIELDS = [0, 1, 2, 3] as const;

/** Esqueleto de `/dashboard/pagos`: banda, filtros y tarjetas de pago. */
export function PagosSkeleton() {
  return (
    <SkeletonFrame label="pagos">
      <DashboardStatBand loading stats={STATS} />
      <Box sx={skeletonContentSx(1400)}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ minWidth: 0, flex: "1 1 320px" }}>
            <SkeletonHeading
              title="Pagos"
              subtitle="Verifica cada reporte contra tu banco o app antes de confirmarlo. Solo los pagos confirmados suman a lo recaudado."
            />
          </Box>
          <SkeletonButton width={160} />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
          {FILTERS.map((label, index) => (
            <Box
              key={label}
              component="span"
              sx={{
                px: 2,
                py: 0.75,
                borderRadius: `${radius.pill}px`,
                fontSize: fontScale[13],
                fontWeight: 500,
                border: 1,
                borderColor: index === 0 ? "secondary.main" : "divider",
                color: index === 0 ? "text.primary" : "text.secondary",
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "grid", gap: 2 }}>
          {CARDS.map((card) => (
            <Box
              key={card}
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: `${radius.md}px`,
                bgcolor: "background.paper",
                p: { xs: 2.5, md: 3 },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  flexWrap: "wrap",
                  mb: 2,
                }}
              >
                <Box sx={{ minWidth: 0, flex: "1 1 240px" }}>
                  <Skeleton
                    variant="text"
                    width="55%"
                    sx={{ fontSize: fontScale[15] }}
                  />
                  <Skeleton
                    variant="text"
                    width="75%"
                    sx={{ fontSize: fontScale[12] }}
                  />
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Skeleton
                    variant="text"
                    width={72}
                    sx={{ fontSize: fontScale[20] }}
                  />
                  <Skeleton
                    variant="rounded"
                    width={76}
                    height={22}
                    sx={{ borderRadius: `${radius.pill}px` }}
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" },
                  gap: 2,
                }}
              >
                {CARD_FIELDS.map((field) => (
                  <Box key={field}>
                    <Skeleton
                      variant="text"
                      width="40%"
                      sx={{ fontSize: fontScale[11] }}
                    />
                    <Skeleton
                      variant="text"
                      width="70%"
                      sx={{ fontSize: fontScale[14] }}
                    />
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </SkeletonFrame>
  );
}
