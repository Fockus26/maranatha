# Email templates — catalog, design and implementation

The emails the app sends (confirm account, recover password, order received…) are as much
part of the brand as the 404. If they are not designed with the rest, the backend sends the
provider's default template ("Confirm your signup", not in the site's language, no logo) or
invents one in phase 07 without a system. They are designed with the site (Claude Design,
brief §7) and implemented in phase 07.

**Only if the app sends emails.** A landing page without a form has none; a landing page
with a contact form has two (acknowledgment to the visitor and notice to the client). The
kickoff decides which apply and they go to `context/PROJECT_CONTEXT.md` § "Emails".

Email copy is in the site's language; the examples below are in Spanish because the kit's
projects are.

---

## The catalog

| Email | When it applies | Sent by | Minimum content | Action |
|---|---|---|---|---|
| **Confirm account** | Sign-up with email verification | Auth provider | What they asked for, what the link is for, how long it lasts | "Confirmar mi correo" |
| **Magic link / code** | Passwordless login or OTP | Auth provider | The code, large and copyable, or the button; how long it lasts | "Entrar" |
| **Recover password** | There is a password | Auth provider | That someone asked for it; if it was not you, ignore it (nothing changes) | "Elegir contraseña nueva" |
| **Email change** | The user can change their email | Auth provider | Old email → new; what to do if it was not them | "Confirmar el cambio" |
| **Invitation** | An admin invites users | Auth provider | Who invites, to what, how long it lasts | "Aceptar invitación" |
| **Reauthentication** | A sensitive action asks for confirmation | Auth provider | The code; for which action | — |
| **Welcome** | Only if it adds something (first steps) | The app | What to do first | The user's main destination |
| **Domain transactional emails** | Order, payment, booking, shipping, cancellation, invoice | The app | Summary (what, how much, when), copyable reference number | "Ver mi pedido" |
| **Contact form · acknowledgment** | There is a form that really submits | The app | That it arrived, what happens now and when, a copy of what was sent | — |
| **Contact form · internal notice** | Same; the client receives it | The app | The form's data, readable, with "Reply" to the sender | — |
| **Notifications** | Alerts, reminders, digests | The app | What happened, link to the detail | "Ver …" · and how to stop receiving them |

What does **not** go in: newsletters and marketing campaigns. They are designed in the bulk
sending tool (Mailchimp, Brevo…), with other legal rules; if the project has them, it is a
separate decision.

---

## The visual family

They all share **one base template**, like the status screens:

1. **Header**: logo (image with `alt` = brand name), on the system's background.
2. **Body**: title (one `<h1>`), one or two short paragraphs, the action.
3. **Button** for the action, and below it **the link as text** ("Si el botón no funciona,
   copia este enlace: …"): some clients block or break buttons.
4. **Footer**: why they get this email, contact or support, legal name and address if the
   client has them, and in notifications the link to stop receiving them.

### Constraints of the medium (they go into the brief as is)

Email is not the web: email clients (Gmail, Outlook, Apple Mail) render HTML from 15 years
ago. A design that ignores that looks fine in the mockup and broken in the inbox.

- **Max width 600 px**, one column. On mobile (320–390 px) the same column at full width; no
  grids that depend on media queries (Gmail ignores them in some cases).
- **Typography with a system fallback.** Web fonts do not load in Gmail or Outlook: the
  design has to work with the fallback stack (`Arial, Helvetica, sans-serif` or
  `Georgia, serif`). The brand font, if used, is an enhancement, not a requirement.
- **Images blocked by default** in many clients. The email is understandable without any
  image: no text inside images, `alt` on all of them, no background image with content.
- **Forced dark mode.** Gmail and Outlook invert colors without asking. The logo has to read
  on light and on dark (PNG with a transparent background and a stroke that works on both,
  or a version on its own background); avoid pure whites and blacks on image edges. If the
  site has dark mode, the variant is designed; if not, at least check that inversion does
  not break the logo or the button.
- **Button** ≥ 44 px tall, text ≥ 16 px, made in HTML (not an image), with AA contrast.
- **WCAG AA contrast** and **nothing by color alone**, as on the site.
- **Subject and preheader** (the preview text in the inbox) for each email: the subject says
  what it is ("Confirma tu correo en <marca>"), the preheader completes it, does not repeat it.
- **Plain-text version** of each email (the implementation generates it, but the copy has to
  work without formatting).

---

## Implementation (phase 07)

Check Context7 before writing them: the React Email package was renamed
(`@react-email/components` → `react-email`) and Supabase's `config.toml` keys move between
CLI versions.

### App emails — React Email

- One component per email in `emails/` (`emails/order-confirmation.tsx`…), all on top of an
  `emails/components/EmailLayout.tsx` with the header, the footer and the system's tokens
  (colors, sizes) brought from `context/COLORS.md` as constants — there are no CSS variables
  in email.
- Each component defines `PreviewProps` with realistic data in the site's language: it is
  what the preview server (`email dev`) shows, which acts as the **email gallery** for
  César, `design-qa` and the PR screenshots.
- They are rendered with `render(<Email …/>)` (HTML) and `render(<Email …/>, { plainText:
  true })` (text), and **both** are sent to the provider decided at kickoff (§ "Sending
  provider"). Sending happens on the server, never from the client; the provider's key in
  an environment variable.
- User data that goes into the email (name, form message) gets escaped: React does it on its
  own; do not use `dangerouslySetInnerHTML` with anything that comes from a form.

### Auth emails — Supabase

Supabase sends the ones in the table with its own HTML templates, with Go variables
(`{{ .ConfirmationURL }}`, `{{ .Token }}`, `{{ .TokenHash }}`, `{{ .SiteURL }}`,
`{{ .RedirectTo }}`, `{{ .Email }}`, `{{ .NewEmail }}`, `{{ .Data }}`).

- **In the repo**: one HTML per template in `supabase/templates/` (`confirmation.html`,
  `recovery.html`, `magic_link.html`, `invite.html`, `email_change.html`,
  `reauthentication.html`, only the ones that apply) and in `supabase/config.toml`:

  ```toml
  [auth.email.template.confirmation]
  subject = "Confirma tu correo en <marca>"
  content_path = "./supabase/templates/confirmation.html"
  ```

  That way the local database (`bun run qa:local`) sends the emails with the real design to
  Mailpit, and QA sees them as the user does. (`supabase/` goes in git: `tech/supabase.md`.)
- **A single design source**: the HTML files in `supabase/templates/` are generated from
  React Email components that receive the Go variables as text
  (`url="{{ .ConfirmationURL }}"`), with a script (`bun run emails:export`). Check that the
  output keeps the literal variable in the `href`. If the script does not pay off (two or
  three templates), they are written by hand on top of `EmailLayout`'s exported HTML; what is
  not acceptable is a different design for auth.
- **In production** the templates live in Supabase's dashboard (Authentication → Email
  Templates) or are applied through the Management API: `config.toml` is not uploaded on its
  own. Applying them is an **action for César** with the repo's HTML (or the agent's, if
  César authorizes access), and every template change repeats the action — note it in the PR.
- **Custom SMTP from the first real email.** Without it, Supabase only delivers to the
  project team's addresses ("Email address not authorized" for the rest), with no
  guarantees, and on the free plan the dashboard does not let you edit the templates (seen in
  a project: SMTP had to be set before the HTML could be pasted). Provider: § "Sending
  provider". Configured in Authentication → SMTP or through the Management API
  (`PATCH /v1/projects/<ref>/config/auth`, `smtp_*` fields). An action for César with exact
  steps.

### Auth emails — Firebase Auth

Firebase has no templates in the repo and the emulator does not apply them: they live in
the console (Authentication → Templates), with limited HTML, and **they may be locked** for
the project (it happened: "no se pueden actualizar las plantillas… comunícate con Asistencia
de Firebase"; only support unlocks it, and setting a custom SMTP does not remove it). A
designed email was left unusable for not checking first.

1. **Before designing the auth emails**, César opens Authentication → Templates and tries to
   edit one. If it lets him, the `EmailLayout` HTML is pasted (within what the console
   accepts) and it is an action for César as with Supabase.
2. **If it is locked, or the design does not fit what the console accepts: send them
   yourself.** The server generates the link with the Admin SDK
   (`getAuth().generatePasswordResetLink(email, actionCodeSettings)`, and
   `generateEmailVerificationLink` / `generateSignInWithEmailLink` for the others) and sends
   it with React Email through the sending provider. That endpoint:
   - answers the same whether the email exists or not (it does not reveal which accounts exist);
   - limits attempts per IP and per email;
   - only runs on the server (the Admin SDK carries service credentials).
3. **In QA**: with the Auth emulator, the custom endpoint works the same (the Admin SDK
   points at the emulator with `FIREBASE_AUTH_EMULATOR_HOST`); the email shows in the test
   provider's inbox or in the log, not in Firebase's console.

### Auth emails — Better Auth (projects moved to the VPS Postgres)

On the VPS Postgres (`tech/vps-postgres.md`) there is no provider sending auth emails:
**every email is the app's**, and that is simpler. Better Auth calls a function of yours for
each one (`emailVerification.sendVerificationEmail`, `emailAndPassword.sendResetPassword`,
the magic-link and change-email plugins' equivalents) with the user and the URL; that
function renders the React Email component and sends it through the same SMTP as the rest.
Templates live only in the repo: nothing to paste in a dashboard, nothing that differs
between local and production.

```ts
// lib/email/send.ts — the only place that talks to SMTP
import nodemailer from 'nodemailer'
import { render } from '@react-email/render'

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,           // smtp-relay.brevo.com · localhost (Mailpit) in QA
  port: Number(process.env.SMTP_PORT),   // 587 · 1025
  auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
})

export async function sendEmail(to: string, subject: string, element: React.ReactElement) {
  await transport.sendMail({
    from: process.env.SMTP_FROM,         // "Marca" <hola@dominio>; the name `qa:local` sets
    to, subject,
    html: await render(element),
    text: await render(element, { plainText: true }),
  })
}
```

- **Do not `await` the send inside the Better Auth callback** (`void sendEmail(…)`, or
  `after()` from `next/server` on Vercel so the function is not frozen before it finishes).
  Why: Better Auth's docs, an awaited send makes "this email exists" measurable by response
  time.
- **In QA**, `SMTP_HOST=localhost` / `SMTP_PORT=1025` with Mailpit
  (`docker run -d -p 1025:1025 -p 8025:8025 axllent/mailpit`): the emails show at
  `localhost:8025` with the real design, as Supabase's Mailpit did.
- **The sender stays Brevo's SMTP (free, 300/day).** Not an SMTP server on the VPS: many
  VPS providers block outgoing port 25, and a new IP's reputation is nil, so Gmail and
  Outlook send its mail to spam or reject it, however well SPF/DKIM/DMARC are set. A relay
  with a reputation is what gets the email to the inbox; Brevo's free plan is that relay at
  no cost. Over 300/day: Brevo's paid tier or Amazon SES (≈ $0.10 per 1,000).

With another auth provider the idea is the same: templates in the repo, design from the
same `EmailLayout`, and applying them in the provider as a documented action, checking first
that the provider lets you apply them.

### Sending provider

Decided at kickoff (the emails question of `project-kickoff`) and recorded in a decision
(`context/decisions/D0NN-email.md`): provider, sender, and where the key is (never in the
repo). Without a decision, the provider only lives in one session's memory (it happened).

- **Default: Brevo over SMTP.** Free plan with 300 emails a day; it serves the auth emails
  (Supabase's SMTP) and the app's with the same sender. Server `smtp-relay.brevo.com`, port
  587; SMTP user and key from Brevo → SMTP & API (one key per project, so it can be revoked
  on its own).
- **Resend** if the app already uses its API or the client prefers it: it also gives SMTP
  for auth.
- The sender is verified in the provider; with an own domain, it is authenticated (SPF,
  DKIM, DMARC) before launch. Without a domain, the verified sender is enough to start, but
  it lands in spam more easily: say so in the PR.

### Sender and domain

- `From` with the brand's name and an address on the client's domain
  (`"<Brand>" <hola@domain>`), not a provider's `noreply@`. `Reply-To` an address someone
  reads (in the form's internal notice, the sender's email).
- The domain verified in the provider (SPF, DKIM and DMARC) **before** launch: without it
  emails go to spam. It is an action for César (DNS); it goes in `CONTENT_CHECKLIST.md` or in
  the PR's actions.

---

## Accessibility

- `<html lang>` with the site's language, `<title>` = subject.
- One `<h1>`, real paragraphs, layout tables with `role="presentation"` (React Email adds it
  in its components).
- The action link says what it does ("Confirmar mi correo"), never "clic aquí".
- Codes (OTP, order number) as selectable text, not an image.

## Closing criteria (phase 07)

- [ ] The emails `PROJECT_CONTEXT.md` § "Emails" lists exist, and they share `EmailLayout`.
- [ ] Each with subject, preheader, plain-text version and realistic `PreviewProps`.
- [ ] The auth ones in `supabase/templates/` + `config.toml`, and they show with the design
      in Mailpit when signing up on the local database.
- [ ] They look right in the preview at 600 and 360 px, without images and with inverted colors.
- [ ] Sending provider recorded in a decision.
- [ ] Actions for César in the PR: templates to the dashboard, SMTP, verified domain.
- [ ] Real copy or in `CONTENT_CHECKLIST.md`.
