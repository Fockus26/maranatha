"use client";

import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import Box from "@mui/material/Box";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import type * as React from "react";
import { gray, primary } from "@/theme/tokens";

export interface YoutubeEmbedCardProps {
  videoId: string;
  title: string;
  publishedAt: string; // ya formateada, ej. "18 de agosto, 2026"
  onPlay?: (videoId: string) => void;
}

export function YoutubeEmbedCard({
  videoId,
  title,
  publishedAt,
  onPlay,
}: YoutubeEmbedCardProps) {
  const theme = useTheme();
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleClick = () => onPlay?.(videoId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <Box
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Reproducir: ${title}`}
      sx={{
        borderRadius: "12px",
        overflow: "hidden",
        border: `1px solid ${theme.palette.divider}`,
        backgroundColor: "background.paper",
        cursor: "pointer",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          borderColor: theme.palette.secondary.main,
          boxShadow: theme.shadows[1],
        },
        "&:hover .play-button": {
          backgroundColor: primary[600],
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.palette.secondary.main}`,
          outlineOffset: "2px",
        },
      }}
    >
      {/* Thumbnail */}
      <Box
        sx={{
          position: "relative",
          aspectRatio: "16 / 9",
          backgroundColor: primary[400], // fallback mientras carga la miniatura
          backgroundImage: `url(${thumbnailUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Box
          className="play-button"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: alpha(primary[700], 0.55),
            transition: "background-color 0.2s ease",
          }}
        >
          <PlayArrowRoundedIcon sx={{ color: gray[50], fontSize: 22 }} />
        </Box>
      </Box>

      {/* Cuerpo */}
      <Box sx={{ p: 1.75 }}>
        {/*
          Fase 09 (feedback puntual): antes solo tenía `WebkitLineClamp: 2`
          (recorta y agrega "…" si el título excede 2 líneas), pero sin una
          altura reservada — un título de 1 línea dejaba la card más baja que
          una de 2 líneas, así que el grid se veía dispar entre cards. Se fija
          `height` a exactamente 2 líneas (`fontSize` 14px × `lineHeight` 1.3
          × 2) para que toda card mida lo mismo sin importar cuántas líneas
          ocupe el título real.
        */}
        <Typography
          component="p"
          sx={{
            fontFamily: "var(--font-heading)",
            fontWeight: 600,
            fontSize: "14px",
            color: "text.primary",
            lineHeight: 1.3,
            height: "36.4px",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {title}
        </Typography>
        <Typography
          sx={{
            fontFamily: "var(--font-body)",
            fontSize: "12px",
            color: "text.secondary",
            mt: 0.75,
          }}
        >
          {publishedAt}
        </Typography>
      </Box>
    </Box>
  );
}
