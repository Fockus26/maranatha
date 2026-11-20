# Orquestación del 2026-11-20 — brief compartido para los workers

> Tanda suelta (fase 08–09, pulido). Ola 1 de 2: la ola 2 es la migración MUI → shadcn,
> que César decidió hacer como **fase propia** al final (se planifica en otra sesión con §0
> de `orchestrate`, sobre el `main` que deje esta ola).

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (no hay happy-dom ni
> jsdom: lo visual se verifica midiendo con Playwright) · lint `bunx biome check <archivos>` · referencia
> del kit en `~/.claude/kit-reference/` · Next 16: antes de usar una API de Next, su guía en
> `node_modules/next/dist/docs/` (AGENTS.md) · MUI 9, estilos con `sx` y tokens de `theme/tokens.ts`
> (esta ola **sigue en MUI**: nada de shadcn ni Tailwind todavía).

## Unidades

| # | Rama | Qué | Modelo · esfuerzo | Docker | Build local |
|---|---|---|---|---|---|
| W1 | `feat/skeletons-por-pagina` | Skeleton del panel con el layout de cada página (hoy uno genérico a todo el ancho) | sonnet · medium | no | no |
| W2 | `feat/cache-panel` | Caché del panel: volver a una página o filtro reciente no recarga, salvo que los datos cambiaron | opus · medium | **sí** | **sí** |
| W3 | `fix/ofrendar-separacion` | Sección Ofrendar del inicio con la misma separación contenido/formulario que el modal | sonnet · low | no | no |
| W4 | `feat/panel-perfil-y-contrasena` | Ojo para ver la contraseña (login y restablecer) + iniciales reales del admin en la barra del panel | opus · medium | no | no |

Ninguna toca archivos de otra (ver "No tocar" en cada prompt).

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D102 | ninguna | minor |
| W2 | D103–D104 | ninguna | minor |
| W3 | D105 | ninguna | patch |
| W4 | D106–D107 | ninguna | minor |

Último ID en `origin/main`: D101. Si el tuyo ya existe al mergear `origin/main`, toma el siguiente libre y dilo en el informe.

## Formas compartidas

Ninguna. (W4 agrega `name` a `Admin` en `lib/auth/admin.ts`; nadie más lo toca.)

## Decisiones de César para esta tanda

- Cada worker puede levantar su servidor de desarrollo en el puerto de su slot.
- MUI → shadcn: **fase propia, después de esta ola**. En esta ola no se agrega nada de shadcn.
- `CLAUDE.md` dice "QA: al final": no hay `wave-qa`; cada worker verifica lo suyo con medición y capturas.
- Nada destructivo en la base. Ninguna migración en esta tanda.

## Simular el backend

- Sitio público y páginas sin sesión (`/dashboard/login`, `/dashboard/restablecer`): `bun run dev -- --port <puerto>` en tu slot.
- Dashboard con sesión: **solo W2** (Docker: sí) con `bun run qa:local -- --port <puerto>` (Postgres + Mailpit en Docker con las cuentas de `.env.test.local`; `-- --preview` para el build de producción). Nunca contra la base real.
- Los demás no inician sesión: lo que necesite sesión se verifica por código, tests puros o una página temporal sin commitear (lo dice cada prompt).
- Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

Las reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
(léelas allí; son la fuente). Resumen de lo que más se olvida:

1. Lee solo `CLAUDE.md`, lo que cita tu prompt y, con `git grep`, lo demás.
2. Trabaja SOLO en tu slot; no crees worktrees, no corras `wt`, no cambies de rama.
3. No edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`; tu `PHASE_LOG/<rama-con-guiones>.md` va a la carpeta principal o en el informe.
4. Una decisión por archivo `context/decisions/D0NN-<tema>.md` dentro de tu rango (formato en `context/decisions/README.md`).
5. Changeset `.changeset/<desc>.md` con el bump de tu prompt, texto en español. No toques `version` ni `CHANGELOG.md`.
6. Servidor en tu puerto, log en `.qa/dev.log`; al terminar `taskkill /PID <pid> /T /F`. Docker solo si tu prompt dice "Docker: sí".
7. Navegador: tu propia pestaña con `tabId`. Playwright con `node`, scripts en `.qa/`. `MSYS_NO_PATHCONV=1` para rutas en Git Bash.
8. `.env` apunta a producción: no inicies sesión ni escribas datos reales.
9. `bun run test:related` mientras trabajas; la suite completa sola, en segundo plano, a `.qa/test.log`.
10. Archivos con Read/Write/Edit; scripts en `.qa/*.mjs`.
11. `sleep` está bloqueado; lo largo en segundo plano. Buscar con `git grep`.
12. Commit al cerrar cada etapa + `wip:` cada ~20 min + `.qa/progress.md`. Push antes de los checks largos.
13. Antes del PR: typecheck, lint, tests, skill `a11y` (axe claro y oscuro, 320 px, teclado). Build local solo si tu prompt dice "Build local: sí"; si no, CI.
14. Capturas: `.pr-shots.json` propio, `bun run shots` y luego `bun run shots:publish` (dos comandos).
15. Sin poder preguntar: opción conservadora + "Decisión tomada / alternativa" en el PR.
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique.
17. Copy nuevo = provisional, marcado + fila del checklist en el informe.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados). Slot limpio. Nunca merge, push a `main`, force-push ni rebase (si `main` se movió: `git merge origin/main`).
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, tokens que faltaron, PHASE_LOG si no pudiste escribirlo.
