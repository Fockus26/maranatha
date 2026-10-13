# D070 · Git · Pool de worktrees reciclables para orchestrate · Implementado

**Decisión:** las tandas en paralelo usan slots fijos `..\maranatha-wt\wt1..wtN` gestionados por `wt.ps1` (con `node_modules` y `.env*` ya puestos), en vez de crear y borrar un worktree por unidad.
**Por qué:** instalar dependencias en cada worktree nuevo era lo más lento de una tanda.
**Nota de estado:** Implementado en el kit; el pool se crea (`wt init`) la primera vez que se lance una tanda
