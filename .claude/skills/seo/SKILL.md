---
name: seo
description: The kit's technical SEO. Use it at three moments - when initializing a project's repo (base metadata, robots, sitemap, favicons), when closing a section that brings real content, and when closing a whole page. Covers per-page metadata, Open Graph, canonical, schema.org JSON-LD, sitemap/robots and the image and font patterns that affect Core Web Vitals.
---

# Technical SEO

Only the part of SEO that is **code implementation**. Keyword strategy, competitor research
and content planning are out of scope: that is marketing work and not yours to decide.

**Language:** the report you give César (Output) is in Spanish; metadata and copy are in the
site's language.

---

## When it activates

| Trigger | What gets done |
|---|---|
| **Repo init** | Full Block 1: base metadata, robots, sitemap, favicons, fonts |
| **Closing a section with real content** | Headings, images, internal links, JSON-LD if the section calls for it (FAQ, reviews, breadcrumb) |
| **Closing a page** | The page's own metadata + JSON-LD of its type + sitemap entry |

It runs **after** `a11y` and **before** César's review, inside the same unit of work.
Never after the commit.

---

## Block 1 — Repo init (once per project)

### Base metadata — `app/layout.tsx`

```tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: '{{Name}} — {{value proposition in ≤60 characters}}',
    template: '%s | {{Name}}',
  },
  description: '{{PENDING — see CONTENT_CHECKLIST.md}}',
  openGraph: {
    type: 'website',
    locale: '{{es_VE}}',
    siteName: '{{Name}}',
    url: '/',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { canonical: '/' },
}
```

`NEXT_PUBLIC_SITE_URL` goes into `.env.example` from day one. Without `metadataBase` every
OG and canonical URL comes out relative and **does not work when shared**.

A page's `openGraph` or `twitter` **replaces** the layout's whole object, not field by
field: `/ingresar` set its own `openGraph.title` and lost the `og:image` (KREA). Keep the
shared part in `lib/seo.ts` (`export const baseOpenGraph = { … }`) and spread it in each
page: `openGraph: { ...baseOpenGraph, title: '…' }`.

### `app/robots.ts`

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/cuenta/'] },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  }
}
```

### `app/sitemap.ts`

```ts
import type { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL!
  return [
    { url: base,              lastModified: new Date(), changeFrequency: 'weekly',  priority: 1 },
    { url: `${base}/precios`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    // dynamic routes: map them from the data source, not by hand
  ]
}
```

If there are dynamic routes (products, articles), the sitemap **is generated from the
data**. A hand-written sitemap is out of date within the first week.

### Brand assets: favicon, touch icon, manifest and OG

Before creating anything, check `PROJECT_CONTEXT.md` › Brand assets: the kickoff wrote down,
piece by piece, whether **the client has it**, whether it **has to be created** (and whether
Claude Design already delivered it) or whether it **does not apply**. If that section does
not exist, ask César — do not assume it has to be generated or that the client has it.
Sizes, files and rules: the kit's `reference/BRAND-ASSETS.md`.

- `app/favicon.ico`, `app/icon.svg` (+ `icon.png` 512), `app/apple-icon.png` (180×180,
  opaque background), `app/manifest.ts` (192, 512 and maskable). All derived from **one**
  source icon.
- `app/opengraph-image.tsx` (1200×630) with Claude Design's template, or the client's. A page
  without OG shared on WhatsApp or LinkedIn looks broken, and that weighs more than almost
  any other detail on this list.
- What has not arrived yet (the client's icon, an unapproved OG): a placeholder generated
  with `ImageResponse` from the tokens and the site name — **flagged as provisional** — and
  its row in `CONTENT_CHECKLIST.md`.

### Status pages

404, 500 and maintenance are not indexed and do not go in the sitemap: the 404 already
ships with `noindex` and status 404; maintenance answers 503 with `Retry-After` (see
`reference/STATUS-SCREENS.md`). The development `/estados` gallery, out of the sitemap and
blocked in production.

### Fonts

`next/font` always — it self-hosts and removes the request to Google. `display: 'swap'`
mandatory. If the font is on an external CDN that cannot be self-hosted, then
`<link rel="preconnect">` in the `<head>`.

---

## Block 2 — Closing a section with content

- [ ] A single `<h1>` on the page; the section uses `<h2>`/`<h3>` without skipping levels.
- [ ] Headings describe the real content, they are not decorative. An `<h2>` that says
      "Nosotros" is worth less than one that says "Diseño y desarrollo web para PyMEs".
- [ ] Images with `next/image`, explicit `width`/`height` or `fill` + `sizes` (avoids CLS).
- [ ] The main *above the fold* image with `priority`; everything else lazy by default.
- [ ] Descriptive `alt` on informative images. Coordinate with `a11y`: it is the same
      attribute, do not write it twice differently. Open the image before writing it (the
      OG one too): an alt written without seeing it does not describe it.
- [ ] Internal links with `next/link` and meaningful anchor text. Never "click aquí".
- [ ] External links: `rel="noopener noreferrer"`, and `rel="nofollow"` if sponsored.
- [ ] JSON-LD if the section calls for it: `FAQPage` on an FAQ, `BreadcrumbList` on
      breadcrumbs, `AggregateRating` only if the reviews are real and visible on the page.

**How to count headings** (here and in an audit): on the rendered DOM, by role and
accessible name (Playwright `getByRole('heading', { level: 1 })`, or
`document.querySelectorAll('h1')` with its `textContent`), never with `grep` on the code. A
grep counted 0 `<h1>` where there was an empty one (the skeleton's, with `aria-hidden`), and
the fix started from that false premise. The right finding was "an h1 with no accessible name".

---

## Block 3 — Closing a page

### Page-specific metadata

```tsx
export const metadata: Metadata = {
  title: '{{≤60 characters, without repeating the brand name — the template adds it}}',
  description: '{{150-160 characters, describes the page, includes an action verb}}',
  alternates: { canonical: '/this-page-route' },
  openGraph: {
    title: '{{may differ from the title — here you optimize for the social click}}',
    description: '{{...}}',
    url: '/this-page-route',
    images: [{ url: '/og/this-page.png', width: 1200, height: 630, alt: '{{...}}' }],
  },
}
```

For dynamic routes, `generateMetadata()` with the entity's real data — and `notFound()` if it
does not exist, so an empty page is not indexed.

### JSON-LD per page type

| Page | Schema |
|---|---|
| Home / corporate | `Organization` + `WebSite` (with `SearchAction` if there is search) |
| Product | `Product` + `Offer` (price, currency, availability) |
| Article / blog | `Article` or `BlogPosting` (author, dates, image) |
| Service | `Service` |
| Local business | `LocalBusiness` (address, hours, phone, geo) |
| FAQ | `FAQPage` |
| Anything with breadcrumbs | `BreadcrumbList` |

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

Hard JSON-LD rules:
- Only mark up **what is visible on the page**. Marking up a price or a review the user does
  not see breaks Google's policies and can cost a manual penalty — not a worse ranking, a
  penalty.
- Prices and availability come from the real data source, never hardcoded.
- Validate the result in the Rich Results Test before calling it done.

### Closing checklist

- [ ] `title` unique across the site, ≤ 60 characters.
- [ ] `description` unique, 150-160 characters.
- [ ] Correct `canonical` (pointing to itself unless it is a deliberate variant).
- [ ] Specific OG image, or the inherited default on purpose.
- [ ] JSON-LD of the right type, validated.
- [ ] Page added to `sitemap.ts`.
- [ ] If it is a page that must **not** be indexed (thank-you, account, checkout):
      `robots: { index: false, follow: false }`. It is the one most often forgotten.

---

## Core Web Vitals — only the subset that touches SEO

You do not do general performance optimization. You do take care of:

- **CLS** — explicit dimensions on every image/iframe/embed; `font-display: swap`; reserve
  the height of banners and ads before they load.
- **LCP** — the LCP element (almost always the hero image) with `priority`; no lazy load
  above the fold; no blocking fonts.
- **INP** — not chased here, but if you see an obviously heavy handler on a visible button,
  say so.

Everything else (bundle size, code splitting, caching) is a different scope.

### Verification with Lighthouse

When closing a page, run Lighthouse on the production build (`bun run build && bun run
start`, not `dev`). The script is in the `a11y` skill (`.qa/lighthouse.ts`) — it prints the
score per category and the failing audits with their description.

For SEO look at these and fix them: `document-title`, `meta-description`,
`http-status-code`, `link-text` ("click aquí"-style anchors), `crawlable-anchors`,
`is-crawlable` (a public page that is `noindex` by accident), `canonical`, `structured-data`
(validates the JSON-LD), `hreflang` if there is i18n. Target: **SEO = 100** on every public
route. A page that is `noindex` on purpose (checkout, account, panel) lowers the SEO score
and that is expected — do not count it.

From the **Performance** category, the ones that touch SEO/CWV:
`largest-contentful-paint-element`, `prioritize-lcp-image` / `lcp-lazy-loaded` (the hero
image needs `priority`), `unsized-images`, `layout-shifts` (CLS),
`render-blocking-resources` (fonts/CSS). The rest of Performance is not your scope.

---

## Never invent copy

Titles, descriptions, `alt`, FAQ text, prices, address, hours and phone are **the client's
real content**. If you do not have it:

1. Put an explicit placeholder: `{{PENDING: pricing page description}}`.
2. Add the row to `context/CONTENT_CHECKLIST.md`.
3. Say so in the output.

Invented metadata that looks final is worse than a visible placeholder: it gets published,
indexed, and nobody notices Google is showing a sentence an agent made up.

---

## Output

In Spanish:

```
## SEO — <página/sección> (<init | sección | página>)

### Implementado
- <qué se agregó> (<archivo>)

### Hallazgos
- [<Crítico|Alto|Medio|Bajo>] <qué falta> — impacto: <qué se pierde>

### Contenido pendiente
- <qué copy real falta> → fila #<N> en CONTENT_CHECKLIST.md

### Verificación manual sugerida para César
- <ej. validar el JSON-LD en Rich Results Test, o subir la OG image real>
```

**Severities:** *Critical* = blocks indexing or breaks sharing (no title/description, no OG
image, robots blocking everything). *High* = measurable impact on CTR or rich results (no
canonical, no JSON-LD on product/article). *Medium* = recommended improvement. *Low* = minor.
