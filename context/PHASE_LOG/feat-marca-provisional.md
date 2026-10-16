# feat/marca-provisional

**Qué:** logo provisional, icono/favicon y OG de la adenda de diseño (D078).

- `public/brand/`: 6 SVG (mark, horizontal, compact + inverse) y PNG derivados.
- `scripts/brand-icons.ts` (`bun run brand:icons`): favicon.ico 16/32/48, apple 180, manifest 192/512/maskable.
- `components/brand/Logo.tsx` en Navbar (responsive), Footer, DashboardSidebar (inverse), DashboardTopbar (mark xs / compact sm+).
- `lib/og.tsx` + `app/opengraph-image.tsx` + `app/proyectos/[slug]/opengraph-image.tsx` (+ twitter-image).
- Fuera: `app/icon.tsx`, `app/apple-icon.tsx`; la página de proyecto ya no fija `openGraph.images`.

**Verificado:** typecheck, Biome en archivos tocados, suite (11), build; OG del sitio revisada en el PNG del build (Sora carga); iconos maskable revisados.
**No verificado:** Logo en navegador (sin servidor), OG de proyecto (se genera bajo demanda), capturas, axe.
