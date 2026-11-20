# Orquestación del 2026-11-10 — brief compartido para los workers

> Tanda suelta (fase 08–09, pulido), una sola ola de 4 unidades en paralelo.

> **Todo worker** lee esto antes de empezar. Su prompt trae solo lo propio de su unidad.
> Carpeta principal del repo: `C:\Users\Cesar\Documents\Work\maranatha` (ahí viven los
> archivos locales/ignorados: `context/CURRENT_PHASE.md`, `context/CONTENT_CHECKLIST.md`,
> `context/PHASE_LOG/`, `context/plans/`, `.env*`). Su `context/` es
> `C:\Users\Cesar\Documents\Work\maranatha\context`: siempre esa ruta absoluta.
>
> **Datos del proyecto:** test runner `bun:test` (`bun test ./tests/unit`; tests en
> `tests/unit/`, con `bun:test`, nunca vitest) · linter `bunx biome check <archivos>`
> (el lint global falla por formato heredado: solo cuenta que TUS archivos queden limpios)
> · UI: **MUI 9 + `sx` con tokens de `theme/tokens.ts`** (Tailwind instalado pero no se usa)
> · animación: `framer-motion` 13 (ya instalado) · la `reference/…` del kit en
> `~/.claude/kit-reference/`.

## Unidades y orden

| # | Rama | Qué | Ola |
|---|---|---|---|
| W1 | `fix/instagram-visor` | Botón Seguir, modal de Instagram (X, CTA, rueda horizontal, calidad, aspect ratio) | 1 |
| W2 | `style/anillo-foco` | Anillo de foco de teclado y foco de inputs | 1 |
| W3 | `feat/animaciones-listas` | Transición al paso de pago en modales, animación de listas de pagos y tabla de proyectos | 1 |
| W4 | `feat/selector-hora` | Selector de hora custom en la agenda del dashboard | 1 |

Slot y puerto: los asigna `wt take` y los repite el mensaje que lanza a cada worker.
Archivos disjuntos: **solo W2 toca `app/globals.css` y `theme/theme.ts`**. Si otra
unidad necesita algo global, lo resuelve en su componente con `sx`.

## Números reservados

| Unidad | IDs de decisión | Filas `CONTENT_CHECKLIST` | Códigos de error |
|---|---|---|---|
| W1 | D083–D084 | ninguna | ninguno |
| W2 | D085–D086 | ninguna | ninguno |
| W3 | D087–D088 | ninguna | ninguno |
| W4 | D089–D090 | ninguna | ninguno |

## Formas compartidas

Ninguna.

## Decisiones de César para esta tanda

- Cada worker puede levantar su servidor de desarrollo en el puerto de su slot.
- Anillo de foco: naranja (`secondary[500]`) 2px, offset 2px, **que sigue la forma de cada
  control** (sin radio forzado), sin el ripple pulsante de foco de MUI.
- Foco de inputs: sin outline exterior; el borde del propio campo pasa a naranja 2px.
- Selector de hora: Popper con columnas hora/minuto (saltos de 5) + a. m./p. m., mismo
  patrón y estilo que `components/ui/DateField.tsx` (D062).
- Sin Docker, sin base de datos, sin migraciones en ninguna unidad.

## Simular el backend

- Script de mocks compartido: ninguno (no hace falta para W1, W2).
- W3/W4 tocan pantallas del dashboard que exigen sesión: verifica por código, tests y,
  si quieres ver el componente, una ruta o test aislado; **no** inicies sesión contra la
  base real. El QA con sesión lo hace `wave-qa` al cerrar la ola.
- Estado a saltar: ninguno.

Nada del `.qa/` de otro slot.

## Reglas de la tanda (además de `CLAUDE.md`)

1. **Lee solo** `CLAUDE.md`, lo que cita tu prompt y, con `grep`, lo demás.
2. **Slot y rama:** trabajas SOLO en la ruta de tu slot (`..\maranatha-wt\wtN`), con tu
   rama ya creada, `node_modules` instalado y los `.env*` copiados. No crees ni borres
   worktrees, no corras `wt`, no cambies de rama.
3. **Archivos locales compartidos:** no edites `CURRENT_PHASE.md` ni `CONTENT_CHECKLIST.md`.
   Escribe `context/PHASE_LOG/<tu-rama-con-guiones>.md` en la carpeta principal; si no
   puedes escribir ahí, entrégalo entero en tu informe.
4. **Decisiones:** un archivo por decisión, `context/decisions/D0NN-<tema>.md`, con IDs de
   tu rango y el encabezado de una línea (formato en `context/decisions/README.md`). Va en git.
5. **Changeset:** el bump que dice tu prompt, en `.changeset/<desc-kebab>.md` a mano, texto
   en español para el usuario. No toques `version` ni `CHANGELOG.md`.
6. **Servidor:** autorizado: `bun run dev -- --port <puerto de tu slot> > .qa/dev.log 2>&1`
   en segundo plano, en tu slot. Si el puerto está ocupado no arranques en otro; dilo.
   Apágalo matando **tu** proceso y sus hijos (`taskkill /PID <pid> /T /F`). Espera la
   línea `Ready in` en el log. El disco de esta máquina es lento: la primera compilación
   de una ruta puede tardar más de un minuto; pide la ruta una vez con
   `curl -s -o /dev/null` antes de medir. Si sale "Node.js subprocess crashed … deadline
   has elapsed": apágalo, borra `.next/dev` y reinícialo. Tras apagarlo, comprueba que el
   puerto quedó libre antes del build.
7. **Navegador:** crea tu propia pestaña y pasa su `tabId` en cada llamada. Verifica
   midiendo el DOM (`getComputedStyle`, `getBoundingClientRect`), no mirando capturas.
   Scripts de Playwright con `node`, guardados en `.qa/` de tu slot. Guardas de Playwright
   contra el build de producción (`bun run build` + `bun run start -- --port <puerto>`),
   `waitUntil: 'load'` + espera de un elemento. Git Bash reescribe rutas: prefija con
   `MSYS_NO_PATHCONV=1` o usa pwsh.
8. **Datos reales:** `.env` apunta a producción. No inicies sesión, no crees cuentas, no
   escribas datos. En el PR, "Cómo probar" dice qué flujo y qué rol, para `wave-qa`.
9. **Tests:** `bun run test:related` mientras trabajas. Antes del PR, la suite completa
   **sola**: `mkdir -p .qa && bun run test > .qa/test.log 2>&1` en segundo plano y lee el
   resumen. Un test que solo se pasa de tiempo en la suite con otros slots ocupados es carga:
   córrelo solo y dilo. Ojo con `tests/unit/tokens.test.ts` (prohíbe valores mágicos/hex en
   componentes, incluso en comentarios): córrelo si tocas estilos.
10. **Archivos:** con Write/Edit; abre con Read lo que vas a editar. Nada de heredocs largos
    ni `node -e` con comillas. Scripts a `.qa/<nombre>.mjs`. Formatea
    (`bunx biome check --write <archivos>`) una vez al cerrar cada etapa, solo tus archivos.
11. **Esperas y búsquedas:** `sleep` está bloqueado; lo que tarde > 2 min va en segundo
    plano. Busca con `git grep -n <patrón> -- <rutas>`.
12. **Commit al cerrar cada etapa**, y `wip:` cada ~20 min en etapas largas, con dos líneas
    en `.qa/progress.md` (hecho / sigue).
13. **Verificación mínima antes del PR:** `bun run typecheck`, biome sobre tus archivos,
    tests; build solo si tocaste `next.config` o dependencias; `git diff --cached --stat`
    antes de cada commit; si tocaste UI, la skill `a11y` (axe claro y oscuro, 320 px,
    teclado). No añadas dependencias.
14. **Capturas:** si cambió algo visible, reescribe `.pr-shots.json` con tus estados,
    `bun run shots` y luego `bun run shots:publish` en segundo plano (dos comandos). Pega
    el markdown de `.pr-shots/README.md` en el PR. Estados con sesión: no los captures,
    descríbelos.
15. **Sin poder preguntar:** opción conservadora + "Decisión tomada / alternativa" en el PR.
16. **Arregla la clase en la primera pasada:** si lo que arreglas tiene la misma forma en
    otro lado (mismo botón outlined gris, misma lista sin animar), búscalo con `git grep` en
    `app/` y `components/` y arréglalo **si cae dentro del tema de tu unidad y no en
    archivos de otra unidad** (ver tabla). Lo que veas después del PR, "visto de paso" en
    el informe. **Prevenir lo de siempre:** `prefers-reduced-motion` respetado en toda
    animación nueva (`useReducedMotion` de framer-motion, como ya hace
    `InstagramPostDialog.tsx:163`); ningún estado solo por color; contraste 4.5:1 en texto
    y 3:1 en bordes de controles, claro **y** oscuro (pon los pares calculados en el PR);
    sin scroll horizontal a 320 px; áreas táctiles ≥ 44 px.
17. **Copy nuevo:** ninguna unidad trae copy provisional.
18. **Cierre:** commits convencionales (solo tus archivos) en español, push de tu rama,
    `gh pr create --base main --body-file .qa/pr-body.md` (cuerpo escrito con Write, PR en
    español, termina con la línea de atribución de Claude Code). Slot limpio al terminar.
    **Nunca** `gh pr merge`, push a `main`, force-push ni amend de lo empujado.
19. **Informe final** (breve): URL del PR, slot, changeset, verificado / no verificado,
    decisiones abiertas, acciones manuales, bugs vistos de paso, y tu PHASE_LOG si no
    pudiste escribirlo.
