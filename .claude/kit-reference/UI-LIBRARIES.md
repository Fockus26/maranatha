# Component library — profiles

**There is no kit default.** César picks the library per project, in the `project-kickoff`
interview, and it is written in `context/PROJECT_CONTEXT.md`. That file rules: every agent
reads from there, not from this document.

This file exists for two things: giving the criteria for the choice, and telling
`frontend-build` how the rules change depending on which one was chosen.

---

## The three options

### shadcn/ui

**It is not an installed library.** It is a CLI that **copies the component's source code**
into your repo. Underneath it uses Radix UI (the accessible primitives) and Tailwind (the
styles).

```bash
bunx shadcn@latest init
bunx shadcn@latest add button card dialog
# → components/ui/button.tsx appears in YOUR repo, yours to edit
```

| For | Against |
|---|---|
| Full control: it is your code, you edit it without fighting anyone's API | You maintain it: no automatic updates |
| No imposed look — it looks like your tokens say | You start with fewer ready components |
| Accessibility solved by Radix (keyboard, focus, ARIA) | Complex components (data table, date picker) have to be assembled |
| Zero extra library weight | Needs design judgment so it does not look generic |

**When:** projects where the design is custom and specific, and you want the design system
to rule over the component.

**`shadcn init` in a project that already has its tokens** (KREA, v4): it rewrites
`--accent`, `--secondary`, `--input` in the global CSS, switches the fonts in `layout.tsx`
to Geist, adds packages (`shadcn`, `tw-animate-css`, its own `cn`) and changes the `cn`
import of every file. Run it on a clean tree and review its diff before committing: restore
the tokens and fonts, keep the project's `cn` (with its `extendTailwindMerge`,
`STACK-NEXTJS.md`) and point `components.json › aliases.utils` at it. After that, `add`
only touches `components/ui/`.

### Hero UI (formerly NextUI)

A real library, installed as a dependency. Built on React Aria (Adobe) for accessibility,
and on Tailwind for styles, with its own theme plugin.

```bash
bun add @heroui/react framer-motion
```

| For | Against |
|---|---|
| You start fast: many polished components from minute one | It has its own look; moving away from it costs |
| React Aria's accessibility, very solid | You are tied to its API and its release pace |
| Token-based theme, fits well with Tailwind | Less control over the component's internals |
| Animations included | Depends on framer-motion |

**When:** landing pages and sites where speed matters more than visual uniqueness, and the
modern default look already works as a starting point.

### MUI (Material UI)

A complete, mature library, with **its own styling engine** (Emotion) and its own theme
system.

```bash
bun add @mui/material @emotion/react @emotion/styled
```

| For | Against |
|---|---|
| The largest catalog: DataGrid, date pickers, complex tables | **Does not get along with Tailwind** — two styling systems competing |
| A very powerful theme system | The Material look is strong; removing it is real work |
| Huge documentation and community | Heavier bundle |
| Careful accessibility | The API has its own learning curve |

**When:** dashboards and internal applications with many tables, filters and complex forms,
where the catalog saves weeks and the Material look is not a problem.

> **Hard rule if MUI is chosen: Tailwind goes away.** Keeping both is the recipe for half
> the styles living in `sx` and the other half in classes, with nobody knowing which wins.
> With MUI, the token system is MUI's `theme` and styles go in `sx` / `styled`. The
> orchestrator must write this in `PROJECT_CONTEXT.md` and in `DESIGN_RULES.md`.

---

## How to choose

| If the project… | Choose |
|---|---|
| Has a custom, specific design that must be respected in detail | **shadcn/ui** |
| Is a landing page or corporate site, and has to be delivered fast | **Hero UI** |
| Is a dashboard with tables, filters and complex forms | **MUI** |
| Already has code with one of the three | **That one.** Migrating mid-project does not pay off |
| The client has its own design system in Figma | **shadcn/ui** — the only one that lets you replicate it without fighting |

---

## What changes for `frontend-build` depending on the choice

| | shadcn/ui | Hero UI | MUI |
|---|---|---|---|
| **Styles** | Tailwind | Tailwind | `sx` / `styled` — **no Tailwind** |
| **Tokens live in** | `tailwind.config` / `@theme` | Hero UI's theme plugin + Tailwind | MUI's `createTheme()` |
| **Installing a component** | `bunx shadcn@latest add <x>` | already in the package | already in the package |
| **Customizing** | you edit the file, it is yours | `classNames` and theme variants | `sx`, `styled()`, the theme's `components` |
| **Before creating your own** | check whether shadcn has it | check Hero UI's catalog | check MUI's catalog |
| **Dark mode** | Tailwind's `dark` class | Hero UI's `ThemeProvider` | MUI's `colorSchemes` |
| **Base accessibility** | Radix | React Aria | MUI's own |

**Common to all three:**

- **Never reimplement by hand a primitive the library already ships** (dialog, select, tabs,
  popover, combobox). The keyboard and focus behavior of those widgets is where most
  accessibility bugs slip in, and all three already have it solved.
- **Zero magic values.** Everything comes from the chosen library's token system.
- **Check Context7** before using the library's API: all three change between major versions.

---

## What the brief tells the design tool

The brief `project-kickoff` produces has to name the library, because it changes what is
reasonable to design:

- **shadcn/ui** → "it is implemented with Tailwind + shadcn/ui (Radix). Use Tailwind's
  spacing scale. You may propose your own visual treatments: the component is written to
  measure."
- **Hero UI** → "it is implemented with Hero UI. Prefer compositions from its catalog
  (Button, Card, Modal, Input, Dropdown, Tabs, Accordion, Table). Design within what its
  theme system allows: radii, colors and sizes are tokens, not free values per component."
- **MUI** → "it is implemented with MUI. Prefer components from its catalog. The design may
  move away from the Material look, but it must be expressed as an MUI theme (palette,
  typography, shape, shadows), not as loose styles per screen."
