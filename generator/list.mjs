#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { sitesDir } from './scaffold.mjs'

if (!fs.existsSync(sitesDir)) { console.log('No sites yet.'); process.exit(0) }
const rows = fs.readdirSync(sitesDir)
  .filter((d) => fs.existsSync(path.join(sitesDir, d, 'salon.config.json')))
  .map((d) => JSON.parse(fs.readFileSync(path.join(sitesDir, d, 'salon.config.json'), 'utf8')))

if (!rows.length) { console.log('No sites yet.'); process.exit(0) }
console.log(`\n${rows.length} site${rows.length === 1 ? '' : 's'}\n`)
for (const r of rows) {
  const ready = r.photoSource === 'owner' ? '\x1b[32mready\x1b[0m' : '\x1b[33mpreview\x1b[0m'
  console.log(`  ${ready}  ${r.slug.padEnd(38)} ${String(r.theme).padEnd(17)} ${r.rating ?? '—'}★  ${r.address?.city ?? ''}`)
}
console.log()
