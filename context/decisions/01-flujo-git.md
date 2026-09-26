# Decisiones — Flujo de trabajo y git

## D068 — Modo git `pr`
**Decisión:** cada unidad sale de `main` en su rama, se empuja y abre un PR que César revisa y mergea. Reemplaza el modo `local` (merge `--no-ff` sin push) usado hasta los pagos.
**Por qué:** el repo ya está en GitHub, hay deploy desde ramas y el primer PR (#1) ya siguió este flujo.
**Alternativa descartada:** seguir en `local` — el trabajo quedaba sin subir (origin/main iba 20 commits atrás).
**Estado:** Implementado (falta proteger `main` en GitHub)

## D069 — Versión con Changesets
**Decisión:** versión con Changesets; PR de versión lo abre la Action y lo mergea César. Ningún PR toca `version` ni `CHANGELOG.md`; cada cambio visible trae `.changeset/<desc>.md`.
**Por qué:** subir `version`/CHANGELOG en cada PR choca cuando hay PRs en paralelo. El proyecto no llevaba versión (0.1.0 desde el arranque); se adopta ahora que hay producción.
**Alternativa descartada:** sin versión — no quedaría registro de qué salió en cada release.
**Estado:** Implementado (falta el permiso de Actions en GitHub)

## D070 — Pool de worktrees reciclables para `orchestrate`
**Decisión:** las tandas en paralelo usan slots fijos `..\maranatha-wt\wt1..wtN` gestionados por `wt.ps1` (con `node_modules` y `.env*` ya puestos), en vez de crear y borrar un worktree por unidad.
**Por qué:** instalar dependencias en cada worktree nuevo era lo más lento de una tanda.
**Estado:** Implementado en el kit; el pool se crea (`wt init`) la primera vez que se lance una tanda

## D076 — Biome como puerta de lint y CI del kit
**Decisión:** el código se formatea con Biome (`biome check --write`), se corrigen los 9 errores de reglas y se añade `.github/workflows/ci.yml` (typecheck, lint, test, build en cada PR y en `main`). `.gitattributes` fija `* text=auto eol=lf` para que las copias con `core.autocrlf=true` no queden en CRLF.
**Por qué:** `bun run lint` fallaba en `main` (145 errores en un checkout LF, más con CRLF); sin lint en verde el CI dejaba todos los PRs en rojo.
**Detalle:** `JsonLd` y la cookie `color-mode` llevan `biome-ignore` justificado; el build no necesita variables, así que el CI no lleva env de relleno.
**Estado:** Implementado (`style/biome-format`)
