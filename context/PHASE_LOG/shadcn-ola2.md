# Fase migración MUI → shadcn · ola 2 (primitivas) — 2026-11-20

main @ 75306fd. Brief/prompts: `context/plans/orchestration-2026-11-20-shadcn-ola2*.md`. Formas compartidas: `context/plans/formas-compartidas-shadcn-ola2.md`.

| PR | Rama | Qué | Decisiones |
|---|---|---|---|
| #59 | feat/ui-acciones | avatar, tooltip, badge, link; SegmentedToggle y ThemeToggle sin MUI (prop `sx` → navy/className en Sidebar, Topbar, MobileMenuOverlay) | D112–D113 |
| #60 | feat/ui-campos | input, textarea, label, select, radio-group, popover, field; `--accent`; DateField/TimeField sobre Radix Popover (log propio: `feat-ui-campos.md`) | D114–D116 |
| #61 | feat/ui-estados | skeleton, progress, tabs, container, pattern-layer, brand-icons; `--muted`, tamaños ≥ 1920, `wide:`; EmptyState, Reveal, StepTransition; mapa de íconos | D119–D121 |
| #62 | feat/ui-superposiciones | dialog, sheet, alert, sonner (`<Toaster>` en layout); ConfirmDialog sobre dialog (portal dentro del papel MUI abierto; devuelve el foco) | D117–D118 |

- Los 4 workers se cortaron 1–2 veces por errores de red (ENOTFOUND) y se reanudaron desde el estado del slot.
- Saturación de la máquina con 4 dev servers: capturas y axe de #59, #61, #62 en una segunda ronda escalonada.
- Bug de main corregido de pasada (#60): Escape dentro del calendario cerraba también el modal MUI.
- QA: no aplica (QA: al final). Contenedores qa-maranatha-* bajados al cerrar.
