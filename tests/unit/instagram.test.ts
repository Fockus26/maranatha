import { describe, expect, test } from "bun:test";
import {
  type BeholdPost,
  buildImageSource,
  normalizeFeed,
  normalizePost,
  paletteToCss,
} from "@/lib/instagram";

const size = (name: string, w: number) => ({
  mediaUrl: `https://hop.behold.pictures/${name}.jpg`,
  width: w,
  height: w,
});
const SIZES = {
  small: size("s", 400),
  medium: size("m", 700),
  large: size("l", 1000),
  full: size("f", 2000),
};

describe("buildImageSource", () => {
  test("usa large como src y arma el srcSet con todos los anchos", () => {
    const r = buildImageSource(SIZES, "fallback");
    expect(r.src).toBe("https://hop.behold.pictures/l.jpg");
    expect(r.srcSet).toBe(
      "https://hop.behold.pictures/s.jpg 400w, https://hop.behold.pictures/m.jpg 700w, https://hop.behold.pictures/l.jpg 1000w, https://hop.behold.pictures/f.jpg 2000w",
    );
  });
  test("sin large, usa el mayor disponible", () => {
    expect(buildImageSource({ small: SIZES.small }, "x").src).toBe(
      "https://hop.behold.pictures/s.jpg",
    );
  });
  test("sin tamaños cae al fallback y srcSet vacío", () => {
    expect(buildImageSource(undefined, "orig.jpg")).toEqual({
      src: "orig.jpg",
      srcSet: "",
    });
  });
});

describe("paletteToCss", () => {
  test("convierte r,g,b", () => {
    expect(paletteToCss("60,68,56")).toBe("rgb(60 68 56)");
  });
  test("rechaza formatos raros", () => {
    expect(paletteToCss("red;background:url(x)")).toBeUndefined();
    expect(paletteToCss(undefined)).toBeUndefined();
  });
});

const base: BeholdPost = {
  id: "1",
  permalink: "https://www.instagram.com/p/abc/",
  mediaType: "IMAGE",
  mediaUrl: "https://cdn/img.jpg",
  sizes: SIZES,
  prunedCaption: "  Hola  ",
  caption: "Hola #fe",
  hashtags: ["fe"],
  likeCount: 10,
  commentsCount: 2,
  timestamp: "2026-10-12T01:27:32+0000",
  colorPalette: { dominant: "1,2,3" },
};

describe("normalizePost", () => {
  test("imagen simple", () => {
    const p = normalizePost(base);
    expect(p.caption).toBe("Hola");
    expect(p.hashtags).toEqual(["fe"]);
    expect(p.likeCount).toBe(10);
    expect(p.isCarousel).toBe(false);
    expect(p.media).toHaveLength(1);
    expect(p.media[0].type).toBe("image");
    expect(p.placeholder).toBe("rgb(1 2 3)");
  });

  test("reel: guarda el mp4 y usa el thumbnail como póster sin tamaños", () => {
    const p = normalizePost({
      ...base,
      mediaType: "VIDEO",
      permalink: "https://www.instagram.com/reel/xyz/",
      mediaUrl: "https://cdn/v.mp4",
      thumbnailUrl: "https://cdn/thumb.jpg",
      sizes: undefined,
    });
    expect(p.isVideo).toBe(true);
    expect(p.isReel).toBe(true);
    expect(p.media[0].videoUrl).toBe("https://cdn/v.mp4");
    expect(p.media[0].image.src).toBe("https://cdn/thumb.jpg");
  });

  test("carrusel: un media por hijo, mezclando fotos y videos", () => {
    const p = normalizePost({
      ...base,
      mediaType: "CAROUSEL_ALBUM",
      children: [
        { id: "a", mediaType: "IMAGE", mediaUrl: "a.jpg", sizes: SIZES },
        {
          id: "b",
          mediaType: "VIDEO",
          mediaUrl: "b.mp4",
          thumbnailUrl: "b.jpg",
        },
      ],
    });
    expect(p.isCarousel).toBe(true);
    expect(p.media.map((m) => m.type)).toEqual(["image", "video"]);
    expect(p.media[1].videoUrl).toBe("b.mp4");
    expect(p.cover.src).toBe("https://hop.behold.pictures/l.jpg");
  });
});

describe("normalizeFeed", () => {
  test("perfil + límite de posts", () => {
    const f = normalizeFeed(
      {
        biography: " Bio ",
        followersCount: 7250,
        profilePictureUrl: "p.webp",
        posts: [base, { ...base, id: "2" }, { ...base, id: "3" }],
      },
      2,
    );
    expect(f.profile).toEqual({
      biography: "Bio",
      followersCount: 7250,
      profilePictureUrl: "p.webp",
    });
    expect(f.posts.map((p) => p.id)).toEqual(["1", "2"]);
  });
});
