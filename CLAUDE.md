@AGENTS.md

# Iglesia Maranatha

Sitio de la Iglesia Maranatha: reuniones, liderazgo, prédicas, proyectos, y diezmos y aportes
en línea (pagos manuales + PayPal) con un panel privado para aprobarlos.

**Tipo:** sitio + app (dashboard) · **Cliente:** Iglesia Maranatha
**Track de fases:** Producto · **Modo git:** pr (ver `context/GIT_STATE.md`)
**Kit:** web-agent-kit, versión en `.kit-version` (se actualiza con `prompts/ACTUALIZAR-KIT.md` del kit) ·
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

---

## Stack

- Next.js 16 (App Router) + **TypeScript** estricto + React Compiler
- **Librería de componentes:** MUI 9 · **Estilos:** `sx` de MUI con los tokens de `theme/` — uno solo
  (Tailwind está instalado pero no se usa para estilos nuevos)
- **bun** para todo — nunca npm, yarn ni pnpm
- Supabase (Postgres + Auth del dashboard) · PayPal (único y mensual) + métodos manuales · DolarApi (tasas)
- Deploy: Vercel = pruebas (rama `vercel`) · VPS Hetzner con Docker = producción (rama `vps`)

```bash
bun install
bun run build
bun run typecheck             # next typegen && tsc --noEmit
bun run lint                  # Biome (hoy falla por formato heredado: ver CURRENT_PHASE)
bun run test:related         # mientras trabajas: solo los tests afectados
bun run test                 # antes del PR: toda la suite
bun run shots                # capturas para el PR (node + Playwright)
bun run shots:publish        # las sube a la rama pr-shots e imprime el markdown
bun run a11y                 # axe-core sobre el sitio corriendo
```

**Servidor de desarrollo:** lo levanta César. Excepciones: los agentes de QA (`wave-qa`,
`functional-qa`) siempre, y los workers si César lo autoriza para una tanda (cada uno en su
puerto, en segundo plano). Build, typecheck, lint y tests sí se corren sin preguntar.

**QA contra base local:** `bun run qa:local -- --port <p>` levanta Supabase en Docker
(migraciones + seed), crea las cuentas de `.env.test.local` (`ADMIN_EMAIL_TEST`/`ADMIN_PASSWORD_TEST`)
y arranca el servidor apuntando a lo local, con `ADMIN_EMAILS` = esas cuentas. Nunca contra la base real.

**Scripts con Playwright se corren con `node`, no con `bun`:** en Windows, Playwright bajo
Bun se cuelga al lanzar Chromium.

**Documentación:** Context7 antes de usar la API de cualquier librería. Para Next, además,
`node_modules/next/dist/docs/` (ver `AGENTS.md`).

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
- **Versión:** nadie toca `version` ni `CHANGELOG.md`. Cambio visible → `.changeset/<desc>.md`
  (`git-flow` §2.1.3). El PR `chore(release): versión` lo abre la Action y lo mergea César.
- **Ramas de deploy** `vercel` y `vps`: nadie commitea en ellas; César las avanza
  (`main → vercel → vps`, ver `deploy/README.md`).
- Nada destructivo: ni `reset --hard`, ni `push --force`, ni reescribir historia, ni borrar ramas.

### Qué va al repo y qué es local

En git: `context/` fijo — PROJECT_CONTEXT, DESIGN_RULES, COLORS, DESIGN_TOKENS, TYPOGRAPHY,
decisions/, GIT_STATE — más `phases/` y `deploy/`.
Local (gitignored): `context/` CURRENT_PHASE, CONTENT_CHECKLIST, KIT_FEEDBACK, `*_INVENTORY`, PHASE_LOG/,
plans/, y `.env*`.
Los slots del pool de worktrees (`orchestrate`, `..\maranatha-wt\wtN`) traen los `.env*`
copiados, pero **no** `context/` local: se lee en la carpeta principal
(`C:\Users\Admin\Documents\Work\maranatha`). Un subagente en un slot puede no tener permiso de
escritura ahí: entonces los devuelve en su informe y el orquestador los copia.

### Puertas de calidad

| Skill / agente | Cuándo |
|---|---|
| `a11y` | Siempre que se toque UI, antes de pedir revisión |
| `seo` | Cierre de sección con contenido · cierre de página |
| `git-flow` | Al abrir y al cerrar cada unidad |
| `orchestrate` | Llega una lista, o una fase se hace en olas (una ola por sesión) |
| `wave-qa` | Lo lanza `orchestrate` con la ola mergeada, antes de cerrarla |
| `design-qa` / `functional-qa` | Al cerrar una página / un flujo completo |

---

## Reglas no negociables

- **Cero valores mágicos.** Todo color, espaciado, radio y tamaño sale de `theme/tokens.ts`.
- **Cero secretos en el código.** Variables de entorno, `.env.example` sin valores reales.
  Lo secreto (Supabase secret, PayPal, `PAY_*`) nunca con prefijo `NEXT_PUBLIC_`.
- **Cero contenido inventado.** Placeholder marcado + fila en `context/CONTENT_CHECKLIST.md`.
- **Cero lorem ipsum.** Placeholder realista, en español, con la longitud del texto final.
- **WCAG 2.1 AA** mínimo: 4.5:1 texto, foco visible, ningún estado solo por color, sin
  scroll horizontal a 320 px.
- **MUI antes que reimplementar** un primitivo.
- **Pagos:** todo lo que llega del cliente se revalida en el servidor (`app/actions/`); la
  clave secreta de Supabase solo en código `server-only` (`lib/supabase/admin.ts`).
- **Migraciones SQL** en `supabase/migrations/` numeradas; aplicarlas es acción manual de César
  (se anota en el PR).

## Cuándo parar y preguntar

- Decisión visual nueva → 3 opciones con ventaja y desventaja real, y se espera.
  (Un worker en segundo plano no puede esperar: elige lo conservador y lo explica en el PR.)
- Algo rompe una regla de accesibilidad → gana la regla, se escala.
- Problema en código ya cerrado → se reporta, no se arregla dentro de la unidad actual.
- Archivo sin uso → se señala, **no se borra**.
- César corrige algo hecho según el kit, pide lo mismo dos veces o el kit no dice qué hacer →
  fila en `context/KIT_FEEDBACK.md` (o +1 en "Veces"), sin preguntar; el informe sigue su formato.

---

## Contexto del proyecto

**Público:** miembros de la iglesia y visitantes · **Acción principal:** conocer las reuniones
y aportar (diezmo / proyectos) · **Idioma:** español (es-VE)

**Particularidades:**
- Monedas: USD, USDT, VES y COP; la conversión usa DolarApi con tasa de respaldo en Supabase.
- `ADMIN_HOST` (opcional) sirve el dashboard desde un subdominio (`proxy.ts`).
- Vercel no se indexa (`SITE_INDEXABLE` en `lib/siteConfig.ts`); solo producción.
