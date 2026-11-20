# Kit feedback — Iglesia Maranatha

> Lo que el **web-agent-kit** hizo mal, de más o de menos en este proyecto, para mejorarlo.
> No es el diario del proyecto: es material para el kit. Se busca con `grep`, no se lee por
> defecto. Kit en el que arrancó / al que se actualizó: ver `.kit-version`.

## Cuándo se anota (lo hace el agente, sin que se lo pidan)

| Tipo | Señal |
|---|---|
| **Corrección** | César corrige algo que el agente hizo siguiendo el kit ("no, así no", "otra vez el…", revierte un cambio) |
| **Repetición** | César tuvo que pedir lo mismo por segunda vez, o hacer a mano un paso que el kit podría hacer |
| **Hueco** | El kit no decía qué hacer y el agente tuvo que improvisar o preguntar algo que debería estar resuelto |
| **Fricción** | Un paso del kit costó mucho para lo que aportó (tokens, tiempo, ceremonia), o una instrucción estaba mal |
| **Prevención** | Un QA encontró una clase de defecto que no está en `QA-PREVENTION.md` (la regla que la habría evitado al construir) |

No se anota: errores del agente que el kit ya prohíbe con claridad (eso es otra cosa), ni
preferencias de este proyecto solo (van a `decisions/`).

**Si ya existe una fila del mismo problema, no se duplica: se suma 1 a "Veces" y se
actualiza la fecha.** Lo que se repite es lo que más vale arreglar.

## Registro

| # | Fecha | Tipo | Veces | Pieza del kit | Qué pasó (1 línea) | Propuesta (1 línea) |
|---|---|---|---|---|---|---|
| 1 | 2026-10-13 | Hueco | 1 | ACTUALIZACIONES.md 3.2.0 | Las secciones agrupadas (`## D037 / D038 / D039`) dan falsos huecos al cruzar índice y detalle | Decir que se migra un archivo por fila del índice, con una línea `**Agrupa:**` → informe 2026-10-16 |
| 2 | 2026-10-13 | Fricción | 1 | ACTUALIZACIONES.md 3.4.0 | `qa-local.ts` asume el rol en `app_metadata`; aquí el admin va por `ADMIN_EMAILS` (env) | Añadir el caso "rol por lista en env" junto a `asignarRol` → informe 2026-10-16 |
| 3 | 2026-10-13 | Hueco | 1 | fase 02 / CLAUDE-DESIGN-ADENDA.template.md | El kit no menciona la barra de scroll: César la pidió aparte | Añadir el scrollbar (claro/oscuro, contraste del thumb) como token de la fase 02 y bloque de la adenda, junto a `::selection` → informe 2026-10-16 |
| 4 | 2026-10-13 | Hueco | 1 | CLAUDE-DESIGN-ADENDA.template.md § Icono | No cubre "el cliente tiene logo pero no lo ha entregado" | Añadir la opción de logo provisional que se cambia por el real sin rehacer icono ni OG → informe 2026-10-16 |
| 5 | 2026-11-08 | Corrección | 1 | reference/scripts/qa-local.ts (3.16+) | `env.NODE_ENV = "production"` rompe `tsc` en un proyecto Next (NODE_ENV es readonly en los tipos): typecheck rojo al copiar el script | Asignarlo con cast `(env as Record<string, string \| undefined>).NODE_ENV` en el kit |
| 6 | 2026-11-08 | Hueco | 1 | kit-update §7 / new-project.ps1 (biome.json) | Con la unidad en `.claude/worktrees/<x>`, la exclusión `!**/.claude/worktrees` hace que Biome ignore todo el worktree: `bun run lint` no comprueba nada | Excluir solo desde la raíz (`!.claude/worktrees`) o decir en kit-update que lint se verifica con config temporal / fuera de `.claude/worktrees` |
| 7 | 2026-11-08 | Hueco | 1 | UPDATES.md 3.10.0–3.20.0 | Muchos pasos piden reemplazar el mismo script (`qa-local.ts`) o correr `-OnlyPieces` en cada versión; en un salto largo eso solo se puede hacer una vez con la versión publicada | Decir en kit-update §8 que en un salto de varias versiones los reemplazos de scripts y `-OnlyPieces` se aplican una vez (en la primera versión que los pide) y las demás se registran como "ya al día" |
| 8 | 2026-11-10 | Fricción | 3 | orchestrate brief-template § regla 7 | En disco lento la 1ª compilación de `next dev` tarda ~3 min y `chromium.launch()` agota 180 s | Sugerir `--disable-gpu` y `timeout` alto en los scripts `.qa` |
| 9 | 2026-11-10 | Hueco | 1 | orchestrate §1 (verificar lo que se afirma) | El prompt pedía `secondary[500]` para el anillo de foco y no pasa 3:1 sobre blanco; el worker tuvo que cambiarlo | Al pedir un color de foco/borde, calcular su contraste contra los fondos reales antes de escribir el prompt |
| 10 | 2026-11-10 | Corrección | 4 | orchestrate (prompts de la tanda) | El orquestador citó `tests/unit/tokens.test.ts` como guardia y no existe en este repo | Verificar con `ls` cada test que se cita como trampa |
| 11 | 2026-11-10 | Fricción | 1 | a11y / `bun run shots` (pr-screenshots) | El script de capturas no logró abrir un diálogo tras la hidratación (timeout de `waitFor`, 4 intentos) | Añadir espera de hidratación o un ejemplo fiable de `steps` que abre un modal |
| 12 | 2026-11-10 | Fricción | 1 | orchestrate brief-template § regla 7 | En dev, `page.locator('[role="dialog"]')` choca con el overlay de errores de Next | Recomendar `getByRole('dialog', { name })` o `aria-label` en los scripts `.qa` |
| 13 | 2026-11-10 | Fricción | 2 | kit-update §1 (versión del proyecto) | Leyó `.kit-version` de la copia local (rama vieja, 3.9.0) y planeó 13 versiones; `origin/main` ya estaba en 3.21.0 | Leer la versión del proyecto con `git show origin/<base>:.kit-version` tras `git fetch`, no del working tree |
| 14 | 2026-11-10 | Fricción | 2 | kit-update §9 / install-kit.ps1 -Project | `install-kit -Project` escribe la copia en CRLF (65 archivos) y `bun install` se colgó en un worktree de `.claude/worktrees/` (2026-11-18: 50 min en 15 paquetes; se enlazó el `node_modules` de un slot con el mismo `bun.lock`) | Que install-kit escriba LF; en kit-update, reusar `node_modules` de un slot con el mismo `bun.lock` o dejar la verificación al CI |
| 15 | 2026-11-18 | Hueco | 1 | UPDATES.md 3.24.0 / reference/scripts/qa-local.ts (rama Postgres) | La rama Postgres de `qa-local.ts` no asigna `ROLE_BY_ENV` (la de Supabase sí): `ADMIN_EMAILS` queda con los correos reales; al reemplazar el script se perdía el parche del proyecto | Añadir el bucle `ROLE_BY_ENV` tras el `Object.assign(env, …)` de la rama Postgres |
| 16 | 2026-11-19 | Fricción | 5 | orchestrate brief-template § reglas 6–7 (servidor y Playwright) | Con 3–4 slots en paralelo, la primera compilación de `next dev` tardó de 40 s a más de 5 min; `networkidle` y hasta `load` (fuentes de Google sin red) colgaron los scripts; un servidor colgado tras un corte siguió ocupando el puerto; rellenar el login antes de hidratar falla (W1, W2, W4) | En el brief: calentar rutas con `curl` antes de medir, `waitUntil: "commit"`/`"load"` con espera a un elemento y timeout largo, mirar el puerto con `Get-NetTCPConnection` y matar solo el proceso propio; un helper de login para `qa:local` |
| 17 | 2026-11-19 | Hueco | 1 | orchestrate §1 (¿se puede verificar?) | El prompt pidió ver la lista de métodos de pago en el navegador, pero el slot no tiene `PAY_*` ni base: sale "no habilitado" (W4, W3) | Al mapear, comprobar qué configura el `.env` del slot; si falta, pedir la verificación por test o en el preview del PR |
| 18 | 2026-11-19 | Fricción | 1 | scripts/pr-screenshots (`shots:publish`) | Publica en el README las capturas viejas de otras unidades que quedaron en `.pr-shots/`; hubo que filtrar a mano (W2) | Que `shots:publish` publique solo los estados del `.pr-shots.json` actual |
| 19 | 2026-11-19 | Prevención | 1 | reference/QA-PREVENTION.md | Barra de carga que abre con `popstate`: Chrome lo dispara en `#ancla` y en atrás/adelante el router ya cambió el pathname antes del listener; quedó pegada 10 s (QA tanda) | Cerrar comparando contra la URL comprometida (pathname+search) al abrir, nunca solo "cambió el pathname después" |
| 20 | 2026-11-19 | Prevención | 1 | reference/QA-PREVENTION.md | Barra de carga que solo escucha clics en `<a>`: `router.push` no la abre | Navegar con `<Link>` o envolver el router |
| 21 | 2026-11-19 | Prevención | 1 | reference/QA-PREVENTION.md | `scrollbar-gutter: stable` en `<html>` + overlay con scroll bloqueado deja una franja vacía junto a Drawer/backdrop | Quitar el gutter con un modal abierto o compensar el ancho |
| 22 | 2026-11-19 | Prevención | 1 | reference/QA-PREVENTION.md | Snackbar hermano de un Drawer/Dialog abierto queda bajo `aria-hidden` y no se anuncia | Mostrar el error de la acción dentro del modal mientras esté abierto |
| 23 | 2026-11-19 | Fricción | 1 | orchestrate §8 / scripts/run-on-main.sh | `run-on-main.sh` no sirve para repros que necesitan servidor: levantarlo dentro del comando se colgó >10 min; el FAIL se sacó revirtiendo archivos con `git checkout <sha> -- <paths>` | Opción `--serve <puerto>` que arranque y espere el dev de main, o documentar el truco |
| 24 | 2026-11-19 | Hueco | 1 | wave-qa (scripts de repro) | El repro buscaba rol `button`; el arreglo correcto lo volvió enlace y rompió el script por diseño | Los repros localizan por texto sin fijar el rol cuando el arreglo puede cambiarlo |
| 25 | 2026-11-19 | Fricción | 1 | git-flow (CI) | `gh pr checks --watch` pasa de 120 s y obliga a sondear | Indicar `timeout` ≥ 170 s o `run_in_background` |
| 26 | 2026-11-20 | Fricción | 1 | orchestrate brief-template (Verificar) | En Git Bash un heredoc sin comillas dentro de un `for`, con «», rompió el parseo del comando entero | Recomendar Write para archivos multilínea y no generar archivos dentro de bucles de shell |
| 27 | 2026-11-20 | Fricción | 1 | orchestrate brief-template (página temporal sin commitear) | Borrar la página temporal mientras corría typecheck dejó un TS6053 falso por `.next/types` | Borrar la página temporal antes del typecheck final y limpiar `.next/types` |
| 28 | 2026-11-20 | Bug | 1 | scripts/qa-local.ts (Postgres) | `docker start` falla con "socket no permitido" justo tras arrancar Docker Desktop, y la espera de 5 min no alcanza a un Postgres en recuperación de fsync | Reintentar `docker start` 2–3 veces y seguir esperando si el log dice "syncing data directory" / "starting up" |
| 29 | 2026-11-20 | Mejora | 1 | orchestrate §4 (Docker sí) | Docker Desktop estaba apagado y nadie lo dijo; arrancarlo y recuperar Postgres costó ~25 min al worker | El orquestador corre `docker version` antes de lanzar la unidad con Docker |
| 30 | 2026-11-20 | Mejora | 1 | backend-build / seed de QA | El seed local no trae pagos; cada QA del panel los inserta por SQL | Seed con pagos pendientes y confirmados |

## Enviarlo al kit

Cuando César lo pida (o al cerrar la fase 09): la skill **`kit-feedback`** (`/kit-feedback`).
Arma el informe con las filas sin enviar, agrupadas por pieza del kit y con lo más repetido
primero, y abre un PR en el repo del kit con la etiqueta `kit-feedback`. Las filas enviadas
se marcan con `→ PR <owner/repo#N>` en "Propuesta" (no se borran). Las marcadas
`→ informe <fecha>` cuentan como enviadas.
| 31 | 2026-11-20 | Fricción | 1 | UI-LIBRARIES.md › shadcn | El registro actual (radix-nova, new-york-v4) importa `cn` del paquete npm `cn` y lo añade a `package.json`; `aliases.utils` no lo redirige | Añadir la trampa y un test guard (`shadcn-config.test.ts`) al kit |
| 32 | 2026-11-20 | Hueco | 1 | UI-LIBRARIES.md › shadcn | `init` en v4 apunta a un `tailwind.config.ts` huérfano, mete `@layer base` y `.dark` y cambia a Geist | Ampliar la lista de "qué restaurar" tras `init` |
| 33 | 2026-11-20 | Hueco | 1 | STACK-NEXTJS.md › Tailwind | Con `--container-*` reseteado, `max-w-md` cae a `--spacing-md`; `--font-heading` de `next/font` choca con la clave de tema (se resuelve con `@theme inline reference`, que Biome 2.4 no parsea) | Documentar las tres cosas |
| 34 | 2026-11-20 | Fricción | 1 | entorno Windows | `bunx shadcn@latest` se colgó dos veces | `bun add -d shadcn` y `node node_modules/shadcn/dist/index.js` |
| 35 | 2026-11-20 | Fricción | 1 | orchestrate §4 (IDs) | D108–D110 chocó con #56, mergeado mientras corría la ola | Reservar contra `origin/main` y los PRs abiertos justo antes de lanzar |
