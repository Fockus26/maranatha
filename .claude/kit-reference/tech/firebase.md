# Firebase (Auth + Firestore)

## Local backend for QA

The emulators, not Docker: they need Java (a JDK) and the `firebase-tools` CLI.

- `firebase.json` with an `emulators` block (auth, firestore, ui) in git, and a `"emulators":
  "firebase emulators:start --project demo-<project>"` script. The project is always `demo-*`:
  with it the emulators cannot reach real resources.
- The client connects to them when `NEXT_PUBLIC_USE_EMULATORS` (`PUBLIC_`/`VITE_` in
  Astro/Vite) is `"true"` (`connectAuthEmulator`, `connectFirestoreEmulator`); the Admin SDK
  reads `FIREBASE_AUTH_EMULATOR_HOST`/`FIRESTORE_EMULATOR_HOST` by itself.
- `qa-local.ts` sets all of that, gives the role as a custom claim (`role`) and runs
  `scripts/seed-emulator.ts` if it exists. A role kept in a document (`admins/{uid}`) →
  `assignRoleFirebase` in `scripts/qa-roles.ts`.
- In git: `firestore.rules`, `firestore.indexes.json`, `firebase.json`.
- `firebase-tools` as a pinned devDependency (`bun add -d firebase-tools@<version>`), not
  whatever `bunx` finds: an old copy in a slot failed with `chalk.blue is not a function`
  (KREA). `qa-local` sets `NO_UPDATE_NOTIFIER=1` (the update check hung it silently) and
  retries once when a cold start passes the CLI's 60 s.

## Rules tests

`@firebase/rules-unit-testing`: `initializeTestEnvironment` in `beforeAll(fn, 30_000)` — bun's
default 5 s ran out on the first cold run and the suite failed (inversiones-js) — and their
folder out of `test:related` (`--dir`), since they need the emulator.

## Emulators in parallel (pool slots)

With several slots busy, `emulators:exec` did not have the emulator ready in 60 s, repeated
runs on the same emulator contaminated each other, and two slots running `test:rules` at once
collided on the fixed ports (KREA ×8). So:

- **One unit per wave runs them** ("Test services: yes" in its prompt, `orchestrate` §4). The
  rest do not start emulators: if CI has the `rules` job, they verify with `gh pr checks`.
- The one that runs them: `bunx firebase emulators:start --project demo-<project> >
  .qa/emulators.log 2>&1` in the background, wait for `All emulators ready` in the log, then
  `bun test <rules folder>`; stop it by PID with its tree (`taskkill /PID <pid> /T /F`). A new
  emulator per run, or `testEnv.clearFirestore()` in `beforeEach`: never two runs over the
  same data.
- Port 8080 (Firestore's default) collides with Docker/WSL. Another fixed port in
  `firebase.json` (e.g. 8180), read by the tests from `FIRESTORE_EMULATOR_HOST`, never
  hardcoded. The first time on a port, Windows asks to let Java through the firewall and the
  emulator waits: César accepts it once.
- A timeout under load is load (brief rule 9): run it alone once before investigating. The
  Admin SDK's first load can take 60 s with other slots busy: `beforeAll(fn, 90_000)`.
- `await expect(promise).rejects` over the Admin SDK hung (DEADLINE_EXCEEDED, bun 1.4.4) and
  left the ports taken. Catch it by hand:

  ```ts
  // tests/helpers/rejects.ts — the rejection as a value; `expect(await rejects(p)).toBeTruthy()`
  export async function rejects(p: Promise<unknown>): Promise<unknown> {
    try { await p } catch (e) { return e }
    throw new Error('expected a rejection, it resolved')
  }
  ```

- If the classifier refuses `Stop-Process` and orphans are left, a project script
  `"emulators:stop": "bunx kill-port 8180 9099 4000"` (the ports of its `firebase.json`).

## Emails

Check before designing that the console's templates can do what the design asks:
`EMAIL-TEMPLATES.md` § Firebase.

## Leaving it

To move a project to César's VPS, when he asks: `migrate-firebase-vps.md`. Firestore means
redesigning the model, so check its estimate first.
