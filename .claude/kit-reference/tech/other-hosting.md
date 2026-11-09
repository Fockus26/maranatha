# Hosting other than Vercel

The client's hosting, or another provider. Vercel gives the kit's flow three things for free, and
each one needs an answer here: a preview per PR, the environment variables' source, and a deploy on
merge. This is a checklist, not a recipe: no project has gone through it yet, so **the first one on
a real host writes `tech/<host>.md` with what it found** and reports it with `/kit-feedback`.
(WordPress has its own deploy: `tech/wordpress.md`.)

## Ask before building (it can change the stack)

- **What does the plan run?** Only static files, or a Node process? On static hosting, Next's API
  routes and server rendering do not exist: that means a static export, or Astro without an adapter.
- **What access is there?** SSH, SFTP or only a panel. It decides how the deploy works.
- **Who owns it?** Who pays, who manages the DNS, who gets the access. What the client must provide
  goes to `CONTENT_CHECKLIST.md`, owner: client.
- **Backups and rollback:** what the host offers, and who restores.

Write the answers in `PROJECT_CONTEXT.md` › Repo and deployment, and the choice in a decision.

## What replaces what Vercel did

| Vercel | Here |
|---|---|
| Preview per PR | None by default: screenshots in the PR, and `qa:local`. A staging folder if the host allows it |
| `vercel env pull` | No source to pull from: `.env.local` is written by hand, and its values live in César's password manager, never in the repo or the chat. Say so in `CLAUDE.md`, whose general line assumes the pull |
| Deploy on merge | A GitHub Action (SSH, rsync or SFTP, with the credentials as GitHub Secrets), or by hand with the steps written down |
| Instant rollback | Deploy the previous tag. Test it once before there are real users |

## César's VPS

It is **only the database server** today: `bootstrap.sh` opens SSH, 6432 and, with a domain, 80 for
the certificate. It has no web server and 443 stays closed. Serving a site from it is a new piece to
design with César, and the place to decide what happens to memory and security when it shares the
machine with every project's database. Do not improvise it inside a project.

## Before calling it deployed

The same checks as `DEPLOY.md` §3, plus: HTTPS answers and HTTP redirects, compression and cache
headers are on (a Vercel default that a host may not have, and it shows in Core Web Vitals), and the
deploy has been repeated once, to prove that it works from clean.
