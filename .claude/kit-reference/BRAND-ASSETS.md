# Brand assets — favicon, touch icon, Open Graph and icon

What is seen outside the site: the browser tab, the icon when saved to the home screen, the
card when shared on WhatsApp or LinkedIn. Decided at kickoff (`project-kickoff`, Block C)
and implemented in the `seo` init (phase 02).

---

## First you ask: what does the client already have?

Never assume. In the interview, one question per piece, with these possible answers:
**has it (and sends it)** · **has to be created** · **does not apply**.

| Piece | For | If the client has it, ask for | If it has to be created |
|---|---|---|---|
| **Logo** | Header, footer, OG | SVG (vector), light and dark versions, and the horizontal / stacked versions if they exist | Out of the kit's scope unless César agrees: it is brand work. If agreed, it is asked of Claude Design as a separate piece |
| **Icon / isotype** | Base for favicon, touch icon and manifest | Square SVG, legible at 16 px. If there is only a horizontal logo, **the icon is missing** | Claude Design derives it from the logo (initial, monogram or symbol) — brief §3 |
| **Favicon** | Tab | `.ico` or SVG if it exists | Generated from the icon |
| **Apple touch icon** | iOS home screen | PNG 180×180 | Generated from the icon |
| **Open Graph image** | Card when shared | PNG/JPG 1200×630 | Template designed by Claude Design (brief §7) and implemented with `ImageResponse` |
| **Theme color** | Mobile browser bar, manifest | Hex | Comes from the palette |

What is missing goes to `CONTENT_CHECKLIST.md` with its row. What has to be created goes to
the brief.

> The case that slips most: the client has a logo but **no icon**. A horizontal logo shrunk
> to 16 px is a smudge. Ask explicitly about the icon.

### The client has a logo but has not delivered it yet

You neither wait nor invent a brand. You set up a **provisional logo** that gets swapped
for the real one without redoing anything (it happened in a project: the logo arrived with
the site already under way):

- A single provisional source file (`public/brand/logo.svg`, `icon.svg`): a monogram or the
  name in the site's typeface, with the token colors. Flagged as provisional in the code and
  with its row in `CONTENT_CHECKLIST.md`.
- Everything else **is derived** from that file, as with the real one: favicon, touch icon,
  manifest and the OG (`ImageResponse` reads the SVG). Nothing copies the provisional one by
  hand.
- When the real one arrives: the source file is replaced, the derivatives regenerated and
  the checklist row closed. If the real one does not fit the slot (proportion, dark
  version), it is a new decision, not a touch-up everywhere.

---

## What gets implemented (Next.js App Router, file conventions)

| File in `app/` | Size | Notes |
|---|---|---|
| `favicon.ico` | 16, 32 and 48 px inside the `.ico` | Only at the root of `app/`. For old browsers and feed readers |
| `icon.svg` | vector | The modern favicon. Can adapt to the theme with `@media (prefers-color-scheme: dark)` inside the SVG |
| `icon.png` | 512×512 | Raster fallback |
| `apple-icon.png` | 180×180 | **Opaque background** (iOS paints transparency black) and ~10% margin |
| `manifest.ts` | — | `name`, `short_name`, `theme_color`, `background_color`, icons 192 and 512, and one `purpose: 'maskable'` with the symbol within the central 80% |
| `opengraph-image.tsx` (or `.png`) | 1200×630 | Site default; important pages may have their own. `alt` with `opengraph-image.alt.txt` or `export const alt` |
| `twitter-image` | 1200×630 | Only if it differs from the OG; otherwise the OG is enough |

Rules:

- **One source icon, the rest is derived.** The `.ico`, the PNGs and the maskable come from
  the icon's SVG. If the brand changes, everything is regenerated from there.
- The OG carries text legible as a thumbnail (title ≥ 60 px on the 1200 canvas), the logo,
  and respects a safety margin: WhatsApp and LinkedIn crop differently.
- The OG generated with `ImageResponse` uses the site's fonts (load them as `ArrayBuffer`)
  and the token colors, not loose hex values.
- Without `metadataBase` (see the `seo` skill) the OG URLs come out relative and the card
  does not load.

## Verification

- [ ] Tab with the favicon in light and dark.
- [ ] `apple-icon.png` without transparency; "Add to Home Screen" on iOS looks right (or say
      so under "not verified" in the PR if there is no device).
- [ ] Valid manifest (Lighthouse › PWA/installability if it applies).
- [ ] OG card checked with the platform's share debugger (Facebook Sharing Debugger,
      LinkedIn Post Inspector) **on the deployed URL**, not localhost.
- [ ] What is provisional (derived icon not approved, OG without final copy) with its row in
      `CONTENT_CHECKLIST.md`.
