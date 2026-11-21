"use client";

import { InstagramIcon } from "@/components/ui/brand-icons";
import { PhotoOverlayCard } from "./PhotoOverlayCard";

export interface LeaderCardProps {
  name: string;
  role: string;
  imageUrl: string;
  instagramUrl?: string;
}

export function LeaderCard({
  name,
  role,
  imageUrl,
  instagramUrl,
}: LeaderCardProps) {
  return (
    <PhotoOverlayCard
      imageUrl={imageUrl}
      topRightSlot={
        instagramUrl && (
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram de ${name}`}
            className="inline-flex size-11 items-center justify-center rounded-md border border-gray-50/25 bg-primary-700/55 text-gray-50 transition-colors hover:border-secondary-500 hover:bg-secondary-500/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <InstagramIcon className="size-5" />
          </a>
        )
      }
      bottomSlot={
        <>
          <p className="mb-px font-bold font-heading text-18 text-gray-50 tracking-[-0.01em]">
            {name}
          </p>
          <p className="font-body font-medium text-13 text-secondary-300">
            {role}
          </p>
        </>
      }
    />
  );
}
