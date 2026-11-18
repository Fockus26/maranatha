# QA prevention — defects QA keeps finding, built out from the start

The QA agents find the same **classes** of defect again and again, in every project. Each
one is cheap to prevent when the piece is written and expensive to find later: a QA round,
a fix unit, a class sweep. This list is what the builders (`frontend-build`,
`backend-build`, the `feature-worker`s) check **while writing**, not what QA checks after.

**How to use it:** before closing a unit, go through the sections that apply to what you
touched (a form → §1 and §2; a list or a long name → §4; a timer, client dates or state
shared between tabs → §6). Do not read the rest.

**How it grows:** when a QA (`wave-qa`, `functional-qa`, `design-qa`) reports a finding that
is a class and is not here, its report proposes it in "Feedback para el kit" and it goes to
`context/KIT_FEEDBACK.md` as `Prevención`; `/kit-feedback` brings it to the kit, and the
kit adds the row here. Why this file exists: César saw the same QA findings (forms that
accept only spaces, among others) coming back in every project, because QA detected them
but nothing told the builder beforehand (2026-10-23).

Each row: the defect, the rule that prevents it, and where it came from.

---

## 1. Form inputs

| Defect | Prevention | Seen in |
|---|---|---|
| A required field accepts only spaces (`"   "`) | Every text field in the shared Zod schema with `.trim()` before `.min(1)`: `z.string().trim().min(1, '…')`. The trimmed value is the one saved | César, every project |
| A field joined from others passes with one of them empty (first name `""` + last name), or a password of only spaces | Each field is validated trimmed and **on its own**, before joining them; a password is not trimmed, but one of only whitespace is rejected | KREA |
| Leading/trailing spaces saved (`" ana@x.com"` duplicates an account) | `.trim()` on every text field; emails also `.toLowerCase()` before the uniqueness check | functional-qa §1 |
| Two-digit year saved as 1926 | Dates are never parsed from free text with `new Date(str)`: a date picker, or a 4-digit year enforced in the schema (`z.number().int().min(1900).max(<current + N>)`) | inversiones-js (High, data loss) |
| Numbers: negative, `0`, `1e10`, decimals where they make no sense | `z.coerce.number().int().positive().max(<real max>)` per field; `inputMode="numeric"` is UX, not validation | functional-qa §1 |
| Unlimited length breaks the UI or the database | `.max()` on every string, the same as the column; the UI handles the max (§4) | functional-qa §1 |
| Client-only validation | The same schema runs on the server (`backend-build` › Validation) | backend-build |
| Placeholder text at 3.25:1, and axe passes | The base `Input` and `Textarea` set the placeholder color to a token that gives ≥ 4.5:1 (`placeholder:text-text-2`); the default is the text color at 50 % | workout |

## 2. Submit and state

| Defect | Prevention | Seen in |
|---|---|---|
| Double click or repeated Enter creates two records or charges twice | Button `disabled` + `aria-busy` while the request is in flight **and** an idempotent server (unique key per operation, or idempotency key on payments) | functional-qa §2 (the most common and most expensive) |
| An edit dialog overwrites a change made meanwhile (another tab, another user) | Save with a version or `updated_at` check (`WHERE id = $1 AND updated_at = $2`); on conflict, say so and reload, never overwrite silently | inversiones-js (High, data loss) |
| Back after submitting resubmits | Redirect after a successful POST (PRG); the form resets or the page shows the done state | functional-qa §2 |
| A form sent before hydration goes as a native GET: the password ends up in the URL | `method="post"` on every form (or a Server Action as its `action`), and the submit disabled until the page is hydrated | KREA |
| Session expired mid-form loses what was typed | The 401 is handled: the draft is kept (state or `sessionStorage`) and the user returns to it after login | functional-qa §4 |
| A cached old client keeps re-uploading data the server deleted | Version the stored keys; the new client invalidates the old data (`backend-build` › General) | world-flags |
| A limit that reads the counter and adds afterwards lets parallel attempts through (30 of 30 passed) | Reserve the attempt first with one atomic upsert (`insert … on conflict do update set n = n + 1 returning n`), then check; give it back if it did not count. A limit per IP besides the one per account | workout |
| Saving a whole array with one upsert overwrites what another client added, under "Todo guardado" | Merge by item id or index on the server inside the transaction, or reject with the conflict and say so | workout |

## 3. Network and errors

| Defect | Prevention | Seen in |
|---|---|---|
| A failed request leaves the spinner forever | Every request has its error state and a retry; a timeout, not an infinite wait | functional-qa §3 |
| The error says nothing ("Algo salió mal") | Expected errors are results with a message the user can act on (`backend-build` › Conventions) | functional-qa §7 |
| A storage or API failure shown as "check your connection" | The error type separates "no network" (`navigator.onLine` false, `fetch` rejected) from "the service failed" (a response with 5xx, a provider error); each has its message | KREA (B2) |
| A cron or job hangs on a third party and the next run piles on | Every outbound call in a cron, webhook or job has a timeout (`AbortSignal.timeout(ms)`) and its failure is logged, not awaited forever | world-flags |
| A date the client accepts fails in the database (or the reverse) | The server parses dates with the same strictness as the column: a strict format in the schema (`z.iso.datetime()`, `z.iso.date()`), never `Date.parse`, which accepts what Postgres rejects | world-flags |
| A form action right after login fails as a "network error" with the session open | The proxy/middleware that redirects by session only redirects `GET`/`HEAD`; a `POST` (a Server Action, a form, an API call) without the expected session gets a 401/403 the client handles, never a 307 it cannot follow | KREA |
| A new service worker route is intercepted by the old one | A service worker never caches `/api/*` or other dynamic same-origin routes, and the change ships a new SW version (`tech/astro.md` › A static site that gains an API) | world-flags |
| A form sent with the network cut lands on the error boundary and loses what was typed | Every action is tested with the form open and the network off: it comes back as a result, the fields keep their values. What the client destroys (the offline copy on sign-out) goes after the server answers, not before | workout |
| A rejected write is retried forever, under a text that promises a retry | Every retry queue has an exit for a permanent rejection (4xx): drop the item and tell the user | workout |

## 4. Layout under real content (200 % text, 320 px)

| Defect | Prevention | Seen in |
|---|---|---|
| A row of buttons or chips overflows | `flex-wrap`, and the button allows its text to wrap | world-flags ×4 rounds |
| A long name is clipped with no way to read it | Never `truncate` alone: tooltip or a second line; headings with `wrap-anywhere`/`break-words` | world-flags |
| A `fixed` toast/banner/sheet covers the screen at 200 % | `max-height` in `dvh` + its own scroll | world-flags |
| A table or strip with horizontal scroll still scrolls the page at 320 px | The scroll container is `relative overflow-x-auto`: without `position`, it does not clip its `absolute` descendants (a `caption.sr-only`) and they stretch the page | melao |
| A grid column overflows at 320 px | `grid-cols-1` as the base (not only `md:grid-cols-2`), and `min-w-0` on items holding buttons or a `fieldset` (their `min-content` widens the track) | melao |
| 200 % text at 390 px scrolls every route sideways | Widths in `rem` (`w-*`, `min-w-*`) only on rows that wrap; fixed bars with `max-w-full`. Measured with the browser's font size (CDP `Page.setFontSizes`, as `design-qa.ts` does), not by injecting a `font-size` | KREA |
| With the browser font at 150 % (`html { font-size: 150% }`) a screen leaves the viewport, and zoom does not show it | Test each screen that way too; grid tracks `minmax(0, 1fr)` instead of `1fr` | workout |

(The detail is in `frontend-build` › Conventions; if the project has a versioned reflow
script, it runs on the new piece.)

## 5. Interaction and motion

| Defect | Prevention | Seen in |
|---|---|---|
| Accordions, tabs, selects open and close with a jump; anchor links teleport | Animated with the motion tokens and turned off under `prefers-reduced-motion` (`frontend-build` › Motion in interactive widgets) | César, 2026-10-23 |
| An anchor link lands with the target under the sticky header | `scroll-margin-top` on the targets equal to the header's height token | César, 2026-10-23 |
| With a fixed bottom (or top) bar, the element focused with Tab stays under it | `scroll-padding-bottom` / `scroll-padding-top` on `html` equal to the bars' height tokens | KREA |
| In high contrast (`forced-colors`) the selected option of a segmented control or tab is not marked, and a logo drawn with a mask + `background-color` disappears | The selected state carries a `forced-colors:` variant (`outline` in `Highlight`); a masked drawing gets a `@media (forced-colors: active)` rule that paints it in `CanvasText`, or is an `<svg>` with `currentColor` | KREA |
| A global notice about the last operation survives the next one and covers its controls | Cleared when the next operation starts, or rendered only inside its own view. Test: trigger it and start another without closing it | world-flags |
| A count in a label ("Práctica diaria (3)") and the action it runs disagree | The label and the action call the same function on the same data (not one recomputed and one stored) | world-flags |
| A button removes its own card and the second tap lands on the card below | After an action that removes or reorders the pressed item, ignore the next tap for an instant (≈ 300 ms) or move focus to a neutral element | workout |
| A notice with an action fired from a modal cannot be pressed | The modal makes the rest of the page inert (`pointer-events`, `inert`): notices with an action are rendered inside the modal's layer, or the modal closes first | workout |
| A notice opened from a sheet shows its veil under the sheet | One scrim level per layer (sheet, dialog, notice), never a shared `z-scrim`; "notice from a sheet" is in the test list | workout |

## 6. Clocks, dates and tabs

Why this section: in world-flags `functional-qa` found seven defects of these classes in one
wave, none of which a builder had looked at (2026-11-06).

| Defect | Prevention | Seen in |
|---|---|---|
| A clock change or the computer sleeping takes time off a timer | One clock per measurement: a duration from `Date.now()` is never subtracted from a `performance.now()` mark. Pauses are stamped with the timer's clock, with the start as the floor. Test: `page.clock.setSystemTime` mid-timer | world-flags |
| A metric over a timer with pauses counts wall time (idleness counted while a modal was open) | Measure only the stretches in which the timer really ran. Test: leave the pausing modal open for the threshold's time | world-flags |
| A client clock set ahead blocks a feature for months ("less than X ago", "the last N" by date) | Dates later than `now + tolerance` are ignored or clamped when reading, recording and merging (also when merging progress from another device) | world-flags |
| Another tab merges a half-written state, or another account's data | Every `setItem` of a synced key writes a complete state (never a provisional one and then the corrected one), and the key that says whose data it is is written before the data | world-flags |
| A notice ("just happened") shows in every open tab | Effects that announce tell a change made here from one adopted from another tab (`storage` event, `BroadcastChannel`) and announce only the first | world-flags |
| Logging in or out in one tab leaves the others on the old session | A session change is announced to the other tabs (`BroadcastChannel`, or a `storage` key) and they reload their state; an httpOnly cookie changes nothing they can see by themselves | world-flags |
