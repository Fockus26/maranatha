"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import { YoutubeIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const sermons = videos && videos.length > 0 ? videos : FALLBACK_SERMONS;
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const activeSermon = sermons.find((s) => s.videoId === activeVideoId);
  // Radix solo devuelve el foco a su `DialogTrigger`; el modal se controla por
  // estado y se abre desde la tarjeta: se guarda quien lo abrió.
  const openerRef = useRef<HTMLElement | null>(null);

  return (
    <section id="predicas" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-7 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-[0.18em] wide:text-13">
              Prédicas
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-[-0.01em] md:text-[38px] wide:text-46">
              Vive cada mensaje, donde estés
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body wide:text-19">
              Revive nuestros últimos servicios y prédicas directamente desde
              nuestro canal de YouTube.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mb-5 grid grid-cols-1 gap-6 sm:grid-cols-2 md:mb-6 md:grid-cols-3">
            {sermons.map((sermon, index) => (
              // Con 3 videos y grid de 2 columnas en `sm`, el último queda
              // solo en su fila — se estira a ancho completo para no dejar
              // hueco. Desde `md` (3 columnas) vuelve a ocupar 1.
              <div
                key={sermon.videoId}
                className={
                  index === sermons.length - 1
                    ? "sm:col-[1/-1] md:col-auto"
                    : undefined
                }
              >
                <YoutubeEmbedCard
                  videoId={sermon.videoId}
                  title={sermon.title}
                  publishedAt={sermon.publishedAt}
                  onPlay={setActiveVideoId}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-center md:justify-start">
            {/* Mismo botón outlined con contraste que "Seguir" y "Ver
                proyecto" (D084, `variant="action"`): César pidió unificar
                todos los botones del estilo neutro anterior (2026-11-10). */}
            <Button asChild variant="action" size="large">
              <a
                href={YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <YoutubeIcon aria-hidden className="size-5" />
                Ver canal de YouTube
              </a>
            </Button>
          </div>
        </Reveal>
      </Container>

      <Dialog
        open={activeVideoId !== null}
        onOpenChange={(next) => {
          if (!next) setActiveVideoId(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          onOpenAutoFocus={() => {
            openerRef.current = document.activeElement as HTMLElement | null;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            openerRef.current?.focus();
          }}
          // `overflow-visible`: el botón de cerrar vive encima del video (-top-11).
          className="gap-0 overflow-visible rounded-lg p-0 sm:max-w-page-md"
        >
          <DialogTitle className="sr-only">
            {activeSermon
              ? `Video: ${activeSermon.title}`
              : "Reproductor de video"}
          </DialogTitle>

          <DialogClose asChild>
            <Button
              variant="plain"
              size="icon"
              aria-label="Cerrar"
              className="absolute -top-11 right-0 text-white hover:bg-white/8 dark:text-white"
            >
              <X aria-hidden className="size-6" />
            </Button>
          </DialogClose>

          {activeVideoId && (
            <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1`}
                title={
                  activeSermon ? `Prédica: ${activeSermon.title}` : "Prédica"
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
