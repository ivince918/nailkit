#!/usr/bin/env node
/* npm run deploy -- <slug> [--prod] — thin wrapper over the Vercel CLI. */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { sitesDir } from './scaffold.mjs'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
const prod = args.includes('--prod')
if (!slug) { console.error('Usage: npm run deploy -- <slug> [--prod]'); process.exit(1) }

const dir = path.join(sitesDir, slug)
if (!fs.existsSync(dir)) { console.error(`No site "${slug}".`); process.exit(1) }

if (spawnSync('vercel', ['--version'], { stdio: 'ignore' }).error) {
  console.error('Vercel CLI not found. Install it with:  npm i -g vercel')
  process.exit(1)
}

console.log(`Deploying ${slug}${prod ? ' to production' : ' as a preview'}...`)
const r = spawnSync('vercel', ['deploy', ...(prod ? ['--prod'] : []), '--yes'], { cwd: dir, stdio: 'inherit' })
process.exit(r.status ?? 1)
