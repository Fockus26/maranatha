/**
 * Últimas publicaciones de Instagram vía Behold.so (https://behold.so).
 *
 * Behold conecta la cuenta por vos (OAuth de una sola vez en su sitio, sin
 * el proceso de app review de Meta) y expone un feed JSON público. Plan
 * gratis: 1 feed, hasta 6 posts. Incluye reels (`mediaType: "VIDEO"` +
 * `isReel: true`).
 *
 * Config: una env var con el ID de feed por cuenta —
 *   BEHOLD_FEED_MARANATHA, BEHOLD_FEED_EVANGELIO, BEHOLD_FEED_JEF
 * La cuenta sin feed configurado cae a las celdas que enlazan al perfil.
 */

export interface InstagramPost {
  id: string;
  permalink: string;
  thumbnail: string;
  caption: string;
  isVideo: boolean;
  isReel: boolean;
}

export const BEHOLD_FEED_IDS: Record<string, string | undefined> = {
  maranatha: process.env.BEHOLD_FEED_MARANATHA,
  evangelio: process.env.BEHOLD_FEED_EVANGELIO,
  "generacion-jef": process.env.BEHOLD_FEED_JEF,
};

interface BeholdSize {
  mediaUrl: string;
  width: number;
  height: number;
}
interface BeholdPost {
  id: string;
  permalink: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  isReel?: boolean;
  mediaUrl: string;
  thumbnailUrl?: string;
  prunedCaption?: string;
  caption?: string;
  sizes?: { small?: BeholdSize; medium?: BeholdSize };
}

function normalize(p: BeholdPost): InstagramPost {
  const isVideo = p.mediaType === "VIDEO";
  const thumbnail =
    p.sizes?.small?.mediaUrl ??
    p.sizes?.medium?.mediaUrl ??
    (isVideo ? p.thumbnailUrl : p.mediaUrl) ??
    p.mediaUrl;
  return {
    id: p.id,
    permalink: p.permalink,
    thumbnail,
    caption: (p.prunedCaption ?? p.caption ?? "").trim(),
    isVideo,
    isReel: Boolean(p.isReel),
  };
}

export async function getInstagramPosts(
  feedId: string | undefined,
  limit = 4,
): Promise<InstagramPost[]> {
  if (!feedId) return [];
  try {
    const res = await fetch(`https://feeds.behold.so/${feedId}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { posts?: BeholdPost[] };
    return (data.posts ?? []).slice(0, limit).map(normalize);
  } catch {
    return [];
  }
}

/** Trae los posts de las 3 cuentas en paralelo. */
export async function getAllInstagramPosts(
  limit = 4,
): Promise<Record<string, InstagramPost[]>> {
  const entries = await Promise.all(
    Object.entries(BEHOLD_FEED_IDS).map(
      async ([key, feedId]) =>
        [key, await getInstagramPosts(feedId, limit)] as const,
    ),
  );
  return Object.fromEntries(entries);
}
