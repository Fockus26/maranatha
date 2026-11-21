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
- Placeholder ≥ **4.5:1**: el de por defecto (el color del texto al 50 %) da 3.25:1 en claro,
  y axe no lo revisa.
- Una acción dentro de un aviso (el "Reintentar" de un toast) usa el color de ese aviso, no primary.
- Sin scroll horizontal a **320px** de ancho.
- Al 400% de zoom el contenido reflota en una columna.
- `prefers-reduced-motion` respetado (Reveal, PageTransition, parallax, patrón animado).
- Todo control tiene nombre accesible.
- Texto seleccionado (`::selection`) con los tokens `selection` (D077), ≥ 4.5:1 en claro y
  oscuro. Dentro de un componente con fondo propio (un botón primary, un aviso de color), su
  par invertido: el par global se pierde ahí.

Casos que fallan una y otra vez en este proyecto, verifícalos explícitamente:
- `secondary` `#F9750D` como texto o fondo en **modo claro** → se usa `secondary[700]` (D011/D051).
- `success` `#16B37A` con texto blanco (2.7:1) → superficies rellenas usan `successFilled`.
- `error` puro → se usa `errorOnLight` / `errorOnDark` según el modo.
- `primary.main` en **oscuro** (`#5B6B9E`) como texto sobre el fondo: 3.8:1, no llega a 4.5 (ver `COLORS.md`).
- Texto sobre foto: overlay navy en degradado (D012).

## Breakpoints

Definidos en `theme/tokens.ts` (los que tenía MUI; variantes `sm:`…`xl:` y `wide:` ≥ 1920 de Tailwind):

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
  `theme/tokens.ts` (vía las clases de Tailwind generadas a `app/tokens.css`, las variables
  de rol como `bg-background`, o importando el token). Si aparece un hex o un px suelto, o el token existe y no se usó, o falta un token y eso es una
  decisión que hay que registrar.
- Unidad base de espaciado: **4px** (`spacing.xs`); la escala está en `DESIGN_TOKENS.md`.
- Estilos compartidos ya resueltos: las primitivas de `components/ui/` (`input`, `field`…) y
  `PatternLayer` (patrón diagonal animado, tile de `theme/patternTile.ts`). Geometría de un
  solo componente: literal con comentario `valor único:` (D138).

## Componentes

- Antes de crear uno nuevo, revisar `COMPONENTS_INVENTORY.md`. Dos componentes que hacen lo
  mismo con nombres distintos es la deuda más cara del sistema.
- **shadcn/ui antes que reimplementar** un primitivo a mano (`bunx shadcn@latest add <x>` y
  ajustarlo a los tokens). Excepciones registradas: `DateField` y `TimeField` con calendario y
  selector propios (D062, D089).
- Los widgets compuestos siguen el patrón de WAI-ARIA Authoring Practices correspondiente.
- Modales globales (diezmo, proyecto del dashboard) se montan una vez en el layout y se
  abren con un store (D049/D059), no con estado local.

## Código

- **bun** como gestor y runner. Nunca npm, yarn ni pnpm.
- **Context7** consultado antes de usar la API de cualquier librería.
- Server Components por defecto; `'use client'` lo más abajo posible del árbol.
- TypeScript estricto, cero `any`.
- **Librería de componentes:** shadcn/ui (Radix) — ver `PROJECT_CONTEXT.md`. MUI retirado (D143).
- **Sistema de estilos:** Tailwind con los tokens de `app/tokens.css`; `cn` de `lib/utils`.
- Una sección de Home = un archivo con su componente y sus datos (D030).
- **Nadie levanta el servidor de desarrollo.** Lo levanta César. Los agentes piden que esté
  corriendo y esperan confirmación.

## Contenido

- **Ningún agente inventa contenido final**: ni copy, ni `alt` real, ni precios, ni datos de
  contacto, ni testimonios. Placeholder marcado + fila en `CONTENT_CHECKLIST.md`.
- **Cero lorem ipsum.** Placeholder realista, en español, con la longitud del texto final.

## Git

- Modo `pr` (ver `GIT_STATE.md`): en la rama de la unidad se commitea y empuja sin pedir
  permiso; la aprobación de César es la revisión del PR. Nunca push a `main`, nunca
  `gh pr merge`.
- Nada destructivo: ni `reset --hard`, ni `push --force`, ni borrar ramas, ni reescribir
  historia.

## Reglas específicas de este proyecto

- Pagos: el servidor revalida todo lo que manda el cliente; montos y tasas se recalculan en
  `app/actions/payments.ts`, nunca se confía en los del formulario.
- Datos secretos solo en código `server-only`; nada secreto con prefijo `NEXT_PUBLIC_`.
- El naranja `contained` (`secondary`) se reserva a CTAs de alta prioridad (D011).
