"use client";

import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import Image from "next/image";
import type { KeyboardEvent, ReactNode } from "react";
import { primary } from "@/theme/tokens";

export interface PhotoOverlayCardProps {
  imageUrl: string;
  imageAlt?: string;
  height?: number | string;
  topLeftSlot?: ReactNode;
  topRightSlot?: ReactNode;
  bottomSlot: ReactNode;
  onClick?: () => void;
}

export function PhotoOverlayCard({
  imageUrl,
  imageAlt = "",
  height = 360,
  topLeftSlot,
  topRightSlot,
  bottomSlot,
  onClick,
}: PhotoOverlayCardProps) {
  const theme = useTheme();

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <Box
      component={motion.div}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      whileHover="hover"
      initial="rest"
      sx={{
        position: "relative",
        height,
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        cursor: onClick ? "pointer" : "default",
        transition: "border-color 0.2s ease",
        "&:hover": { borderColor: theme.palette.secondary.main },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.secondary.main}`,
          outlineOffset: "2px",
        },
      }}
    >
      {/* Foto de fondo — cubre el 100% de la altura del card */}
      <Box
        component={motion.div}
        variants={{
          rest: { scale: 1.02, filter: "grayscale(35%) contrast(1.05)" },
          hover: { scale: 1.08, filter: "grayscale(10%) contrast(1.05)" },
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        sx={{ position: "absolute", inset: 0 }}
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
          style={{ objectFit: "cover" }}
        />
      </Box>

      {/* Overlay: gradiente navy de abajo hacia arriba, legibilidad del texto */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top,
            ${alpha(primary[900], 0.92)} 0%,
            ${alpha(primary[900], 0.5)} 40%,
            ${alpha(primary[900], 0.05)} 70%)`,
        }}
      />

      {topLeftSlot && (
        <Box sx={{ position: "absolute", top: 16, left: 16 }}>
          {topLeftSlot}
        </Box>
      )}
      {topRightSlot && (
        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
          {topRightSlot}
        </Box>
      )}

      <Box sx={{ position: "absolute", left: 0, right: 0, bottom: 0, p: 2.25 }}>
        {bottomSlot}
      </Box>
    </Box>
  );
}
