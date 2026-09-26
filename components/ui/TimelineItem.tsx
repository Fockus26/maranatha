"use client";

import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { primary, secondary, typography } from "@/theme/tokens";

export interface TimelineItemProps {
  year: string;
  title: string;
  description: string;
  progress: number;
}

// El último paso era `secondary[500]` (#F9750D) — a 40px sobre fondo claro
// da 2.7:1 (mín. 3:1). `secondary[700]` lo sube a ~5.9:1.
const RAMP_LIGHT = [
  primary[700],
  primary[500],
  secondary[700],
  secondary[700],
] as const;
const RAMP_DARK = [
  primary[300],
  primary[200],
  secondary[300],
  secondary[500],
] as const;

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
}

function rampColor(ramp: readonly string[], progress: number): string {
  const t = Math.min(Math.max(progress, 0), 1);
  const scaled = t * (ramp.length - 1);
  const index = Math.min(Math.floor(scaled), ramp.length - 2);
  const local = scaled - index;

  const from = hexToRgb(ramp[index]);
  const to = hexToRgb(ramp[index + 1]);

  return rgbToHex([
    Math.round(from[0] + (to[0] - from[0]) * local),
    Math.round(from[1] + (to[1] - from[1]) * local),
    Math.round(from[2] + (to[2] - from[2]) * local),
  ]);
}

export function TimelineItem({
  year,
  title,
  description,
  progress,
}: TimelineItemProps) {
  const theme = useTheme();
  const yearColor = rampColor(
    theme.palette.mode === "light" ? RAMP_LIGHT : RAMP_DARK,
    progress,
  );

  return (
    <Box
      sx={{
        display: "flex",
        gap: 5,
        py: 4,
        borderBottom: `1px solid ${theme.palette.divider}`,
        "&:last-of-type": { borderBottom: "none" },
      }}
    >
      <Typography
        component="p"
        sx={{
          fontFamily: typography.fontFamily.heading,
          fontWeight: 800,
          fontSize: "40px",
          lineHeight: 1,
          width: 120,
          flexShrink: 0,
          color: yearColor,
        }}
      >
        {year}
      </Typography>

      <Box sx={{ pt: 1.5 }}>
        <Typography
          component="p"
          sx={{
            fontFamily: typography.fontFamily.heading,
            fontWeight: 600,
            fontSize: theme.typography.body2.fontSize,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: typography.fontFamily.body,
            fontSize: theme.typography.caption.fontSize,
            color: theme.palette.text.secondary,
            maxWidth: 340,
          }}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
