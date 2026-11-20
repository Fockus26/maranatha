# Orquestación del 2026-11-19 — brief compartido para los workers

> Tanda suelta (fase 08–09, pulido). Una sola ola.

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad. Carpeta
> principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los archivos locales:
> `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`, `context/PHASE_LOG/`, `context/plans/`).
> Su `context/` es `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Datos del proyecto:** tests con `bun:test` (`tests/unit/`), sin entorno DOM (no hay happy-dom ni
> jsdom: lo visual se verifica midiendo con Playwright) · lint `bunx biome check <archivos>` · referencia
> del kit en `~/.claude/kit-reference/` · Next 16.3.4: antes de usar una API de Next, su guía en
> `node_modules/next/dist/docs/` (AGENTS.md) · MUI 9, estilos con `sx` y tokens de `theme/tokens.ts`.

## Unidades

| # | Rama | Qué | Ola | Slot / puerto |
|---|---|---|---|---|
| W1 | `feat/progreso-navegacion` | Indicador de carga al navegar (barra arriba + `loading.tsx`) | 1 | el de `wt take` |
| W2 | `feat/formularios-panel-lateral` | Formularios crear/editar del dashboard (proyectos y agenda) en panel lateral | 1 | el de `wt take` |
| W3 | `feat/seccion-ofrendar` | Sección "Ofrendar" con formulario completo en el inicio + "Diezmo" → "Ofrendar" en botones y títulos | 1 | el de `wt take` |
| W4 | `fix/quitar-zinli-wally` | Quitar Zinli y Wally como métodos de pago | 1 | el de `wt take` |

Ninguna toca archivos de otra (ver "No tocar" en cada prompt).

## Números reservados

| Unidad | Decisiones | Filas `CONTENT_CHECKLIST` | Changeset |
|---|---|---|---|
| W1 | D095 | ninguna | minor |
| W2 | D096–D097 | ninguna | minor |
| W3 | D098–D099 | 1 fila (sin número, el archivo usa `—`), la entregas en el informe | minor |
| W4 | D100 | ninguna | minor |

D094 está tomado por el PR #45 (comprobantes R2), aún abierto.

## Formas compartidas

Ninguna.

## Decisiones de César para esta tanda

- Cada worker puede levantar su servidor de desarrollo en el puerto de su slot.
- "Diezmo" → "Ofrendar" solo en **botones y títulos**; dentro del formulario se sigue eligiendo Diezmo u Ofrenda (`ContributionType` y la base no cambian).
- Sección de inicio: **propuesta B** — el formulario completo dentro de la sección. El botón del menú sigue abriendo el modal ("además de mostrarse al dar click en el botón").
- Formularios del panel: **panel lateral** (Drawer derecho, secciones agrupadas, barra fija con Guardar/Cancelar; en móvil a pantalla completa).
- Nada destructivo en la base. Ninguna migración en esta tanda.

## Simular el backend

- Sitio público: `bun run dev -- --port <puerto>` en tu slot; sin login.
- Dashboard con sesión: solo W2 (Docker: sí) con `bun run qa:local -- --port <puerto>` (base local en Docker + cuentas de `.env.test.local`). Nunca contra la base real.
- Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

Las 19 reglas de `~/.claude/skills/orchestrate/brief-template.md` § "Batch rules" aplican tal cual
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
16. Arregla la clase entera en la primera pasada. Prevén lo de `~/.claude/kit-reference/QA-PREVENTION.md` que aplique (campos `trim().min(1)`, submit deshabilitado en vuelo, `flex-wrap` en filas de botones, sin scroll horizontal a 320 px y 200 %).
17. Copy nuevo = provisional, marcado + tu fila del checklist.
18. Cierre: commits convencionales en español, push, `gh pr create --body-file .qa/pr-body.md` (Write y `gh pr create` en turnos separados). Slot limpio. Nunca merge, push a `main`, force-push ni rebase.
19. Informe final breve: URL del PR, slot, changeset, verificado / no verificado, decisiones abiertas, acciones manuales, bugs vistos de pasada, PHASE_LOG si no pudiste escribirlo.
