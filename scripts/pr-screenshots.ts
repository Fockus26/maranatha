/**
 * PR screenshots — generates PNGs of the states the unit changed.
 *
 * Usage (with **node**, not bun — see the note below):
 *   node scripts/pr-screenshots.ts .pr-shots.json   (= bun run shots)   # Node ≥ 23.6 (or 22.x with --experimental-strip-types)
 *   → writes .pr-shots/<name>[-light|-dark].png and lists the paths.
 *   Then: bun run shots:publish   (= bash scripts/publish-pr-shots.sh .pr-shots)
 *
 * `.pr-shots.json` is written by the agent for its unit — rewritten each time, never reused
 * from the previous unit (and it is in .gitignore). The server URL goes in `base`:
 *
 *   {
 *     "base": "http://localhost:3000",
 *     "shots": [
 *       { "name": "ranking-mobile", "path": "/", "width": 375, "height": 812, "scheme": "both",
 *         "storage": { "tutorial-seen": "1" },
 *         "steps": [ { "click": "role=button[name='Ver ranking']" },
 *                    { "waitFor": "role=dialog" } ],
 *         "element": "role=dialog" },
 *       { "name": "home-desktop", "path": "/", "width": 1280, "height": 800 }
 *     ]
 *   }
 *
 * Fields of each shot:
 *   width/height   viewport (default 1280×800)
 *   scheme         "light" | "dark" | "both" (default "light")
 *   storage        localStorage keys seeded before loading (to reach a state)
 *   steps          click | fill+value | press | waitFor | wait (ms) | eval (JS in the page)
 *   element        captures only that element (sharper and lighter than the page)
 *   fullPage       whole page instead of the viewport
 *   route          responses faked in the page, for states that call Auth or an API:
 *                  [{ "url": "**\/auth/v1/user", "status": 401, "body": { "msg": "no" } }]
 *                  (`url` is a Playwright glob; `body` an object → JSON, a string → as is).
 *                  Why: without it a state that called Auth meant patching `fetch` by hand,
 *                  with the risk of a call reaching the real project (melao).
 *   guest          true → this shot ignores the session of `login` / `storageState` below
 *
 * Screens behind a session (top level, next to `base`) — only against the local backend
 * (`bun run qa:local`), never the real one. Without it the PRs of logged-in screens went out
 * with no images, or with a second script written for the unit (kit-deploy ×2, workout):
 *   "login": { "path": "/login",
 *              "steps": [ { "fill": "role=textbox[name='Correo']", "value": "${EMAIL_TEST}" },
 *                         { "fill": "role=textbox[name='Contraseña']", "value": "${PASSWORD_TEST}" },
 *                         { "click": "role=button[name='Entrar']" },
 *                         { "waitFor": "role=navigation" } ] }
 *     Runs once before the shots and every shot starts with that session. `${NAME}` in a
 *     `value` is read from `.env.test.local` (or the environment): the password is never
 *     written here. The last step waits for something only a logged-in page has.
 *   "storageState": ".qa/state.json"   a Playwright storage state saved by another script,
 *     instead of `login`.
 *
 * Browser: Playwright's Chromium. If this Playwright's build is not installed ("Executable
 * doesn't exist", after a dependency update), it falls back to the machine's Edge or Chrome
 * and says so. `PW_CHANNEL=msedge` (or `chrome`) or `PW_CHROMIUM_PATH=<exe>` choose one
 * (InversionesJL22 and workout wrote their own script for this).
 *
 * Decisions that avoid bad or hanging screenshots:
 *   - Service workers blocked: an old cached bundle is never captured.
 *   - `reducedMotion: 'reduce'`: no photos halfway through an animation.
 *   - Each path is requested once before the first shot: the first capture failed on the
 *     route's cold compile (melao).
 *   - Timeout per step and up to 3 attempts per shot; if it still fails, it goes on with the
 *     others and reports at the end (a failing shot does not block the PR).
 *   - It warns if `.pr-shots.json` is older than the branch's last commit: it was the slot's
 *     previous unit's, and the shots came out of the wrong states (melao).
 *
 * **Why node and not bun:** on Windows, Playwright launched from a Bun script hangs starting
 * Chromium (checked: 170 s without output with bun; 3 shots in seconds with node, same
 * script). Applies to every script that imports Playwright. `package.json` scripts
 * (`bun run test:e2e` → `playwright test`) do not have the problem: Playwright's binary runs
 * with node through its shebang.
 *
 * The agent **does not open the images** to review them (they cost many tokens): it already
 * verified by measuring the DOM. The screenshots are for whoever reviews the PR.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import {
  type Browser,
  type BrowserContextOptions,
  chromium,
  type Page,
} from "@playwright/test";

type Step =
  | { click: string }
  | { fill: string; value: string }
  | { press: string }
  | { waitFor: string }
  | { wait: number }
  | { eval: string };

type Shot = {
  name: string;
  path?: string;
  width?: number;
  height?: number;
  scheme?: "light" | "dark" | "both";
  storage?: Record<string, string>;
  steps?: Step[];
  element?: string;
  fullPage?: boolean;
  route?: { url: string; status?: number; body?: unknown }[];
  guest?: boolean;
};

type Config = {
  base: string;
  shots: Shot[];
  login?: { path?: string; steps: Step[] };
  storageState?: string;
};

const configPath = process.argv[2] ?? ".pr-shots.json";
const OUT = ".pr-shots";
const STEP_TIMEOUT = 10_000;
const ATTEMPTS = 3;

const config = JSON.parse(await readFile(configPath, "utf8")) as Config;
await mkdir(OUT, { recursive: true });

const lastCommit =
  Number(
    spawnSync("git", ["log", "-1", "--format=%ct"], {
      encoding: "utf8",
    }).stdout.trim(),
  ) * 1000;
if (lastCommit && (await stat(configPath)).mtimeMs < lastCommit) {
  console.warn(
    `! ${configPath} is older than this branch's last commit: is it the previous unit's? Rewrite it.`,
  );
}

// One request per path before shooting: the cold compile happens here, not in the shot.
for (const path of new Set(config.shots.map((s) => s.path ?? "/"))) {
  await fetch(config.base + path, {
    redirect: "manual",
    signal: AbortSignal.timeout(180_000),
  }).catch(() => {});
}

// `${NAME}` in a step's value: from .env.test.local, then the environment.
const testEnv: Record<string, string> = {};
if (existsSync(".env.test.local")) {
  for (const line of readFileSync(".env.test.local", "utf8").split(/\r?\n/)) {
    const m = line.match(
      /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/,
    );
    if (m) testEnv[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
}
function fromEnv(value: string): string {
  return value.replace(
    /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g,
    (whole, name: string) => {
      const found = testEnv[name] ?? process.env[name];
      if (found === undefined)
        console.warn(
          `! \${${name}} is not in .env.test.local or the environment`,
        );
      return found ?? whole;
    },
  );
}

async function launchBrowser(): Promise<Browser> {
  const args = ["--disable-gpu"];
  const executablePath = process.env.PW_CHROMIUM_PATH;
  const channel = process.env.PW_CHANNEL;
  if (executablePath || channel)
    return chromium.launch({ args, executablePath, channel });
  try {
    return await chromium.launch({ args });
  } catch (error) {
    if (!/Executable doesn't exist/.test((error as Error).message)) throw error;
    for (const installed of ["msedge", "chrome"]) {
      try {
        const browser = await chromium.launch({ args, channel: installed });
        console.warn(
          `! This Playwright's Chromium is not installed: using ${installed}.`,
        );
        return browser;
      } catch {
        // not installed either: try the next one
      }
    }
    throw new Error(
      "This Playwright's Chromium is not installed, and neither Edge nor Chrome was found.\n" +
        "Install it: node node_modules/@playwright/test/cli.js install chromium (or set PW_CHROMIUM_PATH).",
    );
  }
}

async function runSteps(page: Page, steps: Step[]) {
  for (const step of steps) {
    if ("click" in step)
      await page.locator(step.click).first().click({ timeout: STEP_TIMEOUT });
    else if ("fill" in step)
      await page
        .locator(step.fill)
        .first()
        .fill(fromEnv(step.value), { timeout: STEP_TIMEOUT });
    else if ("press" in step) await page.keyboard.press(step.press);
    else if ("waitFor" in step)
      await page
        .locator(step.waitFor)
        .first()
        .waitFor({ timeout: STEP_TIMEOUT });
    else if ("wait" in step) await page.waitForTimeout(step.wait);
    else if ("eval" in step) await page.evaluate(step.eval);
  }
}

const browser = await launchBrowser();
const written: string[] = [];
const failed: string[] = [];

// The session every shot starts with (unless `guest`): a saved state, or a login done once.
let session: BrowserContextOptions["storageState"] = config.storageState;
// Up to 3 attempts, like the shots: the first one failed on a cold browser start (kit test).
for (let attempt = 1; config.login && attempt <= ATTEMPTS; attempt++) {
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  try {
    await page.goto(config.base + (config.login.path ?? "/login"), {
      waitUntil: "load",
      timeout: 60_000,
    });
    await runSteps(page, config.login.steps);
    session = await context.storageState();
    await context.close();
    break;
  } catch (error) {
    await context.close();
    if (attempt === ATTEMPTS) {
      console.warn(
        `! login failed (${(error as Error).message.split("\n")[0]}): the shots go out without a session.`,
      );
    }
  }
}

for (const shot of config.shots) {
  const schemes =
    shot.scheme === "both"
      ? (["light", "dark"] as const)
      : ([shot.scheme ?? "light"] as const);

  for (const scheme of schemes) {
    const file = `${OUT}/${shot.name}${shot.scheme === "both" ? `-${scheme}` : ""}.png`;

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      const context = await browser.newContext({
        viewport: { width: shot.width ?? 1280, height: shot.height ?? 800 },
        colorScheme: scheme,
        reducedMotion: "reduce",
        serviceWorkers: "block",
        deviceScaleFactor: 1,
        storageState: shot.guest ? undefined : session,
      });
      if (shot.storage) {
        await context.addInitScript((entries: Record<string, string>) => {
          for (const [k, v] of Object.entries(entries))
            localStorage.setItem(k, v);
        }, shot.storage);
      }
      for (const r of shot.route ?? []) {
        await context.route(r.url, (route) =>
          route.fulfill({
            status: r.status ?? 200,
            contentType:
              typeof r.body === "string" ? "text/plain" : "application/json",
            body:
              typeof r.body === "string"
                ? r.body
                : JSON.stringify(r.body ?? {}),
          }),
        );
      }
      const page = await context.newPage();
      try {
        await page.goto(config.base + (shot.path ?? "/"), {
          waitUntil: "load",
          timeout: 30_000,
        });
        await runSteps(page, shot.steps ?? []);
        if (shot.element) {
          await page
            .locator(shot.element)
            .first()
            .screenshot({ path: file, timeout: STEP_TIMEOUT });
        } else {
          await page.screenshot({
            path: file,
            fullPage: shot.fullPage ?? false,
            timeout: STEP_TIMEOUT,
          });
        }
        written.push(file);
        await context.close();
        break;
      } catch (error) {
        await context.close();
        if (attempt === ATTEMPTS)
          failed.push(`${file} — ${(error as Error).message.split("\n")[0]}`);
      }
    }
  }
}

await browser.close();

console.log(
  `Screenshots written (${written.length}):\n  ${written.join("\n  ") || "—"}`,
);
if (failed.length)
  console.log(
    `\nCould not be taken (${failed.length}):\n  ${failed.join("\n  ")}`,
  );
process.exit(written.length === 0 && failed.length > 0 ? 1 : 0);
