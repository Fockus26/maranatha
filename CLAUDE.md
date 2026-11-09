@AGENTS.md

# Iglesia Maranatha

Sitio de la Iglesia Maranatha: reuniones, liderazgo, prédicas, proyectos, y diezmos y aportes
en línea (pagos manuales + PayPal) con un panel privado para aprobarlos.

**Tipo:** sitio + app (dashboard) · **Cliente:** Iglesia Maranatha
**Track de fases:** Producto · **Modo git:** pr (ver `context/GIT_STATE.md`)
**Kit:** web-agent-kit, versión en `.kit-version` (se actualiza con `/kit-update`) ·
**Despliegue:** hoy solo Vercel (rama `vercel`); el VPS (rama `vps`) está previsto, sin uso aún

---

## Qué leer — por niveles, no todo

**Siempre:** este archivo + `context/CURRENT_PHASE.md` (una pantalla: qué está abierto y qué bloquea).

**Según la tarea** — solo la fila que aplica:

| Si la tarea… | Lee además |
|---|---|
| toca UI (componente, sección, página, estilos) | `context/DESIGN_RULES.md`, y `COLORS.md` / `DESIGN_TOKENS.md` / `TYPOGRAPHY.md` solo si toca color, espaciado o tipo |
| toca datos, auth, pagos o API | `context/PROJECT_CONTEXT.md` › Stack técnico, y `lib/payments/` |
| toca el deploy (Vercel, VPS, Docker) | `deploy/README.md` y `context/decisions/D071-*.md` a `D073-*.md` |
| abre o cierra una unidad | skill `git-flow` + `context/GIT_STATE.md` |
| llega con un prompt de orquestador | **solo** lo que el prompt cite: ya trae rutas, líneas y decisiones |

**Buscar, no leer:** `decisions/` (un archivo por decisión), `CONTENT_CHECKLIST.md`, inventarios, `PHASE_LOG/`.
Se hace `grep` por la palabra o el ID y se abre solo lo que sale:

```bash
grep -rhi "^# D.*modal" context/decisions/            # ¿ya se decidió algo sobre esto? No lo re-litigues
grep -n "ProjectCard" context/COMPONENTS_INVENTORY.md # ¿existe ya?
```

Los comentarios del código citan decisiones por ID (`D023`, `D067`…): `ls context/decisions/D023-*`.
Las agrupadas (D037/D038/D039) viven en el archivo del último ID: `grep -rl "D038" context/decisions/`.

**El `reference/…` del kit** = `~/.claude/kit-reference/…` (o `.claude/kit-reference/…`).
**Tech refs:** vps-postgres, migrate-supabase-vps (hasta cerrar el corte, D082), vercel, other-hosting → su `tech/<nombre>.md` cuando la tarea lo toque; solo esas.

---

## Stack

- Next.js 16 (App Router) + **TypeScript** estricto + React Compiler
- **Librería de componentes:** MUI 9 · **Estilos:** `sx` de MUI con los tokens de `theme/` — uno solo
  (Tailwind está instalado pero no se usa para estilos nuevos)
- **bun** para todo — nunca npm, yarn ni pnpm
- Postgres del VPS con Drizzle (`lib/db/`) + Better Auth del dashboard + correo por Brevo SMTP (D082) · PayPal (único y mensual) + métodos manuales · DolarApi (tasas)
- Deploy: Vercel = pruebas (rama `vercel`) · VPS Hetzner con Docker = producción (rama `vps`)

```bash
bun run build · typecheck · lint    # lint: Biome (hoy falla por formato heredado)
bun run test:related         # mientras trabajas; `bun run test` (toda la suite) antes del PR
bun run shots                # capturas del PR; luego `shots:publish` → .pr-shots/README.md
bun run a11y                 # axe-core sobre el sitio corriendo
```

**Servidor de desarrollo:** lo levanta César. Excepciones: los agentes de QA (`wave-qa`,
`functional-qa`), y los workers si César lo autoriza (cada uno en su puerto, en segundo plano). Build, typecheck, lint y tests sí se corren sin preguntar.

**QA:** `bun run qa:local -- --port <p>` — Postgres + Mailpit en Docker con las cuentas de
`.env.test.local` (las escribes tú; nunca le pidas a César iniciar sesión para QA;
`ADMIN_EMAILS` = esas cuentas); nunca la base real. Playwright con `node` (Bun se cuelga en
Windows), en `.qa/`. **QA: al final** (sin `wave-qa` en las olas).

**Docs:** Context7 antes de la API de una librería (Next: también `node_modules/next/dist/docs/`,
ver `AGENTS.md`). **Modelo por tarea:** `Modelo recomendado: <modelo · esfuerzo>` antes de cada
una (kit `TOKEN-ECONOMY.md` §12; riesgo → `opus`), ambos pasados a `Agent(...)`.

---

## Cómo se trabaja aquí

Una unidad a la vez (un componente, una sección, una pantalla, un flujo, un fix acotado):
algo que se revisa en dos minutos. Una unidad = una rama = un PR.

```
[git-flow: abrir]  →  implementar  →  test:related  →  [a11y]  →  [seo si aplica]
   →  build + typecheck + lint + test  →  capturas (si cambió la UI)
   →  podar context/  →  [git-flow: cerrar → PR]
```

- **Modo `pr`:** en tu rama puedes commitear y empujar sin pedir permiso — la aprobación de
  César es la revisión del PR. **Nunca** push a `main`, nunca `gh pr merge`, nunca auto-merge.
- **Sesión en la nube** (`CLAUDE_CODE_REMOTE=true`): skill `cloud-session` al inicio y al cierre;
  anula la regla de arriba (cada unidad termina mergeada: PR + CI verde).
- **Versión:** nadie toca `version` ni `CHANGELOG.md`. Cambio visible → `.changeset/<desc>.md`
  (`git-flow` §2.1.3). El PR `chore(release): versión` lo abre la Action y lo mergea César.
- **Ramas de deploy** `vercel` y `vps`: nadie commitea en ellas; César las avanza
  (`main → vercel → vps`, ver `deploy/README.md`).
- Nada destructivo: ni `reset --hard`, ni `push --force`, ni reescribir historia, ni borrar ramas.

### Qué va al repo y qué es local

En git: `context/` fijo — PROJECT_CONTEXT, DESIGN_RULES, COLORS, DESIGN_TOKENS, TYPOGRAPHY,
decisions/, GIT_STATE — más `phases/` y `deploy/`.
Local: `context/` CURRENT_PHASE, CONTENT_CHECKLIST, KIT_FEEDBACK, `*_INVENTORY`, PHASE_LOG/,
plans/ (respaldo: `bun run context:backup`). `.env.local` se baja de Vercel, no a mano.
Los worktrees (slots del pool, `.claude/worktrees/`) traen los `.env*`, pero **no** `context/`
local: vive en la carpeta principal (primera línea de `git worktree list`); sin permiso de
escritura ahí, devuelve los cambios de `context/` en tu informe.

### Puertas de calidad

`a11y` siempre que se toque UI · `seo` al cerrar una sección o página con contenido ·
`git-flow` al abrir y cerrar cada unidad · `orchestrate` para una lista o una fase en olas ·
`wave-qa` tras una ola con flujos de riesgo · `functional-qa` al cerrar un flujo de riesgo y en
el QA de versión · `design-qa` solo en el QA de versión (fase 09 / PR de release).

---

## Reglas no negociables

- **Cero valores mágicos.** Todo color, espaciado, radio y tamaño sale de `theme/tokens.ts`.
- **Cero secretos en el código.** Variables de entorno, `.env.example` sin valores reales.
  Lo secreto (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `SMTP_*`, PayPal, `PAY_*`) nunca con prefijo `NEXT_PUBLIC_`.
- **Cero contenido inventado.** Placeholder marcado + fila en `context/CONTENT_CHECKLIST.md`.
- **Cero lorem ipsum.** Placeholder realista, en español, con la longitud del texto final.
- **WCAG 2.1 AA** mínimo: 4.5:1 texto, foco visible, ningún estado solo por color, sin
  scroll horizontal a 320 px.
- **MUI antes que reimplementar** un primitivo.
- **Pagos:** todo lo que llega del cliente se revalida en el servidor (`app/actions/`); la
  base solo desde código `server-only` (`lib/db/`), y cada acción de admin con `getAdminStrict()`.
- **Migraciones** en `drizzle/` (`bun run db:generate`; SQL a mano con `drizzle-kit generate --custom`). `supabase/migrations/` es historial, ya no se toca. Aplicarlas en preview y producción es acción manual de César
  (se anota en el PR).

## Cuándo parar y preguntar

- Decisión visual nueva → 3 opciones con ventaja y desventaja real, y se espera.
  (Un worker en segundo plano elige lo conservador y lo explica en el PR.)
- Algo rompe una regla de accesibilidad → gana la regla, se escala.
- Problema en código ya cerrado → se reporta, no se arregla dentro de la unidad actual.
- Archivo sin uso → se señala, **no se borra**.
- César corrige algo hecho según el kit, pide lo mismo dos veces o el kit no dice qué hacer →
  fila en `context/KIT_FEEDBACK.md` (o +1 en "Veces"), sin preguntar. Va al kit con `/kit-feedback`.

---

## Contexto del proyecto

**Público:** miembros de la iglesia y visitantes · **Acción principal:** conocer las reuniones
y aportar (diezmo / proyectos) · **Idioma:** español (es-VE)

**Particularidades:**
- Monedas: USD, USDT, VES y COP; la conversión usa DolarApi con tasa de respaldo en la base (`settings`).
- `ADMIN_HOST` (opcional) sirve el dashboard desde un subdominio (`proxy.ts`).
- Vercel no se indexa (`SITE_INDEXABLE` en `lib/siteConfig.ts`); solo producción.
