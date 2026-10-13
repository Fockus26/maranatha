# D076 · CI · Formato Biome + eol=lf + CI del kit (typecheck, lint, test, build) · Implementado

**Decisión:** el código se formatea con Biome (`biome check --write`), se corrigen los 9 errores de reglas y se añade `.github/workflows/ci.yml` (typecheck, lint, test, build en cada PR y en `main`). `.gitattributes` fija `* text=auto eol=lf` para que las copias con `core.autocrlf=true` no queden en CRLF.
**Por qué:** `bun run lint` fallaba en `main` (145 errores en un checkout LF, más con CRLF); sin lint en verde el CI dejaba todos los PRs en rojo.
**Detalle:** `JsonLd` y la cookie `color-mode` llevan `biome-ignore` justificado; el build no necesita variables, así que el CI no lleva env de relleno.
**Nota de estado:** Implementado (`style/biome-format`)
