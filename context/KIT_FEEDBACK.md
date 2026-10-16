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

## Enviarlo al kit

Cuando César lo pida (o al cerrar la fase 09): la skill **`kit-feedback`** (`/kit-feedback`).
Arma el informe con las filas sin enviar, agrupadas por pieza del kit y con lo más repetido
primero, y abre un PR en el repo del kit con la etiqueta `kit-feedback`. Las filas enviadas
se marcan con `→ PR <owner/repo#N>` en "Propuesta" (no se borran). Las marcadas
`→ informe <fecha>` cuentan como enviadas.
