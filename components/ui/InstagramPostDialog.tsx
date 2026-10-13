"use client";

import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import { alpha, useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useState } from "react";
import type {
  InstagramMedia,
  InstagramPost,
  InstagramProfile,
} from "@/lib/instagram";
import { gray, primary, radius } from "@/theme/tokens";

/**
 * Visor de una publicación de Instagram (feed de Behold, ver
 * `lib/instagram.ts`). Se abre desde la grilla de `SocialLinks`.
 *
 * - Carruseles: todas las fotos/videos del álbum, con flechas, contador y
 *   flechas del teclado.
 * - Reels y videos: se reproducen aquí con los controles nativos (sin
 *   autoplay). Si el `.mp4` del CDN de Instagram ya caducó, se ofrece abrir
 *   el post en Instagram.
 * - Likes y comentarios: solo los contadores. Behold es de solo lectura, así
 *   que dar like o comentar se hace en Instagram (botón al pie).
 */

const IMAGE_SIZES = "(min-width: 900px) 560px, 100vw";

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
}: {
  media: InstagramMedia;
  permalink: string;
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  if (media.type === "video" && media.videoUrl && !failed) {
    return (
      // Los videos de Instagram no traen subtítulos; el texto del post va al lado.
      <Box
        component="video"
        key={media.id}
        src={media.videoUrl}
        poster={media.image.src}
        controls
        playsInline
        preload="metadata"
        aria-label={label}
        onError={() => setFailed(true)}
        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
    );
  }

  return (
    <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
      <Box
        component="img"
        key={media.id}
        src={media.image.src}
        srcSet={media.image.srcSet || undefined}
        sizes={media.image.srcSet ? IMAGE_SIZES : undefined}
        alt={label}
        sx={{ width: "100%", height: "100%", objectFit: "contain" }}
      />
      {failed && (
        <Box
          sx={{
            position: "absolute",
            insetInline: 0,
            bottom: 0,
            p: 2,
            textAlign: "center",
            backgroundColor: "rgba(6, 10, 29, 0.8)",
            color: gray[50],
          }}
        >
          <Typography sx={{ fontSize: 14, mb: 1 }}>
            Este video ya no se puede reproducir aquí.
          </Typography>
          <Link
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: "secondary.light", fontWeight: 600, fontSize: 14 }}
          >
            Verlo en Instagram (pestaña nueva)
          </Link>
        </Box>
      )}
    </Box>
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
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [index, setIndex] = useState(0);
  const [prevPostId, setPrevPostId] = useState(post?.id);

  // Al abrir otro post, vuelve a la primera diapositiva.
  if (post?.id !== prevPostId) {
    setPrevPostId(post?.id);
    setIndex(0);
  }

  if (!post) return <Dialog open={false} onClose={onClose} />;

  const total = post.media.length;
  const current = post.media[Math.min(index, total - 1)];
  const kind = post.isReel ? "Reel" : post.isVideo ? "Video" : "Publicación";
  const date = formatDate(post.timestamp);
  const go = (delta: number) =>
    setIndex((i) => Math.max(0, Math.min(total - 1, i + delta)));
  const slideLabel =
    total > 1
      ? `${kind} de ${accountLabel}, elemento ${index + 1} de ${total}`
      : `${kind} de ${accountLabel}`;

  return (
    <Dialog
      open
      onClose={onClose}
      fullScreen={fullScreen}
      maxWidth="lg"
      aria-labelledby="ig-post-title"
      onKeyDown={(e) => {
        if (total < 2) return;
        // No robar las flechas al reproductor de video.
        if ((e.target as HTMLElement).tagName === "VIDEO") return;
        if (e.key === "ArrowLeft") go(-1);
        if (e.key === "ArrowRight") go(1);
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: fullScreen ? 0 : `${radius.xl}px`,
            overflow: "hidden",
            backgroundImage: "none",
          },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          height: { md: "min(640px, 85vh)" },
          minHeight: { xs: "100%", md: "auto" },
        }}
      >
        {/* Escenario del medio */}
        <Box
          sx={{
            position: "relative",
            flexShrink: 0,
            width: { xs: "100%", md: "min(560px, 55vw)" },
            height: { xs: "min(100vw, 60vh)", md: "100%" },
            backgroundColor: current.placeholder ?? primary[900],
            transition: "background-color 0.3s ease",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              backgroundColor: primary[900],
            }}
          >
            <MediaSlide
              key={current.id}
              media={current}
              permalink={post.permalink}
              label={slideLabel}
            />
          </Box>

          {total > 1 && (
            <>
              {index > 0 && (
                <IconButton
                  onClick={() => go(-1)}
                  aria-label="Anterior"
                  sx={navButtonSx("left")}
                >
                  <ChevronLeftRoundedIcon />
                </IconButton>
              )}
              {index < total - 1 && (
                <IconButton
                  onClick={() => go(1)}
                  aria-label="Siguiente"
                  sx={navButtonSx("right")}
                >
                  <ChevronRightRoundedIcon />
                </IconButton>
              )}
              <Box
                aria-live="polite"
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  px: 1.25,
                  py: 0.25,
                  borderRadius: "999px",
                  backgroundColor: "rgba(6, 10, 29, 0.7)",
                  color: gray[50],
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                {index + 1} / {total}
              </Box>
            </>
          )}
        </Box>

        {/* Panel de texto */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            minWidth: 0,
            width: { md: 360 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Avatar
              src={profile?.profilePictureUrl}
              alt=""
              sx={{ width: 36, height: 36 }}
            >
              <InstagramIcon fontSize="small" />
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                id="ig-post-title"
                component="h2"
                sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.3 }}
                noWrap
              >
                {accountLabel}
              </Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }} noWrap>
                {handle}
                {date && ` · ${date}`}
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Cerrar" edge="end">
              <CloseRoundedIcon />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {post.caption ? (
              <Typography
                sx={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  whiteSpace: "pre-line",
                  overflowWrap: "anywhere",
                }}
              >
                {post.caption}
              </Typography>
            ) : (
              <Typography sx={{ fontSize: 14, color: "text.secondary" }}>
                Publicación sin texto.
              </Typography>
            )}
            {post.hashtags.length > 0 && (
              <Box
                component="ul"
                aria-label="Hashtags"
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  listStyle: "none",
                  p: 0,
                  m: 0,
                  mt: 2,
                }}
              >
                {post.hashtags.map((tag) => (
                  <li key={tag}>
                    <Link
                      href={`https://www.instagram.com/explore/tags/${encodeURIComponent(tag)}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        fontSize: 14,
                        fontWeight: 500,
                        // primary.main oscuro no llega a 4.5:1 sobre el paper oscuro.
                        color: (t) =>
                          t.palette.mode === "light"
                            ? "primary.main"
                            : "primary.light",
                      }}
                    >
                      #{tag}
                    </Link>
                  </li>
                ))}
              </Box>
            )}
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: "1px solid",
              borderColor: "divider",
            }}
          >
            {(post.likeCount !== undefined ||
              post.commentsCount !== undefined) && (
              <Box
                sx={{
                  display: "flex",
                  gap: 2.5,
                  mb: 1.5,
                  color: "text.secondary",
                }}
              >
                {post.likeCount !== undefined && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <FavoriteBorderRoundedIcon
                      sx={{ fontSize: 20 }}
                      aria-hidden
                    />
                    <Typography sx={{ fontSize: 14 }}>
                      {formatCount(post.likeCount)} me gusta
                    </Typography>
                  </Box>
                )}
                {post.commentsCount !== undefined && (
                  <Box
                    sx={{ display: "flex", alignItems: "center", gap: 0.75 }}
                  >
                    <ChatBubbleOutlineRoundedIcon
                      sx={{ fontSize: 20 }}
                      aria-hidden
                    />
                    <Typography sx={{ fontSize: 14 }}>
                      {formatCount(post.commentsCount)}{" "}
                      {post.commentsCount === 1 ? "comentario" : "comentarios"}
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            <Button
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              fullWidth
              startIcon={<InstagramIcon />}
              sx={{
                textTransform: "none",
                fontWeight: 600,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  color: "primary.main",
                  backgroundColor: (t) => alpha(t.palette.primary.main, 0.08),
                },
              }}
            >
              Dar like o comentar en Instagram
            </Button>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}

function navButtonSx(side: "left" | "right") {
  return {
    position: "absolute",
    top: "50%",
    [side]: 8,
    transform: "translateY(-50%)",
    backgroundColor: "rgba(6, 10, 29, 0.6)",
    color: gray[50],
    "&:hover": { backgroundColor: "rgba(6, 10, 29, 0.85)" },
  } as const;
}
