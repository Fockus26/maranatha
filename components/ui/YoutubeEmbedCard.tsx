"use client";

import { Play } from "lucide-react";
import type * as React from "react";

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
  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

  const handleClick = () => onPlay?.(videoId);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    // biome-ignore lint/a11y/useSemanticElements: tarjeta con miniatura y texto; conserva el `div` con rol de botón del diseño original
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Reproducir: ${title}`}
      className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-[border-color,box-shadow] duration-200 ease-in-out hover:border-secondary hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {/* Thumbnail */}
      <div
        style={{ backgroundImage: `url(${thumbnailUrl})` }}
        // primary-400: fallback mientras carga la miniatura
        className="relative aspect-video bg-center bg-cover bg-primary-400"
      >
        <div className="absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary-700/55 transition-colors duration-200 ease-in-out group-hover:bg-primary-600">
          <Play aria-hidden className="size-5.5 fill-current text-gray-50" />
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-1.75">
        {/*
          Fase 09 (feedback puntual): altura reservada de exactamente 2 líneas
          (14px × 1.3 × 2 = 36.4px) para que toda card mida lo mismo sin
          importar cuántas líneas ocupe el título real; `line-clamp-2` recorta
          y agrega "…" si excede.
        */}
        <p className="line-clamp-2 h-9.1 overflow-hidden font-heading font-semibold text-14 text-foreground leading-[1.3]">
          {title}
        </p>
        <p className="mt-0.75 font-body text-12 text-muted-foreground">
          {publishedAt}
        </p>
      </div>
    </div>
  );
}
