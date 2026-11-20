# Orquestación del 2026-11-20 — fase migración MUI → shadcn · ola 1 de 5 · brief compartido

> Plan de la fase: `context/plans/phase-migracion-shadcn.md` (léelo: "Decisiones de César",
> "Reglas de la fase" y la fila de tu ola). Ola 1 = una sola unidad: la base, sobre la que
> trabajan todas las demás.

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (no hay happy-dom ni
> jsdom: lo visual se verifica midiendo con Playwright) · lint `bunx biome check <archivos>` · referencia
> del kit en `~/.claude/kit-reference/` (`UI-LIBRARIES.md` › shadcn, `STACK-NEXTJS.md` › Tailwind) ·
> Next 16: antes de usar una API de Next, su guía en `node_modules/next/dist/docs/` (AGENTS.md) ·
> Tailwind 4 ya instalado (`@tailwindcss/postcss`), hoy sin usar · MUI 9 + Emotion siguen vivos
> hasta la ola 5: conviven.
>
> **CI parado:** GitHub Actions no corre por facturación (ver "Bloquea" de `CURRENT_PHASE.md`).
> Nada de `gh pr checks`: typecheck, lint, tests y build se verifican en local y van al PR.

## Unidades

| # | Rama | Qué | Modelo · esfuerzo | Docker | Build local |
|---|---|---|---|---|---|
| W1 | `feat/shadcn-base` | Tokens → Tailwind `@theme`, modo oscuro, `cn`, init de shadcn revisado, dependencias de la fase, `button.tsx`, token 960, borrar `DashboardPageSkeleton.tsx` | opus · medium | no | **sí** |

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D108–D110 | ninguna | none (sin cambio visible) |

Último ID en `origin/main`: D107. Si el tuyo ya existe al mergear `origin/main`, toma el siguiente libre y dilo en el informe.

## Formas compartidas

Las que fija W1 y usarán todas las olas siguientes (por eso van en su informe, con ejemplos):
nombres de las variables CSS por modo, nombres de las utilidades de tokens (`text-h1`, `p-lg`,
`rounded-md`, `shadow-hover`, `z-modal`…), la variante `dark:` y la de superficie navy, y la
API de `button.tsx` (variantes y tamaños).

## Decisiones de César para esta fase

- Look igual al actual, con ajustes menores aceptados y anotados en el PR; capturas antes/después.
- Íconos: `lucide-react` (W1 solo lo instala; el mapa MUI → lucide es de la ola 2).
- `DashboardPageSkeleton.tsx` se borra (W1).
- Servidor de desarrollo propio en el puerto del slot. Docker: no en esta ola.
- `QA: al final`: no hay `wave-qa`.
- Nada destructivo en la base. Ninguna migración de base de datos en esta fase.

## Simular el backend

- Sitio público y páginas sin sesión (`/dashboard/login`, `/dashboard/restablecer`): `bun run dev -- --port <puerto>` en tu slot.
- W1 no inicia sesión (Docker: no): el panel con sesión no se captura en esta ola; como W1 no debe cambiar nada visible, basta con las rutas públicas y las de login.
- Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

Las reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
(léelas allí; son la fuente). Resumen de lo que más se olvida:

1. Lee solo `CLAUDE.md`, lo que cita tu prompt y, con `git grep`, lo demás.
2. Trabaja SOLO en tu slot; no crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu `PHASE_LOG/<rama-con-guiones>.md` va a la carpeta principal o en el informe.
4. Una decisión por archivo `context/decisions/D0NN-<tema>.md` dentro de tu rango (formato en `context/decisions/README.md`).
5. Changeset `.changeset/<desc>.md` solo si tu prompt da un bump distinto de none. No toques `version` ni `CHANGELOG.md`.
6. Servidor en tu puerto, log en `.qa/dev.log`; al terminar `taskkill /PID <pid> /T /F`.
7. Navegador: tu propia pestaña con `tabId`. Playwright con `node`, scripts en `.qa/`. `MSYS_NO_PATHCONV=1` para rutas en Git Bash.
8. `.env` apunta a producción: no inicies sesión ni escribas datos reales.
9. `bun run test:related` mientras trabajas; la suite completa sola, en segundo plano, a `.qa/test.log`.
10. Archivos con Read/Write/Edit; scripts en `.qa/*.mjs`.
11. `sleep` está bloqueado; lo largo en segundo plano. Buscar con `git grep`.
12. Commit al cerrar cada etapa + `wip:` cada ~20 min + `.qa/progress.md`. Push antes de los checks largos.
13. Antes del PR: typecheck, lint, tests, build (si tu prompt dice "Build local: sí"), skill `a11y` (axe claro y oscuro, 320 px, teclado).
14. Capturas: `.pr-shots.json` propio, `bun run shots` y luego `bun run shots:publish` (dos comandos). Antes/después: las de `main` con `bash scripts/run-on-main.sh`.
15. Sin poder preguntar: opción conservadora + "Decisión tomada / alternativa" en el PR.
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique.
17. Copy nuevo = provisional, marcado + fila del checklist en el informe.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados). Slot limpio. Nunca merge, push a `main`, force-push ni rebase (si `main` se movió: `git merge origin/main`).
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, tokens que faltaron, formas compartidas que fijaste, PHASE_LOG si no pudiste escribirlo.
