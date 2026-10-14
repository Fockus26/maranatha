import "server-only";
import { ImageResponse } from "next/og";
import type { ReactNode } from "react";
import { brandSvgDataUri } from "@/lib/brand";
import { gray, og, primary, secondary } from "@/theme/tokens";

/**
 * Plantilla de las imágenes Open Graph (D078): fondo navy con el patrón
 * diagonal del sistema, margen de seguridad de 80×64 y el logo leído de
 * `public/brand/` (fuente única). La usan `app/opengraph-image.tsx` y
 * `app/proyectos/[slug]/opengraph-image.tsx`.
 */

export const OG_SIZE = { width: og.width, height: og.height };
export const OG_CONTENT_TYPE = "image/png";

const ON_NAVY_MUTED = primary[200]; // 8.4:1 sobre primary[700]

type Weight = 600 | 700 | 800;

/**
 * Sora desde Google Fonts, recortada al texto que se va a pintar. Las OG se
 * generan en el build; si la red falla, `ImageResponse` usa su fuente por
 * defecto en vez de romper el build.
 */
async function loadSora(weight: Weight, text: string) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Sora:wght@${weight}&text=${encodeURIComponent(text)}`,
    ).then((r) => r.text());
    const url = css.match(
      /src: url\((.+?)\) format\('(opentype|truetype)'\)/,
    )?.[1];
    if (!url) return null;
    const data = await fetch(url).then((r) => r.arrayBuffer());
    return { name: "Sora", data, weight, style: "normal" as const };
  } catch {
    return null;
  }
}

/** Imagen remota como data URI; `null` si no se pudo descargar. */
export async function fetchImageDataUri(url: string) {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${type};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

function Wordmark({
  mark,
  compact = false,
}: {
  mark: string;
  compact?: boolean;
}) {
  // Proporciones de `logo-horizontal.svg` (260×64) y `logo-compact.svg` (200×40).
  const size = compact ? 40 : 64;
  return (
    <div
      style={{ display: "flex", alignItems: "center", gap: compact ? 12 : 16 }}
    >
      {/* biome-ignore lint/performance/noImgElement: ImageResponse (Satori) solo entiende <img>. */}
      <img src={mark} width={size} height={size} alt="" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {!compact && (
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              letterSpacing: 3.2,
              color: secondary[300],
              marginBottom: 4,
            }}
          >
            IGLESIA
          </div>
        )}
        <div
          style={{
            fontSize: compact ? 24 : 31,
            fontWeight: 700,
            letterSpacing: -0.5,
            color: gray[50],
            lineHeight: 1,
          }}
        >
          Maranatha
        </div>
      </div>
    </div>
  );
}

interface OgImageOptions {
  title: string;
  /** Línea bajo el título (solo la OG del sitio). */
  subtitle?: string;
  /** Pie, abajo a la izquierda. */
  footer: string;
  /** Pie, abajo a la derecha. */
  footerRight?: string;
  /** Etiqueta sobre el título (p. ej. "PROYECTO"). */
  eyebrow?: string;
  /** Foto a la derecha (data URI). Sin foto, composición del sitio. */
  photo?: string | null;
}

export async function renderOgImage({
  title,
  subtitle,
  footer,
  footerRight,
  eyebrow,
  photo,
}: OgImageOptions) {
  const mark = await brandSvgDataUri("logo-mark-inverse");
  const withPhoto = Boolean(photo);
  const titleSize = withPhoto || eyebrow ? og.titleProject : og.title;

  const text = [
    title,
    subtitle,
    footer,
    footerRight,
    eyebrow,
    "IGLESIA",
    "Maranatha",
  ]
    .filter(Boolean)
    .join(" ");
  const fonts = (
    await Promise.all([loadSora(700, text), loadSora(800, text)])
  ).filter((f) => f !== null);

  let content: ReactNode = (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: `${og.safeY}px ${withPhoto ? 48 : og.safeX}px ${og.safeY}px ${og.safeX}px`,
      }}
    >
      <Wordmark mark={mark} compact={withPhoto} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {eyebrow && (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 16px",
              borderRadius: 6,
              backgroundColor: secondary[500],
              color: gray[900], // 6.7:1
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 1.6,
            }}
          >
            {eyebrow}
          </div>
        )}
        <div
          style={{
            display: "block",
            lineClamp: 3,
            fontSize: titleSize,
            fontWeight: 800,
            lineHeight: 1.1,
            color: gray[50], // 15.4:1
            maxWidth: 880,
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                width: 96,
                height: 6,
                borderRadius: 3,
                backgroundColor: secondary[500],
              }}
            />
            <div style={{ fontSize: og.subtitle, color: ON_NAVY_MUTED }}>
              {subtitle}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: og.footer,
          color: ON_NAVY_MUTED,
        }}
      >
        <span>{footer}</span>
        {footerRight && <span>{footerRight}</span>}
      </div>
    </div>
  );

  if (photo) {
    content = (
      <div style={{ flex: 1, display: "flex" }}>
        {content}
        {/* biome-ignore lint/performance/noImgElement: ImageResponse (Satori) solo entiende <img>. */}
        <img
          src={photo}
          width={og.photoWidth}
          height={og.height}
          alt=""
          style={{ objectFit: "cover" }}
        />
      </div>
    );
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        backgroundColor: primary[700],
        backgroundImage: `repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0px, rgba(255,255,255,0.035) 1px, transparent 1px, transparent ${og.patternStep}px)`,
        fontFamily: fonts.length ? "Sora" : undefined,
      }}
    >
      {content}
    </div>,
    { ...OG_SIZE, fonts: fonts.length ? fonts : undefined },
  );
}
