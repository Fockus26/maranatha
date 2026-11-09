# Patterns — the solved pieces every site repeats

Forms that validate on submit or while typing, a button that cannot submit twice, headings
that grow with the screen, lists with their empty and error states, the same auth criteria
in every project. The agent used to rebuild each one per project, slightly different each
time, and QA kept finding the same gaps (`QA-PREVENTION.md`). Here they are built once:
**the logic is fixed, the design is the project's** (César, 2026-10-29).

Two levels:

- **Registry** (`patterns/` in the kit): code that is already stable, installed with the
  shadcn CLI and then owned by the project (it is copied, not imported from a package, so
  the project can adjust it). Logic only, no styled UI: it works with shadcn/ui, Hero UI or
  MUI alike.
- **Recipes** (this file, below): the decided behaviour and its rules, for the pieces whose
  code depends on the project's UI library or design.

A recipe moves to the registry when it has been used **unchanged in two projects**; before
that, freezing it in code freezes a first guess.

---

## Installing from the registry

```bash
bunx shadcn@latest add <kit>/patterns/r/kit-fields.json <kit>/patterns/r/kit-form.json <kit>/patterns/r/kit-submit-guard.json
```

- `<kit>` is the kit clone's path (`path` in `~/.claude/web-agent-kit.json`), **written as
  a path relative to the project** (`../web-agent-kit/patterns/r/…`). Why: an absolute
  Windows path (`C:/…`) fails with "unknown scheme", the CLI reads the drive letter as a
  URL scheme (measured with `shadcn@latest`, 2026-10-29).
- It needs a `components.json`. A project without shadcn (Hero UI, MUI) copies the files
  from `<kit>/patterns/registry/kit/` to the same targets and installs the dependencies
  listed in `patterns/registry.json`.
- Installed files are the project's: adjusting the messages or a limit is fine. If the
  change is a **better rule** (not this project's taste), it goes to `KIT_FEEDBACK.md` so
  the registry gets it.

| Item | Installs | What it fixes |
|---|---|---|
| `kit-fields` | `lib/validation/fields.ts` | `text(max)`, `optionalText(max)`, `email()`, `password()`, `year()`, `quantity(max)`: trim before checking, lowercased email, untrimmed password, 4-digit year, bounded numbers. Messages in Spanish |
| `kit-form` | `hooks/use-kit-form.ts` | `useKitForm(schema, { validation })`: the two validation modes (below) on react-hook-form + zod, focus on the first error |
| `kit-submit-guard` | `hooks/use-submit-guard.ts` | `useSubmitGuard(action)`: one submit at a time (blocked synchronously, before React re-renders) and one idempotency key per operation, kept across retries |

**Changing the registry (kit maintenance):** edit `patterns/registry/kit/`, rebuild with
`bunx shadcn@latest build -o r` inside `patterns/`, install the items into a scratch
project and typecheck a usage before committing. `r/` is committed: projects install from
it without building.

---

## 1. Form validation: two modes, chosen per form

| Mode | Behaviour | For |
|---|---|---|
| `submit` (default) | Nothing is red until the first submit; after it, each field re-checks as it changes and a fixed error disappears at once | Short forms: contact, login, newsletter |
| `live` | Checks while typing; an error waits ~600 ms after the last keystroke before it shows (react-hook-form `delayError`), a correction clears it immediately | Long forms and fields with a format: sign-up, password with rules, checkout, addresses |

Both: errors under the field, linked with `aria-describedby`, `aria-invalid` on the field,
focus on the first invalid field on submit, and the same schema runs on the server
(`backend-build` › Validation). Never validate on every keystroke without the delay: an
email field red from its first letter is the "abrupt" feeling.

## 2. Submit: never twice

`useSubmitGuard` on the client **and** on the server the key it sends: a unique column
(`idempotency_key`) with `insert … on conflict (idempotency_key) do nothing returning *`,
and if nothing is returned, return the record that already exists. Payments: the
provider's idempotency key (Stripe `idempotencyKey`, PayPal `PayPal-Request-Id`). The
button: `disabled` + `aria-busy` while pending and a label that says it (`Enviando…`).
After success: redirect or a done state (PRG), so Back does not resubmit.

## 3. Fluid type: headings grow with the screen, text does not

Headings scale between a size at 360 px and a size at 1440 px with `clamp()`; body text
stays fixed (`1rem` minimum: a body that shrinks on mobile is unreadable, and one that grows
on a 4K monitor makes lines too long).

```
slope     = (max − min) / (1440 − 360)            # px per px of viewport
intercept = min − slope × 360                     # px
font-size = clamp(min/16 rem, intercept/16 rem + slope×100 vw, max/16 rem)
```

Example, h1 32 → 56 px: slope 0.0222, intercept 24 px →
`clamp(2rem, 1.5rem + 2.222vw, 3.5rem)`. In Tailwind v4, in `@theme`:
`--text-h1: clamp(2rem, 1.5rem + 2.222vw, 3.5rem);` → class `text-h1`.

- **Always a rem term** in the middle: pure `vw` does not grow with the browser's zoom or
  font size, and fails WCAG 1.4.4 (text resizable to 200 %). The rem part keeps it zoomable.
- The min and max come from the design (`DESIGN_TOKENS.md`), not from this file. Line
  height goes down as size goes up (1.1–1.2 for big headings, 1.5–1.6 for body).
- Check at 360, 768, 1440 and 3840 px and at 200 % zoom (`design-qa` measures it).

## 4. Lists: four states, always

Every list that comes from data renders **loading, empty, error and items**, modelled as
one discriminated state so none can be forgotten:

```ts
type ListState<T> =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'ready'; items: T[] }   // items.length === 0 → the empty state
```

- **Loading**: a skeleton with the size of the real rows (no layout jump), `aria-busy` on
  the list.
- **Empty**: what is missing and the action that fills it ("Aún no tienes pedidos · Ver
  productos"), never a bare "Sin datos". An empty search says what was searched and offers
  to clear the filters.
- **Error**: what happened in plain words and a retry button; the rest of the page keeps
  working.
- **Many**: pagination or "Cargar más" past a page size the design sets; never all rows at
  once. A filter or page lives in the URL (`?page=2&q=`), so Back and a shared link keep it.
- Long names, emails and numbers are handled (`QA-PREVENTION.md` §4): `truncate` with the
  full text available (`title` or a tooltip), `min-w-0` on flex children.

## 5. Auth: the criteria every site repeats

Whatever the provider (Supabase, Firebase, Better Auth), a site with accounts meets all of
these; the provider-specific how is in `backend-build`.

- [ ] **Sign-up**: `email()` + `password()` from `kit-fields`; a show/hide toggle on the
      password, paste allowed (password managers); the rules visible before typing, not
      only as an error.
- [ ] `autocomplete`: `email`/`username`, `current-password` on login, `new-password` on
      sign-up and reset, `one-time-code` on OTP. Without it, password managers fail.
- [ ] **Email verification** before the account can do anything that matters; the
      "check your inbox" screen offers to resend (rate limited) and to fix the email.
- [ ] **Login error** generic ("Correo o contraseña incorrectos"), the same for an unknown
      email; rate limit per IP and per email.
- [ ] **Recovery**: the response is the same whether the email exists or not; the link is
      single-use and expires; after resetting, other sessions are closed.
- [ ] **Return to where they were**: `?next=` after login, validated as a same-origin
      relative path (an open redirect otherwise).
- [ ] **Session**: httpOnly cookie; protected routes checked on the server; an expired
      session mid-form keeps the draft (`QA-PREVENTION.md` §2).
- [ ] **Logout** visible in the account menu; on a shared device it really ends the session
      (server-side), not only the cookie.
- [ ] **Change email** confirms on the new address (and warns the old one); **delete
      account** exists if the site stores personal data, with a confirmation.
- [ ] Every one of these screens and its emails is designed (`STATUS-SCREENS.md`,
      `EMAIL-TEMPLATES.md`): none falls back to the provider's default.
