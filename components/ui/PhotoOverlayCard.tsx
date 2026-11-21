"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";

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
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      whileHover="hover"
      initial="rest"
      style={{ height }}
      className={cn(
        "relative overflow-hidden rounded-lg border border-border transition-[border-color] duration-200 ease-in-out hover:border-secondary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        onClick ? "cursor-pointer" : "cursor-default",
      )}
    >
      {/* Foto de fondo — cubre el 100% de la altura del card */}
      <motion.div
        variants={{
          rest: { scale: 1.02, filter: "grayscale(35%) contrast(1.05)" },
          hover: { scale: 1.08, filter: "grayscale(10%) contrast(1.05)" },
        }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="absolute inset-0"
      >
        <Image
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 25vw"
          className="object-cover"
        />
      </motion.div>

      {/* Overlay: gradiente navy de abajo hacia arriba, legibilidad del texto */}
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-t from-0% from-primary-900/92 via-40% via-primary-900/50 to-70% to-primary-900/5"
      />

      {topLeftSlot && (
        <div className="absolute top-4 left-4">{topLeftSlot}</div>
      )}
      {topRightSlot && (
        <div className="absolute top-4 right-4">{topRightSlot}</div>
      )}

      <div className="absolute right-0 bottom-0 left-0 p-2.25">
        {bottomSlot}
      </div>
    </motion.div>
  );
}
