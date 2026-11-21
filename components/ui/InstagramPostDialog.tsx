"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InstagramIcon } from "@/components/ui/brand-icons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import type {
  InstagramMedia,
  InstagramPost,
  InstagramProfile,
} from "@/lib/instagram";
import { cn } from "@/lib/utils";

/**
 * Visor de una publicación de Instagram (feed de Behold, ver
 * `lib/instagram.ts`). Se abre desde la grilla de `SocialLinks`.
 *
 * - Carruseles: todas las fotos/videos del álbum, con flechas, contador y
 *   flechas del teclado, arrastre y scroll horizontal (rueda/trackpad).
 *   Transición deslizante entre elementos (solo
 *   fundido con `prefers-reduced-motion`) y deslizar con el dedo en fotos.
 * - El escenario toma la proporción real del medio (la del primer elemento en
 *   álbumes) y el medio se ve entero (`contain`): sin recortes ni franjas. El
 *   ancho del diálogo sale de esa proporción (D083).
 * - Reels y videos: se reproducen aquí con los controles nativos (sin
 *   autoplay). Si el `.mp4` del CDN de Instagram ya caducó, se ofrece abrir
 *   el post en Instagram.
 * - Sobre el `dialog` de shadcn (D126): pantalla completa bajo `md` con clases
 *   (`max-md:`), sin `useMediaQuery`, y el foco vuelve a la celda que lo abrió.
 * - Likes y comentarios: solo los contadores. Behold es de solo lectura, así
 *   que dar like o comentar se hace en Instagram (botón al pie).
 */

/** Alto máximo del escenario en md+ (px); de él y la proporción sale el ancho. */
const STAGE_MAX_PX = 640;
/** Ancho que ocupan el panel de texto (360) y los márgenes del diálogo (64). */
const STAGE_RESERVED_PX = 424;

/** Scroll horizontal acumulado (px) para pasar de diapositiva. */
const WHEEL_PX = 40;
/** Silencio (ms) sin eventos de rueda para dar por terminado un gesto. */
const WHEEL_IDLE_MS = 400;

/** `sizes` del `<img>`: ancho real del escenario (md+ = alto × proporción). */
function imageSizes(aspect: number) {
  return `(min-width: 900px) ${Math.round(STAGE_MAX_PX * aspect)}px, 100vw`;
}

/** Desplazamiento mínimo (px) para que un deslizamiento cambie de foto. */
const SWIPE_PX = 60;

export function formatCount(n: number): string {
  return new Intl.NumberFormat("es-VE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(n);
}

function formatDate(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Intl.DateTimeFormat("es-VE", { dateStyle: "long" }).format(d);
}

function MediaSlide({
  media,
  permalink,
  label,
  stageAspect,
}: {
  media: InstagramMedia;
  permalink: string;
  label: string;
  stageAspect: number;
}) {
  const [failed, setFailed] = useState(false);

  if (media.type === "video" && media.videoUrl && !failed) {
    return (
      // Los videos de Instagram no traen subtítulos; el texto del post va al lado.
      // biome-ignore lint/a11y/useMediaCaption: ídem
      <video
        key={media.id}
        src={media.videoUrl}
        poster={media.image.src}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
        onError={() => setFailed(true)}
        className="block size-full object-contain"
      />
    );
  }

  return (
    <div className="relative size-full">
      {/* biome-ignore lint/performance/noImgElement: `srcSet` remoto del CDN de Instagram (Behold) */}
      <img
        key={media.id}
        src={media.image.src}
        srcSet={media.image.srcSet || undefined}
        sizes={media.image.srcSet ? imageSizes(stageAspect) : undefined}
        alt={label}
        draggable={false}
        className="block size-full object-contain"
      />
      {failed && (
        <div className="absolute inset-x-0 bottom-0 bg-primary-900/80 p-2 text-center text-gray-50">
          <p className="mb-1 text-14">
            Este video ya no se puede reproducir aquí.
          </p>
          <Link
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-14 text-secondary-light dark:text-secondary-light"
          >
            Verlo en Instagram (pestaña nueva)
          </Link>
        </div>
      )}
    </div>
  );
}

export interface InstagramPostDialogProps {
  post: InstagramPost | null;
  accountLabel: string;
  handle: string;
  profile: InstagramProfile | null;
  onClose: () => void;
}

export function InstagramPostDialog({
  post,
  accountLabel,
  handle,
  profile,
  onClose,
}: InstagramPostDialogProps) {
  const reduceMotion = useReducedMotion();
  // `direction`: 1 avanza, -1 retrocede — decide hacia dónde se desliza.
  const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);
  const [prevPostId, setPrevPostId] = useState(post?.id);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const goRef = useRef<(delta: number) => void>(() => {});
  // Radix solo devuelve el foco a su `DialogTrigger`; aquí el visor se controla
  // por estado y se abre desde una celda: se guarda quien lo abrió.
  const openerRef = useRef<HTMLElement | null>(null);
  const total = post?.media.length ?? 0;

  // Al abrir otro post, vuelve a la primera diapositiva.
  if (post?.id !== prevPostId) {
    setPrevPostId(post?.id);
    setSlide([0, 0]);
  }

  const go = (delta: number) =>
    setSlide(([i]) => [Math.max(0, Math.min(total - 1, i + delta)), delta]);

  useEffect(() => {
    goRef.current = go;
  });

  // Scroll horizontal (rueda / trackpad): un gesto = una diapositiva. Un gesto
  // de trackpad dispara decenas de eventos (y la inercia sigue después), así
  // que se acumula hasta `WHEEL_PX` y se bloquea hasta que pasa
  // `WHEEL_IDLE_MS` sin eventos. Listener no pasivo para poder frenar el
  // gesto de "atrás" del navegador; el scroll vertical no se toca.
  useEffect(() => {
    if (!stageEl || total < 2) return;
    let acc = 0;
    let locked = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      clearTimeout(timer);
      timer = setTimeout(() => {
        locked = false;
        acc = 0;
      }, WHEEL_IDLE_MS);
      if (locked) return;
      acc += e.deltaX;
      if (Math.abs(acc) >= WHEEL_PX) {
        goRef.current(acc > 0 ? 1 : -1);
        locked = true;
        acc = 0;
      }
    };
    stageEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      stageEl.removeEventListener("wheel", onWheel);
      clearTimeout(timer);
    };
  }, [stageEl, total]);

  // Radix no monta el contenido cerrado: sin publicación no hay diálogo.
  if (!post) return null;

  const current = post.media[Math.min(index, total - 1)];
  const kind = post.isReel ? "Reel" : post.isVideo ? "Video" : "Publicación";
  const date = formatDate(post.timestamp);
  // Proporción del escenario: la real del primer elemento (Behold conserva la
  // del original, p. ej. 3:4). Fija por post para que el diálogo no salte
  // entre diapositivas; las demás van en `contain` sobre su color dominante.
  const aspect = post.aspectRatio;
  // Alto del escenario en md+: el ancho del diálogo = alto × proporción, y el
  // último término evita que desborde la pantalla con el panel de texto.
  const stageHeight = `min(${STAGE_MAX_PX}px, 85vh, calc((100vw - ${STAGE_RESERVED_PX}px) / ${aspect}))`;
  const canSwipe = total > 1 && current.type === "image";
  const slideLabel =
    total > 1
      ? `${kind} de ${accountLabel}, elemento ${index + 1} de ${total}`
      : `${kind} de ${accountLabel}`;

  const stageStyle = {
    aspectRatio: aspect,
    ...(current.placeholder ? { backgroundColor: current.placeholder } : {}),
  } as CSSProperties;

  return (
    <Dialog
      open
      onOpenChange={(next) => {
        if (!next) onClose();
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
        onKeyDown={(e) => {
          if (total < 2) return;
          // No robar las flechas al reproductor de video.
          if ((e.target as HTMLElement).tagName === "VIDEO") return;
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
        // Pantalla completa bajo `md` por CSS (sin salto de hidratación); desde
        // `md` el ancho sale del escenario (alto × proporción) + panel de 360.
        className="top-0 left-0 flex h-dvh max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none bg-card p-0 sm:max-w-none md:top-1/2 md:left-1/2 md:h-(--stage-h) md:w-max md:max-w-[calc(100%-4rem)] md:-translate-x-1/2 md:-translate-y-1/2 md:flex-row md:rounded-xl"
        style={{ "--stage-h": stageHeight } as CSSProperties}
      >
        {/* Escenario del medio */}
        <div
          ref={setStageEl}
          style={stageStyle}
          // En móvil el alto sale de la proporción, con tope para que el panel
          // de texto siga a la vista. En md+ la altura es explícita (no 100%)
          // para que el ancho intrínseco del diálogo salga del aspect-ratio.
          className={cn(
            "relative w-full shrink-0 overflow-hidden transition-colors duration-300 ease-in-out max-md:max-h-[60dvh] md:h-(--stage-h) md:w-auto",
            !current.placeholder && "bg-primary-900",
          )}
        >
          <AnimatePresence initial={false} custom={direction}>
            <motion.div
              key={current.id}
              custom={direction}
              variants={{
                enter: (d: number) =>
                  reduceMotion
                    ? { opacity: 0 }
                    : { x: d >= 0 ? "100%" : "-100%" },
                center: { x: 0, opacity: 1 },
                exit: (d: number) =>
                  reduceMotion
                    ? { opacity: 0 }
                    : { x: d >= 0 ? "-100%" : "100%" },
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
              drag={canSwipe ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.25}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_PX) go(1);
                else if (info.offset.x > SWIPE_PX) go(-1);
              }}
              style={{
                position: "absolute",
                inset: 0,
                touchAction: canSwipe ? "pan-y" : "auto",
                cursor: canSwipe ? "grab" : "auto",
              }}
            >
              <MediaSlide
                media={current}
                permalink={post.permalink}
                label={slideLabel}
                stageAspect={aspect}
              />
            </motion.div>
          </AnimatePresence>

          {total > 1 && (
            <>
              {index > 0 && (
                <Button
                  variant="plain"
                  size="icon"
                  onClick={() => go(-1)}
                  aria-label="Anterior"
                  className={navButtonClass("left-2")}
                >
                  <ChevronLeft aria-hidden className="size-6" />
                </Button>
              )}
              {index < total - 1 && (
                <Button
                  variant="plain"
                  size="icon"
                  onClick={() => go(1)}
                  aria-label="Siguiente"
                  className={navButtonClass("right-2")}
                >
                  <ChevronRight aria-hidden className="size-6" />
                </Button>
              )}
              <div
                aria-live="polite"
                className="absolute top-3 left-3 z-1 rounded-pill bg-primary-900/70 px-1.25 py-px font-semibold text-12 text-gray-50"
              >
                {index + 1} / {total}
              </div>
            </>
          )}
        </div>

        {/* Panel de texto */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col md:w-90 md:flex-none">
          <div className="flex items-center gap-1.5 border-border border-b p-2">
            <Avatar className="size-9">
              <AvatarImage src={profile?.profilePictureUrl} alt="" />
              <AvatarFallback className="bg-gray-400">
                <InstagramIcon className="size-5" />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <DialogTitle
                id="ig-post-title"
                className="truncate font-body font-semibold text-14 leading-snug"
              >
                {accountLabel}
              </DialogTitle>
              <p className="truncate text-12 text-muted-foreground">
                {handle}
                {date && ` · ${date}`}
              </p>
            </div>
            <DialogClose asChild>
              <Button
                variant="plain"
                size="icon"
                aria-label="Cerrar"
                className="mr-0.5 size-11"
              >
                <X aria-hidden className="size-6" />
              </Button>
            </DialogClose>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {post.caption ? (
              <p className="wrap-anywhere whitespace-pre-line text-14 leading-body">
                {post.caption}
              </p>
            ) : (
              <p className="text-14 text-muted-foreground">
                Publicación sin texto.
              </p>
            )}
            {post.hashtags.length > 0 && (
              <ul
                aria-label="Hashtags"
                className="m-0 mt-2 flex list-none flex-wrap gap-1 p-0"
              >
                {post.hashtags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-14"
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-border border-t p-2">
            {(post.likeCount !== undefined ||
              post.commentsCount !== undefined) && (
              <div className="mb-1.5 flex gap-2.5 text-muted-foreground">
                {post.likeCount !== undefined && (
                  <div className="flex items-center gap-0.75">
                    <Heart aria-hidden className="size-5" />
                    <span className="text-14">
                      {formatCount(post.likeCount)} me gusta
                    </span>
                  </div>
                )}
                {post.commentsCount !== undefined && (
                  <div className="flex items-center gap-0.75">
                    <MessageCircle aria-hidden className="size-5" />
                    <span className="text-14">
                      {formatCount(post.commentsCount)}{" "}
                      {post.commentsCount === 1 ? "comentario" : "comentarios"}
                    </span>
                  </div>
                )}
              </div>
            )}
            <Button asChild variant="action" className="w-full">
              <a
                href={post.permalink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Dar like o comentar en Instagram (pestaña nueva)"
              >
                Dar like o comentar
                <ExternalLink aria-hidden className="size-5" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** Flecha del carrusel: botón redondo navy translúcido sobre el medio. */
function navButtonClass(side: "left-2" | "right-2") {
  return cn(
    "absolute top-1/2 z-1 -translate-y-1/2 bg-primary-900/60 text-gray-50 hover:bg-primary-900/85 dark:bg-primary-900/60 dark:text-gray-50 dark:hover:bg-primary-900/85",
    side,
  );
}
