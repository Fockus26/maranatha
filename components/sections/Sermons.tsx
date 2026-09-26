"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import YouTubeIcon from "@mui/icons-material/YouTube";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { YoutubeEmbedCard } from "@/components/ui/YoutubeEmbedCard";
import { YOUTUBE_CHANNEL_URL } from "@/lib/siteConfig";
import type { SermonVideo } from "@/lib/youtube";

/**
 * Sección "Prédicas" — los 3 últimos videos vienen del feed RSS del canal
 * de YouTube (`lib/youtube.ts`, resuelto en `app/page.tsx`). Si el feed
 * falla o no llega nada, cae a `FALLBACK_SERMONS`.
 */

const FALLBACK_SERMONS: SermonVideo[] = [
  {
    videoId: "sermon-placeholder-1",
    title: "El poder de la fe en tiempos de incertidumbre",
    publishedAt: "18 de agosto de 2026",
    publishedIso: "2026-08-18",
  },
  {
    videoId: "sermon-placeholder-2",
    title: "Servir con propósito: una vida entregada a los demás",
    publishedAt: "11 de agosto de 2026",
    publishedIso: "2026-08-11",
  },
  {
    videoId: "sermon-placeholder-3",
    title: "Gracia y comunidad: caminar juntos en fe",
    publishedAt: "4 de agosto de 2026",
    publishedIso: "2026-08-04",
  },
];

export function Sermons({ videos }: { videos?: SermonVideo[] }) {
  const theme = useTheme();
  const sermons = videos && videos.length > 0 ? videos : FALLBACK_SERMONS;
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const activeSermon = sermons.find((s) => s.videoId === activeVideoId);

  return (
    <Box component="section" id="predicas" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box
            sx={{
              maxWidth: 640,
              mx: { xs: "auto", md: 0 },
              textAlign: { xs: "center", md: "left" },
              mb: { xs: 5, md: 7 },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
                "@media (min-width:1920px)": { fontSize: "13px" },
              }}
            >
              Prédicas
            </Typography>

            <Typography
              component="h2"
              sx={{
                fontFamily: "var(--font-heading)",
                fontWeight: 700,
                fontSize: { xs: "28px", md: "38px" },
                "@media (min-width:1920px)": { fontSize: "46px" },
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "text.primary",
                mb: 2,
              }}
            >
              Vive cada mensaje, donde estés
            </Typography>

            <Typography
              sx={{
                fontFamily: "var(--font-body)",
                fontSize: 16,
                "@media (min-width:1920px)": { fontSize: "19px" },
                lineHeight: 1.6,
                color: "text.secondary",
              }}
            >
              Revive nuestros últimos servicios y prédicas directamente desde
              nuestro canal de YouTube.
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.12}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: "24px",
              mb: { xs: 5, md: 6 },
            }}
          >
            {sermons.map((sermon, index) => (
              // Con 3 videos y grid de 2 columnas en `sm`, el último queda
              // solo en su fila — se estira a ancho completo para no dejar
              // hueco. Desde `md` (3 columnas) vuelve a ocupar 1.
              <Box
                key={sermon.videoId}
                sx={
                  index === sermons.length - 1
                    ? { gridColumn: { sm: "1 / -1", md: "auto" } }
                    : undefined
                }
              >
                <YoutubeEmbedCard
                  videoId={sermon.videoId}
                  title={sermon.title}
                  publishedAt={sermon.publishedAt}
                  onPlay={setActiveVideoId}
                />
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: { xs: "center", md: "flex-start" },
            }}
          >
            {/* Mismo tratamiento que "Ver proyecto" (ProjectCard/ProjectSidebar)
                y "Seguir" (SocialLinkCard): neutro en reposo, acento al
                interactuar. Antes el acento era navy (D050-siguiente), pero
                eso chocaba con el hover naranja de las `YoutubeEmbedCard` de
                arriba — dos acentos distintos en la misma sección se sentían
                inconsistentes (feedback directo del cliente). Se cambia a
                naranja para que el botón "cierre" la sección con el mismo
                acento que ya usan las cards al hacer hover. */}
            <Button
              variant="outlined"
              size="large"
              component="a"
              href={YOUTUBE_CHANNEL_URL}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<YouTubeIcon />}
              sx={{
                borderColor: "divider",
                color: "text.secondary",
                "&:hover": {
                  borderColor: "secondary.main",
                  color: "secondary.main",
                  backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                },
              }}
            >
              Ver canal de YouTube
            </Button>
          </Box>
        </Reveal>
      </Container>

      <Dialog
        open={activeVideoId !== null}
        onClose={() => setActiveVideoId(null)}
        maxWidth="md"
        fullWidth
        aria-label={
          activeSermon ? `Video: ${activeSermon.title}` : "Reproductor de video"
        }
        slotProps={{
          paper: {
            sx: { backgroundColor: "background.paper", borderRadius: "12px" },
          },
        }}
      >
        <Box sx={{ position: "relative", p: 0 }}>
          <IconButton
            onClick={() => setActiveVideoId(null)}
            aria-label="Cerrar"
            sx={{
              position: "absolute",
              top: -44,
              right: 0,
              color: "common.white",
            }}
          >
            <CloseRoundedIcon />
          </IconButton>

          {activeVideoId && (
            <Box
              sx={{
                position: "relative",
                aspectRatio: "16 / 9",
                backgroundColor: "#000",
              }}
            >
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1`}
                title={
                  activeSermon ? `Prédica: ${activeSermon.title}` : "Prédica"
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
              />
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
