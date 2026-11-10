/**
 * Últimas publicaciones de Instagram vía Behold.so (https://behold.so).
 *
 * Behold conecta la cuenta por vos (OAuth de una sola vez en su sitio, sin
 * el proceso de app review de Meta) y expone un feed JSON público, de solo
 * lectura: no permite dar like ni comentar (eso solo desde Instagram).
 *
 * Qué se aprovecha del feed:
 * - `sizes` (small/medium/large/full, URLs estables de Behold; escalan por
 *   alto y conservan la proporción del original, p. ej. 302x400 … 1511x2000)
 *   → `srcSet` para que el navegador elija la resolución según la pantalla, y
 *   la proporción real del medio (`aspectRatio`) para el visor.
 * - `children` de los carruseles → todas las fotos/videos del álbum.
 * - `mediaUrl` de los videos (reels) → se reproducen dentro del sitio. Son
 *   URLs del CDN de Instagram que caducan a los pocos días; la revalidación
 *   horaria del fetch las mantiene frescas, y el visor cae al permalink si
 *   una falla.
 * - `likeCount`, `commentsCount`, `timestamp`, `hashtags` → metadatos del post.
 * - `colorPalette.dominant` → color de fondo mientras carga la imagen.
 * - Perfil: foto, biografía y seguidores.
 *
 * Config: una env var con el ID de feed por cuenta —
 *   BEHOLD_FEED_MARANATHA, BEHOLD_FEED_EVANGELIO, BEHOLD_FEED_JEF
 * La cuenta sin feed configurado cae a las celdas que enlazan al perfil.
 */

export interface InstagramImageSource {
  src: string;
  /** Vacío si Behold no mandó tamaños: el `<img>` usa solo `src`. */
  srcSet: string;
}

export interface InstagramMedia {
  id: string;
  type: "image" | "video";
  /** Imagen (o póster del video), con sus resoluciones. */
  image: InstagramImageSource;
  /** Solo videos: el `.mp4`. */
  videoUrl?: string;
  /** Color dominante `rgb(...)` para el fondo mientras carga. */
  placeholder?: string;
  /** Ancho / alto del medio, acotada a `[MIN_ASPECT, MAX_ASPECT]` (D083). */
  aspectRatio: number;
}

export interface InstagramPost {
  id: string;
  permalink: string;
  caption: string;
  hashtags: string[];
  /** ISO 8601. */
  timestamp?: string;
  likeCount?: number;
  commentsCount?: number;
  isVideo: boolean;
  isReel: boolean;
  isCarousel: boolean;
  /** Portada para la grilla. */
  cover: InstagramImageSource;
  placeholder?: string;
  /** Proporción del escenario del visor: la del primer elemento (D083). */
  aspectRatio: number;
  /** Un elemento para foto/video; todos los del álbum para carruseles. */
  media: InstagramMedia[];
}

export interface InstagramProfile {
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
}

export interface InstagramFeed {
  profile: InstagramProfile | null;
  posts: InstagramPost[];
}

export const BEHOLD_FEED_IDS: Record<string, string | undefined> = {
  maranatha: process.env.BEHOLD_FEED_MARANATHA,
  evangelio: process.env.BEHOLD_FEED_EVANGELIO,
  "generacion-jef": process.env.BEHOLD_FEED_JEF,
};

type SizeKey = "small" | "medium" | "large" | "full";
interface BeholdSize {
  mediaUrl: string;
  width: number;
  height: number;
}
type BeholdSizes = Partial<Record<SizeKey, BeholdSize>>;
interface BeholdPalette {
  dominant?: string;
}
interface BeholdChild {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  thumbnailUrl?: string;
  sizes?: BeholdSizes;
  colorPalette?: BeholdPalette;
}
export interface BeholdPost {
  id: string;
  permalink: string;
  timestamp?: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  isReel?: boolean;
  mediaUrl: string;
  thumbnailUrl?: string;
  prunedCaption?: string;
  caption?: string;
  hashtags?: string[];
  likeCount?: number;
  commentsCount?: number;
  colorPalette?: BeholdPalette;
  sizes?: BeholdSizes;
  children?: BeholdChild[];
}
export interface BeholdFeed {
  biography?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  posts?: BeholdPost[];
}

const SIZE_ORDER: SizeKey[] = ["small", "medium", "large", "full"];

/** Límites de proporción (ancho/alto): de 9:16 (reel) a 1.91:1 (Instagram). */
export const MIN_ASPECT = 9 / 16;
export const MAX_ASPECT = 1.91;
/** Sin `sizes`: 4:5 para imagen (formato por defecto de Instagram), 9:16 video. */
export const DEFAULT_IMAGE_ASPECT = 4 / 5;
export const DEFAULT_VIDEO_ASPECT = 9 / 16;

/**
 * Proporción ancho/alto del medio a partir de los tamaños de Behold, acotada
 * para que un dato raro no rompa el layout. Sin tamaños válidos, el valor por
 * defecto del tipo de medio.
 */
export function mediaAspectRatio(
  sizes: BeholdSizes | undefined,
  isVideo: boolean,
): number {
  const fallback = isVideo ? DEFAULT_VIDEO_ASPECT : DEFAULT_IMAGE_ASPECT;
  const s = SIZE_ORDER.map((k) => sizes?.[k]).find(
    (x) => x && x.width > 0 && x.height > 0,
  );
  if (!s) return fallback;
  const ratio = s.width / s.height;
  return Math.min(MAX_ASPECT, Math.max(MIN_ASPECT, ratio));
}

/** `"60,68,56"` → `"rgb(60 68 56)"`; cualquier otra forma → undefined. */
export function paletteToCss(rgb: string | undefined): string | undefined {
  if (!rgb || !/^\d{1,3},\d{1,3},\d{1,3}$/.test(rgb)) return undefined;
  return `rgb(${rgb.split(",").join(" ")})`;
}

/**
 * `src` = la versión `large` (o la mayor disponible) y `srcSet` con todos los
 * anchos. Sin `sizes`, cae a `fallback` (la URL original de Instagram).
 */
export function buildImageSource(
  sizes: BeholdSizes | undefined,
  fallback: string,
): InstagramImageSource {
  const available = SIZE_ORDER.flatMap((k) => {
    const s = sizes?.[k];
    return s ? [s] : [];
  });
  if (available.length === 0) return { src: fallback, srcSet: "" };
  const src = (sizes?.large ?? available[available.length - 1]).mediaUrl;
  const srcSet = available.map((s) => `${s.mediaUrl} ${s.width}w`).join(", ");
  return { src, srcSet };
}

function toMedia(item: BeholdChild): InstagramMedia {
  const isVideo = item.mediaType === "VIDEO";
  return {
    id: item.id,
    type: isVideo ? "video" : "image",
    image: buildImageSource(
      item.sizes,
      (isVideo ? item.thumbnailUrl : item.mediaUrl) ?? item.mediaUrl,
    ),
    videoUrl: isVideo ? item.mediaUrl : undefined,
    placeholder: paletteToCss(item.colorPalette?.dominant),
    aspectRatio: mediaAspectRatio(item.sizes, isVideo),
  };
}

export function normalizePost(p: BeholdPost): InstagramPost {
  const isCarousel = p.mediaType === "CAROUSEL_ALBUM";
  const self = toMedia({
    id: p.id,
    mediaType: p.mediaType === "VIDEO" ? "VIDEO" : "IMAGE",
    mediaUrl: p.mediaUrl,
    thumbnailUrl: p.thumbnailUrl,
    sizes: p.sizes,
    colorPalette: p.colorPalette,
  });
  const media =
    isCarousel && p.children && p.children.length > 0
      ? p.children.map(toMedia)
      : [self];
  return {
    id: p.id,
    permalink: p.permalink,
    caption: (p.prunedCaption ?? p.caption ?? "").trim(),
    hashtags: p.hashtags ?? [],
    timestamp: p.timestamp,
    likeCount: p.likeCount,
    commentsCount: p.commentsCount,
    isVideo: p.mediaType === "VIDEO",
    isReel: Boolean(p.isReel) || p.permalink.includes("/reel/"),
    isCarousel,
    cover: self.image,
    placeholder: self.placeholder,
    aspectRatio: media[0].aspectRatio,
    media,
  };
}

export function normalizeFeed(data: BeholdFeed, limit: number): InstagramFeed {
  return {
    profile: {
      biography: data.biography?.trim() || undefined,
      profilePictureUrl: data.profilePictureUrl,
      followersCount: data.followersCount,
    },
    posts: (data.posts ?? []).slice(0, limit).map(normalizePost),
  };
}

const EMPTY_FEED: InstagramFeed = { profile: null, posts: [] };

export async function getInstagramFeed(
  feedId: string | undefined,
  limit = 4,
): Promise<InstagramFeed> {
  if (!feedId) return EMPTY_FEED;
  try {
    const res = await fetch(`https://feeds.behold.so/${feedId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return EMPTY_FEED;
    return normalizeFeed((await res.json()) as BeholdFeed, limit);
  } catch {
    return EMPTY_FEED;
  }
}

/** Trae los feeds de las 3 cuentas en paralelo. */
export async function getAllInstagramFeeds(
  limit = 4,
): Promise<Record<string, InstagramFeed>> {
  const entries = await Promise.all(
    Object.entries(BEHOLD_FEED_IDS).map(
      async ([key, feedId]) =>
        [key, await getInstagramFeed(feedId, limit)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
