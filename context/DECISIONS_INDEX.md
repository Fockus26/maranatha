# Decisions Index — Iglesia Maranatha

> **Se busca, no se lee entero:** `grep -n "palabra" context/DECISIONS_INDEX.md`.
> Cada fila es **una línea ≤ 160 caracteres** que apunta al archivo de `decisions/` donde
> vive el detalle. D001–D067 están reconstruidas desde los comentarios del código.

| ID | Categoría | Resumen | Archivo | Estado |
|---|---|---|---|---|
| D007 | Páginas | Proyectos (e Historia, luego retirada) como páginas propias | `decisions/00-historico.md` | Implementado |
| D011 | Color | Naranja `contained` reservado a CTAs de alta prioridad | `decisions/00-historico.md` | Implementado |
| D012 | Imagen | Overlay navy en degradado para texto sobre foto | `decisions/00-historico.md` | Implementado |
| D013 | Componentes | SocialLinkCard base (con borde y fondo) | `decisions/00-historico.md` | Implementado |
| D014 | Componentes | AgendaItem pensado para dashboard (hoy sin uso) | `decisions/00-historico.md` | Implementado |
| D015 | Componentes | TimelineItem para la línea de tiempo | `decisions/00-historico.md` | Implementado |
| D016 | Componentes | ProjectCard con layout vertical y horizontal; lista/cuadrícula en /proyectos | `decisions/00-historico.md` | Implementado |
| D018 | Diezmo | TitheForm solo recolecta datos por onSubmit (con D019) | `decisions/00-historico.md` | Obsoleta → D074 |
| D020 | Proyectos | Aporte a proyecto en modal con ProjectContributionForm | `decisions/00-historico.md` | Implementado |
| D022 | Dashboard | DashboardTable para la lista de proyectos | `decisions/00-historico.md` | Implementado |
| D023 | Navegación | navItems fuente única; Navbar con scroll-spy; PageNavbar; píldora activa | `decisions/00-historico.md` | Implementado |
| D024 | Dashboard | Sidebar navy fijo | `decisions/00-historico.md` | Reemplazado por topbar |
| D025 | Tema | Piezas navy fijas que no siguen claro/oscuro (dashboard, menú móvil; con D026) | `decisions/00-historico.md` | Implementado |
| D028 | Movimiento | Parallax del Hero (reutilizado en PhotoAnchorBand) | `decisions/00-historico.md` | Implementado |
| D029 | Secciones | Heading de Áreas de Servicio simple centrado | `decisions/00-historico.md` | Implementado |
| D030 | Código | Una sección = un archivo con componente y datos | `decisions/00-historico.md` | Implementado |
| D031 | Contenido | Foto de Carlos Medina reutilizada en la card Jóvenes | `decisions/00-historico.md` | Implementado |
| D032 | Secciones | Heading izquierda/centrado común en Home | `decisions/00-historico.md` | Implementado |
| D035 | Redes | Tres cuentas de Instagram con selector y panel (con D036) | `decisions/00-historico.md` | Implementado |
| D039 | Agenda | Agenda en mosaico; hover de D037 (D038 obsoleta) | `decisions/00-historico.md` | Implementado |
| D041 | Proyectos | Home y /proyectos comparten `lib/projectsData.ts` | `decisions/00-historico.md` | Implementado |
| D043 | Historia | TimelineZigzagItem para /historia (página retirada, componente sin uso) | `decisions/00-historico.md` | Obsoleta |
| D044 | Páginas | /proyectos y /proyectos/[slug] | `decisions/00-historico.md` | Implementado |
| D045 | Dashboard | Proyectos del dashboard en memoria, sin backend | `decisions/00-historico.md` | Implementado (pend. persistir) |
| D048 | Visual | Fondo con patrón geométrico en pan continuo | `decisions/00-historico.md` | Implementado |
| D049 | Modales | Modales globales montados en layout + store (con D059) | `decisions/00-historico.md` | Implementado |
| D051 | Color | Activo en `secondary[700]`; píldora del navbar (con D054) | `decisions/00-historico.md` | Implementado |
| D052 | Dashboard | No animar filas `<tr>` de DashboardTable | `decisions/00-historico.md` | Implementado |
| D053 | Tema | Modo claro/oscuro con toggle + cookie | `decisions/00-historico.md` | Implementado |
| D055 | Layout | Transición de página y topbar del dashboard (con D056) | `decisions/00-historico.md` | Implementado |
| D057 | Modales | Sin overlay blanco de MUI en modales oscuros (con D058) | `decisions/00-historico.md` | Implementado |
| D062 | Formularios | DateField con calendario propio, sin @mui/x-date-pickers | `decisions/00-historico.md` | Implementado |
| D065 | Dashboard | Modal de proyecto fullScreen en móvil, dialog en desktop (D060/D061/D064) | `decisions/00-historico.md` | Implementado |
| D067 | Estados | Skeletons, EmptyState, errores bajo campo, transición de tema | `decisions/00-historico.md` | Implementado |
| D068 | Git | Modo `pr`: rama por unidad, PR que César revisa y mergea | `decisions/01-flujo-git.md` | Implementado |
| D069 | Git | Versión con Changesets; PR de versión lo abre la Action y lo mergea César | `decisions/01-flujo-git.md` | Implementado |
| D070 | Git | Pool de worktrees reciclables para orchestrate | `decisions/01-flujo-git.md` | Implementado |
| D071 | Deploy | Vercel = staging (rama vercel), VPS = producción (rama vps), mismo código | `decisions/02-deploy.md` | Implementado |
| D072 | Deploy | Docker standalone + Caddy + GHCR vía Actions, sin token personal | `decisions/02-deploy.md` | Implementado |
| D073 | SEO | Staging (Vercel) no indexable | `decisions/02-deploy.md` | Implementado |
| D074 | Pagos | Pasarela híbrida: métodos manuales con comprobante + PayPal único y mensual | `decisions/03-pagos.md` | Implementado |
| D075 | Auth | Login con errores específicos solo para ADMIN_EMAILS + rate limit propio | `decisions/03-pagos.md` | Implementado |
| D076 | CI | CI del kit pospuesto hasta formatear con Biome | `decisions/01-flujo-git.md` | Pendiente |

<!-- ID secuencial, nunca se reutiliza. La próxima decisión es D077. Si hay unidades en
     paralelo, el orquestador reserva un rango de IDs por unidad. -->
