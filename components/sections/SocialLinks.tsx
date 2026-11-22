"use client";

import { AnimatePresence, motion } from "framer-motion";
import { CirclePlay, Heart, Images, MessageCircle } from "lucide-react";
import { type CSSProperties, useState } from "react";
import { InstagramIcon } from "@/components/ui/brand-icons";
import { Container } from "@/components/ui/container";
import {
  formatCount,
  InstagramPostDialog,
} from "@/components/ui/InstagramPostDialog";
import { Reveal } from "@/components/ui/Reveal";
import { SocialLinkCard } from "@/components/ui/SocialLinkCard";
import type { InstagramFeed, InstagramPost } from "@/lib/instagram";
import { cn } from "@/lib/utils";
import { gray, primary, secondary } from "@/theme/tokens";

/**
 * Sección "Redes Sociales" (fase 06) — componente + datos en un solo
 * archivo (D030). Heading — mismo patrón izquierda/centrado que las
 * secciones anteriores (D032).
 *
 * Revisión (D035): la organización tiene 3 cuentas de Instagram, no una
 * sola. Se agrega un selector de cuenta.
 *
 * Revisión (D036): el selector deja de ser chips sueltos + card aparte —
 * ahora son tabs que se fusionan visualmente con el `SocialLinkCard`
 * (efecto "pestaña de Chrome": la tab activa comparte fondo y esquinas
 * redondeadas con el panel de abajo, como si el panel saliera de ella).
 * `SocialLinkCard` recibe `bare` (D036) para no duplicar el borde/fondo
 * que ya resuelve el panel. Las portadas de posts pasan de 1:1 a 4:5
 * (más altura, más parecido al grid real de Instagram).
 *
 * Últimas publicaciones: si la cuenta tiene un feed de Behold.so configurado
 * (`postsByAccount`, resuelto en `app/page.tsx` desde `lib/instagram.ts`) se
 * muestran los posts reales — reels incluidos, con badge de video y link al
 * post en Instagram. Sin feed configurado, las celdas son ventanas al perfil.
 *
 * Feed completo de Behold: las portadas usan `srcSet` (400–2000 px) en vez de
 * la versión de 400 px, con el color dominante de fondo mientras cargan. Cada
 * celda abre `InstagramPostDialog` (carrusel completo, reels reproducibles,
 * likes/comentarios y enlace a Instagram para interactuar). El panel de la
 * cuenta muestra la foto de perfil y los seguidores.
 */

/** 2 columnas en móvil, 4 desde md, dentro de `Container lg` (1200 px). */
const COVER_SIZES = "(min-width: 1200px) 280px, (min-width: 900px) 23vw, 50vw";

/**
 * Íconos sueltos sobre la portada: blanco con sombra para leerse sobre cualquier foto.
 * valor único: sombra de texto fuera de la escala `shadow` (solo sobre fotos).
 */
const OVERLAY_ICON = "text-gray-50 drop-shadow-[0_1px_3px_rgb(0_0_0/0.5)]";

const IG = "https://www.instagram.com";

const ACCOUNTS = [
  {
    id: "maranatha",
    label: "Maranatha San Cristóbal",
    handle: "@maranathasancristobal",
    href: `${IG}/maranathasancristobal/`,
    gradients: [
      `radial-gradient(400px 400px at 70% 20%, ${primary[400]} 0%, ${primary[600]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 30% 70%, ${primary[300]} 0%, ${primary[500]} 55%, ${primary[700]} 100%)`,
      `radial-gradient(400px 400px at 70% 70%, ${secondary[300]} 0%, ${secondary[700]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 30% 20%, ${primary[200]} 0%, ${gray[600]} 55%, ${primary[800]} 100%)`,
    ],
  },
  {
    id: "evangelio",
    label: "El Evangelio Cambia",
    handle: "@eectachira.sc",
    href: `${IG}/eectachira.sc/`,
    gradients: [
      `radial-gradient(400px 400px at 70% 20%, ${secondary[400]} 0%, ${secondary[800]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 30% 70%, ${primary[400]} 0%, ${primary[600]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 70% 70%, ${primary[300]} 0%, ${primary[500]} 55%, ${primary[700]} 100%)`,
      `radial-gradient(400px 400px at 30% 20%, ${secondary[300]} 0%, ${secondary[700]} 55%, ${primary[800]} 100%)`,
    ],
  },
  {
    id: "generacion-jef",
    label: "Generación JEF",
    handle: "@generacionjef",
    href: `${IG}/generacionjef/`,
    gradients: [
      `radial-gradient(400px 400px at 70% 20%, ${primary[200]} 0%, ${gray[600]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 30% 70%, ${secondary[400]} 0%, ${secondary[800]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 70% 70%, ${primary[400]} 0%, ${primary[600]} 55%, ${primary[800]} 100%)`,
      `radial-gradient(400px 400px at 30% 20%, ${primary[300]} 0%, ${primary[500]} 55%, ${primary[700]} 100%)`,
    ],
  },
] as const;

export function SocialLinks({
  feedsByAccount,
}: {
  feedsByAccount?: Record<string, InstagramFeed>;
}) {
  const [activeId, setActiveId] = useState<(typeof ACCOUNTS)[number]["id"]>(
    ACCOUNTS[0].id,
  );
  const active = ACCOUNTS.find((a) => a.id === activeId) ?? ACCOUNTS[0];
  const feed = feedsByAccount?.[active.id];
  const posts = feed?.posts ?? [];
  const profile = feed?.profile ?? null;
  const [openPost, setOpenPost] = useState<InstagramPost | null>(null);

  return (
    <section id="redes" className="py-8 md:py-12">
      <Container maxWidth="lg">
        <Reveal>
          <div className="mx-auto mb-5 max-w-160 text-center md:mx-0 md:mb-6 md:text-left">
            <span className="mb-1.5 block font-body font-medium text-11 text-secondary uppercase tracking-eyebrow-lg wide:text-13">
              Redes sociales
            </span>

            <h2 className="mb-2 font-bold font-heading text-28 text-foreground leading-h3 tracking-tight md:text-38 wide:text-46">
              Síguenos en cada cuenta
            </h2>

            <p className="font-body text-16 text-muted-foreground leading-body wide:text-19">
              Elige una cuenta para ver sus últimas publicaciones y seguirla
              desde ahí.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.12}>
          <div className="mx-auto mb-4 max-w-120 overflow-hidden rounded-xl border border-border md:mx-0 md:mb-5">
            <div className="flex bg-gray-100 dark:bg-white/4">
              {ACCOUNTS.map((account) => {
                const isActive = account.id === activeId;
                return (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => setActiveId(account.id)}
                    // Cuenta elegida expuesta a lectores de pantalla y a alto
                    // contraste (design-qa fase 09: solo se veía por color).
                    aria-pressed={isActive}
                    className={cn(
                      "flex min-h-11 min-w-0 basis-0 cursor-pointer items-center justify-center gap-0.6 px-0.75 py-1.4 font-body text-12 transition-[flex-grow,background-color,color] duration-300 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
                      isActive
                        ? // valor único: la pestaña activa crece 1.3 y redondea 14 px arriba
                          "grow-[1.3] rounded-t-[14px] bg-card font-semibold text-foreground"
                        : "grow bg-transparent font-medium text-muted-foreground",
                    )}
                  >
                    <InstagramIcon className="size-3.75 shrink-0" />
                    <span className="truncate">{account.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="bg-card p-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.18 }}
                >
                  <SocialLinkCard
                    bare
                    platform={active.label}
                    handle={active.handle}
                    href={active.href}
                    icon={InstagramIcon}
                    ctaLabel="Seguir"
                    avatarUrl={profile?.profilePictureUrl}
                    meta={
                      profile?.followersCount !== undefined
                        ? `${formatCount(profile.followersCount)} seguidores`
                        : undefined
                    }
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              className="grid grid-cols-2 gap-4 md:grid-cols-4"
            >
              {posts.length > 0
                ? posts.map((post) => {
                    const kind = post.isReel
                      ? "Reel"
                      : post.isVideo
                        ? "Video"
                        : post.isCarousel
                          ? `Álbum de ${post.media.length} elementos`
                          : "Publicación";
                    const hasStats =
                      post.likeCount !== undefined ||
                      post.commentsCount !== undefined;
                    return (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => setOpenPost(post)}
                        aria-haspopup="dialog"
                        aria-label={
                          post.caption
                            ? `${kind} de Instagram: ${post.caption.slice(0, 80)}`
                            : `${kind} de Instagram de ${active.label}`
                        }
                        style={
                          post.placeholder
                            ? ({
                                backgroundColor: post.placeholder,
                              } as CSSProperties)
                            : undefined
                        }
                        className={cn(
                          "group relative block aspect-4/5 w-full cursor-pointer overflow-hidden rounded-md border border-border transition-[border-color] duration-200 hover:border-secondary focus-visible:border-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          !post.placeholder && "bg-accent",
                        )}
                      >
                        {/* biome-ignore lint/performance/noImgElement: portada con `srcSet` remoto del CDN de Instagram (Behold) */}
                        <img
                          src={post.cover.src}
                          srcSet={post.cover.srcSet || undefined}
                          sizes={post.cover.srcSet ? COVER_SIZES : undefined}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          className="absolute inset-0 size-full object-cover"
                        />
                        {post.isVideo && (
                          <CirclePlay
                            aria-hidden
                            className={cn(
                              OVERLAY_ICON,
                              "absolute top-2 right-2 size-5",
                            )}
                          />
                        )}
                        {post.isCarousel && (
                          <Images
                            aria-hidden
                            className={cn(
                              OVERLAY_ICON,
                              "absolute top-2 right-2 size-4.5",
                            )}
                          />
                        )}
                        <div
                          aria-hidden
                          className={cn(
                            "absolute inset-x-0 bottom-0 flex items-center gap-1.5 bg-linear-to-t from-primary-900/75 to-transparent px-1.25 pt-3 pb-1 font-semibold text-13 text-gray-50 transition-opacity duration-200",
                            // Con contadores: visibles al pasar el cursor o enfocar
                            // (siempre en móvil y en pantallas sin hover).
                            hasStats
                              ? "opacity-100 group-focus-visible:opacity-100 group-hover:opacity-100 md:opacity-0 [@media(hover:none)]:opacity-100"
                              : "opacity-100",
                          )}
                        >
                          {post.likeCount !== undefined && (
                            <span className="flex items-center gap-0.5">
                              <Heart className="size-4 fill-current" />
                              {formatCount(post.likeCount)}
                            </span>
                          )}
                          {post.commentsCount !== undefined && (
                            <span className="flex items-center gap-0.5">
                              <MessageCircle className="size-3.75 fill-current" />
                              {formatCount(post.commentsCount)}
                            </span>
                          )}
                          <InstagramIcon
                            className={cn(OVERLAY_ICON, "ml-auto size-4")}
                          />
                        </div>
                      </button>
                    );
                  })
                : active.gradients.map((gradient, i) => (
                    <a
                      key={`${active.id}-${i}`}
                      href={active.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir el perfil de Instagram de ${active.label} (pestaña nueva)`}
                      className="relative block aspect-4/5 overflow-hidden rounded-md border border-border transition-[border-color] duration-200 hover:border-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                    >
                      <div
                        aria-hidden
                        className="absolute inset-0"
                        style={{ background: gradient }}
                      />
                      <InstagramIcon className="absolute right-2 bottom-2 size-4 text-gray-50/85" />
                    </a>
                  ))}
            </motion.div>
          </AnimatePresence>
        </Reveal>
      </Container>

      <InstagramPostDialog
        post={openPost}
        accountLabel={active.label}
        handle={active.handle}
        profile={profile}
        onClose={() => setOpenPost(null)}
      />
    </section>
  );
}
