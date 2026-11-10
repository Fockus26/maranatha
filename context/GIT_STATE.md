# Git State — Iglesia Maranatha

> Fuente de verdad de "¿cómo y a dónde se entrega esta unidad?". La skill `git-flow` lo lee
> antes de crear cualquier rama. **Nunca deduzcas la base de `git branch --show-current`.**

## Modo

**`pr`**

| Modo | Cuándo | Cierre de una unidad |
|---|---|---|
| `pr` | Hay remoto y `main` protegida (lo normal en cuanto el repo está en GitHub) | commit(s) en la rama → push de la rama → `gh pr create` → **César revisa y mergea** (squash) |
| `local` | Sin remoto, o César lo prefiere | pausa de aprobación → commit → merge `--no-ff` a la base → push solo si la base ≠ `main` |

En modo `pr` el estado de las ramas es `gh pr list`: no hay tabla que mantener.

## Rama base de la próxima unidad

`main`

## Deploy

No hay ramas de deploy (D091): Vercel publica `main` en cada merge. El deploy al VPS
queda manual (Actions › Deploy VPS › Run workflow) hasta que se defina el cambio de
hosting. Detalle en `deploy/README.md`.

<!-- No se borran ramas mergeadas: borrar es destructivo y lo decide César. -->
