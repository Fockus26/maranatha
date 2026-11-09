/**
 * Affected tests — runs only the tests whose import graph touches a changed file.
 *
 * Usage (from the project root):
 *   bun run test:related                         # = bun scripts/test-related.ts; changes vs. origin/main + uncommitted
 *   bun scripts/test-related.ts --base=main
 *   bun scripts/test-related.ts --list           # only lists, does not run
 *   bun scripts/test-related.ts --dir=tests/unit  # only the tests in that folder (repeatable)
 *
 * `--dir` replaces the default folders (`tests/`, `src/`). A project with integration tests
 * that need something running (an emulator, a database) puts it in its `test:related`
 * script, so they stay out: otherwise a change in package.json runs everything and fails
 * without the emulator (inversiones-js, `tests/rules` with Firebase).
 *
 * How it decides: for each test file it follows its imports (relative and tsconfig aliases,
 * e.g. `@/…`) all the way down, and picks it if any of those files changed. So a change in
 * achievements does NOT run the tutorial's test… unless the tutorial imports something from
 * achievements, which is exactly when it should run.
 *
 * It is for the agent's work loop (fast and with little output). **It does not replace the
 * full suite**: CI runs that on every PR. If something that is not importable code changed
 * (lockfile, tsconfig, bundler config, package.json dependencies or scripts, the runner
 * itself), it runs everything to be safe. Bumping only the `version` does not count.
 *
 * Validated on World Flags (real commits): the streak panel → 0 tests; an achievements fix
 * → its test + the changelog's (which reads it with fs); a change in `learning-storage.ts`
 * → sync, achievements, sound preference and the tutorial guard.
 */

import { existsSync, readFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { Glob } from 'bun'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const base = args.find((a) => a.startsWith('--base='))?.slice(7) ?? 'origin/main'
const listOnly = args.includes('--list')

const dirs = args.filter((a) => a.startsWith('--dir=')).map((a) => a.slice(6).replace(/[\\/]+$/, ''))
const TEST_GLOBS = (dirs.length ? dirs : ['tests', 'src']).map((d) => `${d}/**/*.test.{ts,tsx}`)
// If any of this changes, the graph is not enough: the whole suite runs.
// (`package.json` is handled apart: bumping only the `version` is no reason, it happens in almost every PR.)
const RUN_ALL_IF_CHANGED = [
  /^bun\.lockb?$/, /^tsconfig.*\.json$/, /^bunfig\.toml$/,
  /(^|\/)(astro|vite|next|vitest)\.config\.\w+$/, /^scripts\/test-related\.ts$/,
]

const sh = (cmd: string[]) => {
  const p = Bun.spawnSync(cmd, { cwd: ROOT, stdout: 'pipe', stderr: 'pipe' })
  return p.success ? p.stdout.toString() : ''
}

const changed = new Set(
  [
    sh(['git', 'diff', '--name-only', `${base}...HEAD`]),
    sh(['git', 'diff', '--name-only', 'HEAD']),
    sh(['git', 'ls-files', '--others', '--exclude-standard']),
  ]
    .join('\n')
    .split('\n')
    .map((f) => f.trim().replaceAll('\\', '/'))
    .filter(Boolean),
)

const tests = TEST_GLOBS.flatMap((g) => [...new Glob(g).scanSync(ROOT)]).map((f) => f.replaceAll('\\', '/'))

function runAll(reason: string): string[] {
  console.log(`→ Full suite (${reason}).`)
  return tests
}

const transpiler = new Bun.Transpiler({ loader: 'tsx' })
const graphCache = new Map<string, Set<string>>()

/** Project files (relative to ROOT) that `file` imports, directly or indirectly. */
function dependencies(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen
  seen.add(file)
  const abs = resolve(ROOT, file)
  if (!/\.(m?[jt]sx?)$/.test(file) || !existsSync(abs)) return seen

  let imports: { path: string }[] = []
  try {
    imports = transpiler.scanImports(readFileSync(abs, 'utf8'))
  } catch {
    return seen // a file the transpiler does not understand: it stays a leaf
  }

  for (const { path } of imports) {
    const spec = path.split('?')[0] // `./CHANGELOG.md?raw` → `./CHANGELOG.md`
    let target: string
    try {
      target = Bun.resolveSync(spec, dirname(abs)) // respects tsconfig aliases
    } catch {
      continue
    }
    const rel = relative(ROOT, target).replaceAll('\\', '/')
    if (rel.startsWith('..') || rel.includes('node_modules/')) continue // external dependencies
    dependencies(rel, seen)
  }
  return seen
}

/** Did something other than the `version` line change in `package.json`? */
function packageJsonChangedBeyondVersion(): boolean {
  const diff = [
    sh(['git', 'diff', '-U0', `${base}...HEAD`, '--', 'package.json']),
    sh(['git', 'diff', '-U0', 'HEAD', '--', 'package.json']),
  ].join('\n')
  return diff
    .split('\n')
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .some((l) => !/^[+-]\s*"version"\s*:/.test(l))
}

/** Files a test reads by name instead of importing them (`readFileSync("CHANGELOG.md")`). */
function mentionsChangedFile(test: string): boolean {
  const source = readFileSync(resolve(ROOT, test), 'utf8')
  return [...changed].some((f) => {
    const name = f.split('/').pop() ?? f
    return !/\.(m?[jt]sx?)$/.test(name) && source.includes(name)
  })
}

function selectTests(): string[] {
  if (changed.size === 0) return []
  const trigger = [...changed].find((f) => RUN_ALL_IF_CHANGED.some((re) => re.test(f)))
  if (trigger) return runAll(`${trigger} changed`)
  if (changed.has('package.json') && packageJsonChangedBeyondVersion()) {
    return runAll('dependencies or scripts changed in package.json')
  }

  return tests.filter((test) => {
    if (changed.has(test)) return true
    let deps = graphCache.get(test)
    if (!deps) {
      deps = dependencies(test)
      graphCache.set(test, deps)
    }
    return [...deps].some((d) => changed.has(d)) || mentionsChangedFile(test)
  })
}

const selected = selectTests()

if (tests.length === 0) {
  console.log('→ The project has no tests yet (tests/unit/ or src/**/*.test.ts).')
  process.exit(0)
}

if (selected.length === 0) {
  console.log(changed.size === 0 ? '→ No changes: no tests to run.' : '→ No test depends on what changed.')
  process.exit(0)
}

console.log(`→ ${selected.length}/${tests.length} affected tests:\n  ${selected.join('\n  ')}`)
if (listOnly) process.exit(0)

// `--dots`: one dot per passing test and the full detail only for the failing ones.
const run = Bun.spawnSync(['bun', 'test', '--dots', ...selected.map((t) => `./${t}`)], {
  cwd: ROOT,
  stdout: 'inherit',
  stderr: 'inherit',
})
process.exit(run.exitCode ?? 1)
