"use client";

import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CollectionsRoundedIcon from "@mui/icons-material/CollectionsRounded";
import FavoriteRoundedIcon from "@mui/icons-material/FavoriteRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Container from "@mui/material/Container";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import {
  formatCount,
  InstagramPostDialog,
} from "@/components/ui/InstagramPostDialog";
import { Reveal } from "@/components/ui/Reveal";
import { SocialLinkCard } from "@/components/ui/SocialLinkCard";
import type { InstagramFeed, InstagramPost } from "@/lib/instagram";
import { gray } from "@/theme/tokens";

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

const overlayIconSx = {
  color: gray[50],
  filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.5))",
} as const;

const IG = "https://www.instagram.com";

const ACCOUNTS = [
  {
    id: "maranatha",
    label: "Maranatha San Cristóbal",
    handle: "@maranathasancristobal",
    href: `${IG}/maranathasancristobal/`,
    gradients: [
      "radial-gradient(400px 400px at 70% 20%, #5B6B9E 0%, #1E2B5C 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 30% 70%, #8894C2 0%, #37447A 55%, #101B45 100%)",
      "radial-gradient(400px 400px at 70% 70%, #FCA355 0%, #B34C02 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 30% 20%, #AFB7D6 0%, #434A63 55%, #0B1433 100%)",
    ],
  },
  {
    id: "evangelio",
    label: "El Evangelio Cambia",
    handle: "@eectachira.sc",
    href: `${IG}/eectachira.sc/`,
    gradients: [
      "radial-gradient(400px 400px at 70% 20%, #FA8A2E 0%, #8A3B03 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 30% 70%, #5B6B9E 0%, #1E2B5C 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 70% 70%, #8894C2 0%, #37447A 55%, #101B45 100%)",
      "radial-gradient(400px 400px at 30% 20%, #FCA355 0%, #B34C02 55%, #0B1433 100%)",
    ],
  },
  {
    id: "generacion-jef",
    label: "Generación JEF",
    handle: "@generacionjef",
    href: `${IG}/generacionjef/`,
    gradients: [
      "radial-gradient(400px 400px at 70% 20%, #AFB7D6 0%, #434A63 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 30% 70%, #FA8A2E 0%, #8A3B03 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 70% 70%, #5B6B9E 0%, #1E2B5C 55%, #0B1433 100%)",
      "radial-gradient(400px 400px at 30% 20%, #8894C2 0%, #37447A 55%, #101B45 100%)",
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
    <Box component="section" id="redes" sx={{ py: { xs: 8, md: 12 } }}>
      <Container maxWidth="lg">
        <Reveal>
          <Box
            sx={{
              maxWidth: 640,
              mx: { xs: "auto", md: 0 },
              textAlign: { xs: "center", md: "left" },
              mb: { xs: 5, md: 6 },
            }}
          >
            <Typography
              component="span"
              sx={{
                display: "block",
                fontFamily: "var(--font-body)",
                fontWeight: 500,
                fontSize: 11,
                "@media (min-width:1920px)": { fontSize: "13px" },
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "secondary.main",
                mb: 1.5,
              }}
            >
              Redes sociales
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
              Síguenos en cada cuenta
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
              Elige una cuenta para ver sus últimas publicaciones y seguirla
              desde ahí.
            </Typography>
          </Box>
        </Reveal>

        <Reveal delay={0.12}>
          <Box
            sx={{
              mb: { xs: 4, md: 5 },
              maxWidth: 480,
              mx: { xs: "auto", md: 0 },
              borderRadius: "16px",
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                backgroundColor: (t) =>
                  t.palette.mode === "light"
                    ? t.palette.grey[100]
                    : alpha(t.palette.common.white, 0.04),
              }}
            >
              {ACCOUNTS.map((account) => {
                const isActive = account.id === activeId;
                return (
                  <ButtonBase
                    key={account.id}
                    onClick={() => setActiveId(account.id)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.6,
                      flexGrow: isActive ? 1.3 : 1,
                      flexBasis: 0,
                      minWidth: 0,
                      py: 1.4,
                      px: 0.75,
                      backgroundColor: isActive
                        ? "background.paper"
                        : "transparent",
                      color: isActive ? "text.primary" : "text.secondary",
                      fontFamily: "var(--font-body)",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: "12px",
                      borderTopLeftRadius: isActive ? "14px" : 0,
                      borderTopRightRadius: isActive ? "14px" : 0,
                      transition:
                        "flex-grow 0.3s ease, background-color 0.3s ease, color 0.2s ease",
                    }}
                  >
                    <InstagramIcon sx={{ fontSize: 15, flexShrink: 0 }} />
                    <Box
                      component="span"
                      sx={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {account.label}
                    </Box>
                  </ButtonBase>
                );
              })}
            </Box>

            <Box sx={{ backgroundColor: "background.paper", p: 2 }}>
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
            </Box>
          </Box>

          <AnimatePresence mode="wait">
            <Box
              key={active.id}
              component={motion.div}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18 }}
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "repeat(2, 1fr)",
                  md: "repeat(4, 1fr)",
                },
                gap: "16px",
              }}
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
                      <ButtonBase
                        key={post.id}
                        onClick={() => setOpenPost(post)}
                        aria-haspopup="dialog"
                        aria-label={
                          post.caption
                            ? `${kind} de Instagram: ${post.caption.slice(0, 80)}`
                            : `${kind} de Instagram de ${active.label}`
                        }
                        sx={{
                          position: "relative",
                          display: "block",
                          width: "100%",
                          aspectRatio: "4 / 5",
                          borderRadius: "10px",
                          overflow: "hidden",
                          border: "1px solid",
                          borderColor: "divider",
                          backgroundColor: post.placeholder ?? "action.hover",
                          transition: "border-color 0.2s ease",
                          "&:hover, &.Mui-focusVisible": {
                            borderColor: "secondary.main",
                          },
                          "&.Mui-focusVisible": {
                            outline: "2px solid",
                            outlineColor: "secondary.main",
                            outlineOffset: "2px",
                          },
                          "&:hover .ig-stats, &.Mui-focusVisible .ig-stats": {
                            opacity: 1,
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={post.cover.src}
                          srcSet={post.cover.srcSet || undefined}
                          sizes={post.cover.srcSet ? COVER_SIZES : undefined}
                          alt=""
                          loading="lazy"
                          decoding="async"
                          sx={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                        {post.isVideo && (
                          <PlayCircleRoundedIcon
                            sx={{
                              ...overlayIconSx,
                              position: "absolute",
                              top: 8,
                              right: 8,
                              fontSize: 20,
                            }}
                          />
                        )}
                        {post.isCarousel && (
                          <CollectionsRoundedIcon
                            sx={{
                              ...overlayIconSx,
                              position: "absolute",
                              top: 8,
                              right: 8,
                              fontSize: 18,
                            }}
                          />
                        )}
                        <Box
                          className="ig-stats"
                          aria-hidden
                          sx={{
                            position: "absolute",
                            insetInline: 0,
                            bottom: 0,
                            display: "flex",
                            alignItems: "center",
                            gap: 1.5,
                            px: 1.25,
                            pt: 3,
                            pb: 1,
                            color: gray[50],
                            fontSize: 13,
                            fontWeight: 600,
                            background:
                              "linear-gradient(to top, rgba(6,10,29,0.75), transparent)",
                            opacity: hasStats ? { xs: 1, md: 0 } : 1,
                            transition: "opacity 0.2s ease",
                            "@media (hover: none)": { opacity: 1 },
                          }}
                        >
                          {post.likeCount !== undefined && (
                            <Box
                              component="span"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <FavoriteRoundedIcon sx={{ fontSize: 16 }} />
                              {formatCount(post.likeCount)}
                            </Box>
                          )}
                          {post.commentsCount !== undefined && (
                            <Box
                              component="span"
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 0.5,
                              }}
                            >
                              <ChatBubbleRoundedIcon sx={{ fontSize: 15 }} />
                              {formatCount(post.commentsCount)}
                            </Box>
                          )}
                          <InstagramIcon
                            sx={{ ...overlayIconSx, fontSize: 16, ml: "auto" }}
                          />
                        </Box>
                      </ButtonBase>
                    );
                  })
                : active.gradients.map((gradient, i) => (
                    <Box
                      key={`${active.id}-${i}`}
                      component="a"
                      href={active.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Abrir el perfil de Instagram de ${active.label} (pestaña nueva)`}
                      sx={{
                        position: "relative",
                        display: "block",
                        aspectRatio: "4 / 5",
                        borderRadius: "10px",
                        overflow: "hidden",
                        border: "1px solid",
                        borderColor: "divider",
                        transition: "border-color 0.2s ease",
                        "&:hover": { borderColor: "secondary.main" },
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          inset: 0,
                          background: gradient,
                        }}
                      />
                      <InstagramIcon
                        sx={{
                          position: "absolute",
                          bottom: 8,
                          right: 8,
                          fontSize: 16,
                          color: "rgba(245,246,250,0.85)",
                        }}
                      />
                    </Box>
                  ))}
            </Box>
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
    </Box>
  );
}
