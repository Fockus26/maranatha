"use client";

import InstagramIcon from "@mui/icons-material/Instagram";
import IconButton from "@mui/material/IconButton";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { gray, primary, secondary } from "@/theme/tokens";
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
          <IconButton
            component="a"
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Instagram de ${name}`}
            size="small"
            sx={{
              width: 32,
              height: 32,
              borderRadius: "8px",
              backgroundColor: alpha(primary[700], 0.55),
              border: `1px solid ${alpha(gray[50], 0.25)}`,
              color: gray[50],
              "&:hover": {
                backgroundColor: alpha(secondary[500], 0.85),
                borderColor: secondary[500],
              },
            }}
          >
            <InstagramIcon sx={{ fontSize: 16 }} />
          </IconButton>
        )
      }
      bottomSlot={
        <>
          <Typography
            component="p"
            sx={{
              fontFamily: "var(--font-heading)",
              fontWeight: 700,
              fontSize: "18px",
              color: gray[50],
              mb: 0.25,
              letterSpacing: "-0.01em",
            }}
          >
            {name}
          </Typography>
          <Typography
            sx={{
              fontFamily: "var(--font-body)",
              fontSize: "13px",
              fontWeight: 500,
              color: secondary[300],
            }}
          >
            {role}
          </Typography>
        </>
      }
    />
  );
}
