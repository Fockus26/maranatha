# Design Rules — Iglesia Maranatha

> Reglas no negociables. Todo agente y toda skill las cumple sin excepción.
>
> Si un caso concreto necesita romper una regla, **es una decisión nueva** que pasa por César
> y queda registrada en `decisions/` — no una excepción silenciosa dentro de un componente.

## Accesibilidad — WCAG 2.1 AA

- Texto normal: contraste ≥ **4.5:1** contra su fondo real.
- Texto grande (≥24px, o ≥19px bold): ≥ **3:1**.
- Bordes de inputs, íconos informativos y anillos de foco: ≥ **3:1**.
- **Ningún estado se comunica solo con color.** Error, éxito, seleccionado, activo: color
  **+** ícono, texto o forma.
- Foco visible siempre, diseñado, no el outline por defecto ni su ausencia.
- Sin scroll horizontal a **320px** de ancho.
- Al 400% de zoom el contenido reflota en una columna.
- `prefers-reduced-motion` respetado (Reveal, PageTransition, parallax, patrón animado).
- Todo control tiene nombre accesible.

Casos que fallan una y otra vez en este proyecto, verifícalos explícitamente:
- `secondary` `#F9750D` como texto o fondo en **modo claro** → se usa `secondary[700]` (D011/D051).
- `success` `#16B37A` con texto blanco (2.7:1) → superficies rellenas usan `successFilled`.
- `error` puro → se usa `errorOnLight` / `errorOnDark` según el modo.
- `primary.main` en **oscuro** (`#5B6B9E`) como texto sobre el fondo: 3.8:1, no llega a 4.5 (ver `COLORS.md`).
- Texto sobre foto: overlay navy en degradado (D012).

## Breakpoints

Los de MUI, definidos en `theme/tokens.ts`:

| Nombre | Ancho | Notas |
|---|---|---|
| xs | 0 | base, mobile primero |
| sm | 600px | tipografía de títulos pasa a tamaño desktop desde aquí |
| md | 900px | el que más rompe layouts: ni mobile ni desktop |
| lg | 1200px | |
| xl | 1536px | `Container` crece a 1440px de ancho máximo |

**Anchos de verificación de QA** (distintos de los breakpoints — son dispositivos reales):
320 · 360 · 390 · 430 · 768 · 1024 · 1280 · 1440 · 1920 · 2560 · 3840

## Tokens

- **Cero valores mágicos.** Todo color, espaciado, radio, sombra y tamaño de fuente sale de
  `theme/tokens.ts` (vía `theme.palette`, `theme.spacing` o importando el token). Si aparece
  un hex o un px suelto, o el token existe y no se usó, o falta un token y eso es una
  decisión que hay que registrar.
- Unidad base de espaciado: **4px** (`spacing.xs`); la escala está en `DESIGN_TOKENS.md`.
- Estilos compartidos ya resueltos: `theme/fieldStyles.ts` (campos compactos),
  `theme/patterns.ts` (patrón diagonal animado).

## Componentes

- Antes de crear uno nuevo, revisar `COMPONENTS_INVENTORY.md`. Dos componentes que hacen lo
  mismo con nombres distintos es la deuda más cara del sistema.
- **MUI antes que reimplementar** un primitivo a mano. Excepción registrada: `DateField` usa
  un calendario propio (D062).
- Los widgets compuestos siguen el patrón de WAI-ARIA Authoring Practices correspondiente.
- Modales globales (diezmo, proyecto del dashboard) se montan una vez en el layout y se
  abren con un store (D049/D059), no con estado local.

## Código

- **bun** como gestor y runner. Nunca npm, yarn ni pnpm.
- **Context7** consultado antes de usar la API de cualquier librería.
- Server Components por defecto; `'use client'` lo más abajo posible del árbol.
- TypeScript estricto, cero `any`.
- **Librería de componentes:** MUI — ver `PROJECT_CONTEXT.md`.
- **Sistema de estilos:** `sx`/`styled` de MUI. Tailwind no se usa en código nuevo.
- Una sección de Home = un archivo con su componente y sus datos (D030).
- **Nadie levanta el servidor de desarrollo.** Lo levanta César. Los agentes piden que esté
  corriendo y esperan confirmación.

## Contenido

- **Ningún agente inventa contenido final**: ni copy, ni `alt` real, ni precios, ni datos de
  contacto, ni testimonios. Placeholder marcado + fila en `CONTENT_CHECKLIST.md`.
- **Cero lorem ipsum.** Placeholder realista, en español, con la longitud del texto final.

## Git

- Modo `pr` (ver `GIT_STATE.md`): en la rama de la unidad se commitea y empuja sin pedir
  permiso; la aprobación de César es la revisión del PR. Nunca push a `main` ni a las ramas
  de deploy (`vercel`, `vps`), nunca `gh pr merge`.
- Nada destructivo: ni `reset --hard`, ni `push --force`, ni borrar ramas, ni reescribir
  historia.

## Reglas específicas de este proyecto

- Pagos: el servidor revalida todo lo que manda el cliente; montos y tasas se recalculan en
  `app/actions/payments.ts`, nunca se confía en los del formulario.
- Datos secretos solo en código `server-only`; nada secreto con prefijo `NEXT_PUBLIC_`.
- El naranja `contained` (`secondary`) se reserva a CTAs de alta prioridad (D011).
