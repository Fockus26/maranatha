# D143 · Componentes · Cierre de la fase MUI → shadcn: la interfaz entera es shadcn/ui (Radix + Tailwind) y MUI/Emotion salen del proyecto · Implementado

**Decisión:** la librería de componentes es **shadcn/ui** (primitivas de `components/ui/` sobre Radix, estilos con Tailwind 4 y los tokens de `theme/tokens.ts` generados a `app/tokens.css`, íconos `lucide-react`). `@mui/*` y `@emotion/*` no están en `package.json` ni en `bun.lock`, y `tests/unit/sin-mui.test.ts` falla si vuelven a aparecer en `app/`, `components/`, `lib/`, `theme/` o en las dependencias. Una primitiva nueva se trae con `bunx shadcn@latest add <x>` y se ajusta a los tokens antes que escribirla a mano.

**Qué se migró (5 olas):**
- Ola 1 (#58): base shadcn, tokens → `@theme`, roles por modo y navy, `dark:` por `data-color-mode` del servidor, `button` (D109–D111).
- Ola 2 (#59–#62): acciones, campos, superposiciones y estados — avatar, tooltip, badge, link, field/input/select/radio/popover, dialog/sheet/alert/sonner, skeleton/progress/tabs/container, `PatternLayer`, mapa de íconos (D112–D121).
- Ola 3 (#63–#66): pagos, panel (marco), secciones y marco del sitio (D122–D133).
- Ola 4 (#67–#68): primitivas y tokens que faltaron, datos del panel (D134–D139).
- Ola 5 (este PR): `ColorModeProvider` sin MUI (D140), base del documento, foco, scroll y selección en CSS propio (D141), reglas `.Mui*` fuera (D142), borrados `theme/{theme,globalStyles,fieldStyles,patterns}.ts` y `components/ui/outlinedActionSx.ts`.

**Qué se conserva, en su forma nueva:** D057 (papel sólido `bg-card` en diálogos, sin velo de elevación), D062 y D089 (calendario y selector de hora propios, sobre `popover`), D077 (selección y scroll por tokens, ahora variables de `app/tokens.css`), D085 (anillo 2 px / offset 2 px con `--focus-ring`; campos con borde 2 px, sin outline), D086 (foco de campos en `forced-colors` sobre `[data-field-control]`), D099 (dos `TitheForm` a la vez: Radix no monta el contenido cerrado).

**Para el QA de versión (fase 09):** contrastes bajo AA heredados de MUI que no se tocaron (oscuro `primary` sobre card 3,10:1 y fondo 3,78:1, `primary-foreground`/`primary` 3,55:1, `secondary-foreground`/`secondary` 2,77:1, `success` 2,71:1, hover de `text` en claro 2,77:1, días de otro mes al 40 %, error de `Field` sobre navy en claro 3,49:1) y los "Sin verificar" de las olas 2–4 del plan de la fase (`context/plans/phase-migracion-shadcn.md`). Decisiones abiertas de César: D128, D129, D131/D132.
**Por qué:** pedido de César ("dejar MUI y desarrollar los componentes con shadcn"); una sola librería evita la convivencia Emotion sin capa vs. Tailwind en capas, que obligaba a `!` y a `container` en los portales.
**Alternativa descartada:** dejar MUI instalado como respaldo: el guard no podría distinguir un import nuevo de uno olvidado y el bundle seguiría arrastrando Emotion.
