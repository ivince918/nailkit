#!/usr/bin/env node
/*
 * Launch gate. Google's Places policy does not let you host their photo content
 * as a business's permanent site imagery, and their structured-data policy bars
 * marking up third-party ratings as your own. This blocks a site from being
 * called launch-ready until those are handled.
 */
import fs from 'node:fs'
import path from 'node:path'
import { sitesDir } from './scaffold.mjs'

const slug = process.argv[2]
if (!slug) { console.error('Usage: npm run check -- <slug>'); process.exit(1) }

const dir = path.join(sitesDir, slug)
const cfgPath = path.join(dir, 'salon.config.json')
if (!fs.existsSync(cfgPath)) { console.error(`No site "${slug}".`); process.exit(1) }
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))

const fail = [], warn = [], pass = []

const SOURCE_NOTE = {
  google: 'Photos came from the Google Places API — licensed for the pitch preview only.',
  preview: 'Photos are generated placeholders, not real salon photography.',
  yelp: 'Photos were saved from the salon\'s Yelp page: fine for the pitch preview, not for a live site without the owner\'s own copies or permission.',
}
cfg.photoSource === 'owner'
  ? pass.push('Photos are owner-supplied')
  : fail.push(`${SOURCE_NOTE[cfg.photoSource] || 'Photos are not owner-supplied.'} Replace sites/${slug}/public/photos/, then set "photoSource": "owner" in salon.config.json.`)

cfg.photos?.length >= 6 ? pass.push(`${cfg.photos.length} photos`) : warn.push(`Only ${cfg.photos?.length ?? 0} photos — the gallery section stays hidden until there are 6+.`)

// A preview deploy ships public/_headers with X-Robots-Tag: noindex so the
// temporary URL never gets indexed under the salon's name. It must not go live.
const headersPath = path.join(dir, 'public', '_headers')
if (fs.existsSync(headersPath) && /noindex/i.test(fs.readFileSync(headersPath, 'utf8')))
  fail.push(`public/_headers still carries noindex (preview-only). Delete sites/${slug}/public/_headers before launch.`)
else pass.push('No preview noindex header')
cfg.phone ? pass.push(`Phone ${cfg.phoneDisplay}`) : fail.push('No phone number.')
cfg.hours?.some((h) => !h.closed) ? pass.push('Hours set') : fail.push('No opening hours.')
cfg.address?.line1 ? pass.push('Street address set') : fail.push('No street address.')
cfg.reviews?.length ? pass.push(`${cfg.reviews.length} reviews`) : warn.push('No reviews — the testimonials section will not render.')
cfg.showPrices
  ? pass.push('Prices enabled')
  : warn.push('Prices off (services show "Call"). Turn on only with prices the owner confirmed.')
cfg.bookingUrl ? pass.push('Booking link set') : warn.push('No booking link — CTAs fall back to tel:.')
cfg.social?.instagram || cfg.social?.facebook ? pass.push('Social linked') : warn.push('No Instagram/Facebook linked.')

const g = (s) => `\x1b[32m${s}\x1b[0m`, y = (s) => `\x1b[33m${s}\x1b[0m`, r = (s) => `\x1b[31m${s}\x1b[0m`
console.log(`\n${slug}\n`)
pass.forEach((m) => console.log(`  ${g('ok')}    ${m}`))
warn.forEach((m) => console.log(`  ${y('warn')}  ${m}`))
fail.forEach((m) => console.log(`  ${r('FAIL')}  ${m}`))
console.log(fail.length ? `\n${r('Not launch-ready.')} ${fail.length} blocker${fail.length === 1 ? '' : 's'}.\n` : `\n${g('Launch-ready.')}${warn.length ? ` ${warn.length} optional item${warn.length === 1 ? '' : 's'} left.` : ''}\n`)
process.exit(fail.length ? 1 : 0)
