import { YOUTUBE_CHANNEL_ID } from "./siteConfig";

export interface SermonVideo {
  videoId: string;
  title: string;
  publishedAt: string; // ya formateada, ej. "18 de agosto de 2026"
  publishedIso: string; // ISO 8601, para JSON-LD
}

const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
const DATE_FMT = new Intl.DateTimeFormat("es-VE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function decode(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Últimos videos del canal de YouTube de la iglesia, desde el feed RSS
 * público (sin API key). Se revalida cada hora. Si el feed falla, devuelve
 * `[]` y `Sermons` cae a su contenido de reserva.
 */
export async function getLatestSermons(limit = 3): Promise<SermonVideo[]> {
  try {
    const res = await fetch(FEED_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const xml = await res.text();

    const entries = xml.split("<entry>").slice(1, limit + 1);
    return entries.flatMap((entry) => {
      const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
      const title = entry.match(/<title>([\s\S]*?)<\/title>/)?.[1];
      const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
      if (!videoId || !title || !published) return [];
      return [
        {
          videoId,
          title: decode(title.trim()),
          publishedAt: DATE_FMT.format(new Date(published)),
          publishedIso: new Date(published).toISOString(),
        },
      ];
    });
  } catch {
    return [];
  }
}
