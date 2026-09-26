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

## D076 — CI del kit pospuesto hasta formatear el código
**Decisión:** `.github/workflows/ci.yml` no se añade todavía.
**Por qué:** `bun run lint` falla en `main` con 145 errores de Biome (136 de formato + 9 de reglas) incluso en un checkout LF; el CI dejaría todos los PRs en rojo.
**Estado:** Pendiente — un PR aparte formatea, corrige los 9 errores y añade el CI
