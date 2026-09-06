#!/usr/bin/env node
/* npm run dev -- <slug>  |  npm run build -- <slug|all> */
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { ROOT, sitesDir } from './scaffold.mjs'

const [mode, slugArg] = [process.argv[2], process.argv[3]]
const all = fs.existsSync(sitesDir) ? fs.readdirSync(sitesDir).filter((d) => fs.existsSync(path.join(sitesDir, d, 'package.json'))) : []

if (!all.length) { console.error('No sites yet. Run: npm run new -- "<maps url>"'); process.exit(1) }

const targets = slugArg === 'all' ? all : [slugArg || all[0]]
for (const slug of targets) {
  if (!all.includes(slug)) { console.error(`No site "${slug}". Have: ${all.join(', ')}`); process.exit(1) }
  console.log(`\n\x1b[1m${mode} → ${slug}\x1b[0m`)
  const r = spawnSync('npm', ['run', mode, '-w', `site-${slug}`], { cwd: ROOT, stdio: 'inherit' })
  if (r.status !== 0) process.exit(r.status ?? 1)
}
