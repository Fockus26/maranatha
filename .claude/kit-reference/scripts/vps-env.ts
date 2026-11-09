#!/usr/bin/env bun
/**
 * Writes DATABASE_URL and DIRECT_URL for this project's database on César's VPS into
 * .env.development.local, without printing them.
 *
 *   bun run vps:env <database>          (package.json: "vps:env": "bun scripts/vps-env.ts")
 *
 * It asks the VPS through the `kit-vps` SSH alias (reference/VPS-POSTGRES.md): `kit-db url`
 * is the only place the password exists. Why a script and not "copy the output": the URL
 * carries the password, and anything printed ends up in the session transcript. Why not
 * .env.local: `vercel env pull` overwrites it, and the kit forbids editing it by hand
 * (world-flags). This file wins over it in dev and survives the pull.
 *
 * Existing DATABASE_URL / DIRECT_URL lines are replaced; every other line is kept.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const db = process.argv[2]
if (!db || !/^[a-z][a-z0-9_]{1,40}$/.test(db)) {
  console.error('Usage: bun run vps:env <database>   (the name used in kit-db create)')
  process.exit(1)
}

function kitDb(...args: string[]): string {
  const r = Bun.spawnSync(['ssh', '-o', 'BatchMode=yes', 'kit-vps', 'kit-db', 'url', db, ...args])
  if (r.exitCode !== 0) {
    // stderr carries no secret: kit-db only prints the URL on stdout.
    console.error(r.stderr.toString().trim() || 'ssh kit-vps failed: is the alias set up? (reference/VPS-POSTGRES.md)')
    process.exit(1)
  }
  return r.stdout.toString().trim()
}

const values: Record<string, string> = {
  DATABASE_URL: kitDb(),
  DIRECT_URL: kitDb('--direct'),
}

const file = '.env.development.local'
const lines = existsSync(file) ? readFileSync(file, 'utf8').split(/\r?\n/) : []
const NOTE = '# Postgres on the VPS (bun run vps:env). DIRECT_URL needs: ssh -N -L 5433:127.0.0.1:5432 kit-vps'
const kept = lines.filter((l) => !/^(DATABASE_URL|DIRECT_URL)=/.test(l) && l !== NOTE)
while (kept.length && kept[kept.length - 1] === '') kept.pop()
kept.push(
  NOTE,
  ...Object.entries(values).map(([k, v]) => `${k}=${v}`),
  '',
)
writeFileSync(file, kept.join('\n'))
console.log(`✓ ${file}: DATABASE_URL and DIRECT_URL for ${db} (values not shown)`)
