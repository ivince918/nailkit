#!/usr/bin/env node
/*
 * nailkit — Google Maps listing to a finished nail salon site.
 *
 *   npm run new -- "https://maps.app.goo.gl/xxxxx"
 *   npm run new -- "Heavenly Nail Spa, Palo Alto CA"
 *   npm run new -- "<url>" --theme=sage-minimal --booking=https://...
 *   npm run new -- --manual
 */

import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline/promises'
import { loadEnv } from './env.mjs'
import { parseInput, searchPlace, getDetails, fetchPhoto } from './places.mjs'
import { deriveConfig, slugify } from './derive.mjs'
import { scaffoldSite, ROOT, sitesDir } from './scaffold.mjs'
import { THEME_IDS } from '../packages/template/src/themes.js'

loadEnv(ROOT)

const argv = process.argv.slice(2)
const flags = Object.fromEntries(
  argv.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=')
    return [k, v === undefined ? true : v]
  })
)
const input = argv.find((a) => !a.startsWith('--'))

const c = { dim: (s) => `\x1b[2m${s}\x1b[0m`, ok: (s) => `\x1b[32m${s}\x1b[0m`, b: (s) => `\x1b[1m${s}\x1b[0m`, y: (s) => `\x1b[33m${s}\x1b[0m`, r: (s) => `\x1b[31m${s}\x1b[0m` }
const step = (n, msg) => console.log(`${c.dim(`[${n}/5]`)} ${msg}`)

async function manualFlow() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  const ask = async (q, dflt = '') => (await rl.question(`${q}${dflt ? c.dim(` (${dflt})`) : ''}: `)).trim() || dflt

  console.log(c.b('\nManual mode — no API key needed. Copy these off the Google Maps listing.\n'))
  const name = await ask('Salon name')
  const line1 = await ask('Street address')
  const city = await ask('City')
  const state = await ask('State', 'CA')
  const zip = await ask('ZIP')
  const phoneDisplay = await ask('Phone as displayed', '(555) 555-5555')
  const rating = Number(await ask('Google rating', '4.8'))
  const reviewCount = Number(await ask('Review count', '100'))
  const openTime = await ask('Opens (24h)', '09:30')
  const closeTime = await ask('Closes (24h)', '19:00')
  const closedDay = await ask('Closed day (none/sun/mon)', 'none')
  await rl.close()

  const digits = phoneDisplay.replace(/\D/g, '')
  const closedIdx = { sun: 0, mon: 1 }[closedDay.toLowerCase()] ?? -1

  // Shaped exactly like a Places API payload so deriveConfig stays the only path.
  return {
    id: `manual-${slugify(name, city)}`,
    displayName: { text: name },
    formattedAddress: `${line1}, ${city}, ${state} ${zip}`,
    addressComponents: [
      { types: ['street_number'], shortText: line1.split(' ')[0], longText: line1.split(' ')[0] },
      { types: ['route'], shortText: line1.split(' ').slice(1).join(' '), longText: line1.split(' ').slice(1).join(' ') },
      { types: ['locality'], shortText: city, longText: city },
      { types: ['administrative_area_level_1'], shortText: state, longText: state },
      { types: ['postal_code'], shortText: zip, longText: zip },
    ],
    nationalPhoneNumber: phoneDisplay,
    rating, userRatingCount: reviewCount,
    googleMapsUri: `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${city} ${state}`)}`,
    utcOffsetMinutes: -420,
    regularOpeningHours: {
      periods: [0, 1, 2, 3, 4, 5, 6].filter((d) => d !== closedIdx).map((d) => ({
        open: { day: d, hour: Number(openTime.split(':')[0]), minute: Number(openTime.split(':')[1]) },
        close: { day: d, hour: Number(closeTime.split(':')[0]), minute: Number(closeTime.split(':')[1]) },
      })),
    },
    reviews: [], photos: [],
  }
}

async function main() {
  if (flags.help || (!input && !flags.manual && !flags.demo && !flags.from)) {
    console.log(`
${c.b('nailkit')} — generate a nail salon site from a Google Maps listing

  ${c.b('npm run new --')} "https://maps.app.goo.gl/xxxx"
  ${c.b('npm run new --')} "Heavenly Nail Spa, Palo Alto CA"
  ${c.b('npm run new --')} --manual

Flags
  --theme=<id>       force a theme (${THEME_IDS.join(', ')})
  --booking=<url>    online booking link, if the salon has one
  --place-id=<id>    skip the search step
  --photos=<n>       how many photos to pull (default 10, max 10)
  --force            overwrite an existing site folder
  --from=<file>      build from a hand-written listing file (no API key)
  --demo             build a demo salon with placeholder art, zero API calls
  --name= --city=    rename the demo salon (use with --demo)
`)
    process.exit(0)
  }

  if (flags.theme && !THEME_IDS.includes(flags.theme)) {
    console.error(c.r(`Unknown theme "${flags.theme}". Options: ${THEME_IDS.join(', ')}`))
    process.exit(1)
  }

  let details
  let photoBuffers = []

  let inputTags = []

  if (flags.from) {
    const { inputToDetails } = await import('./fromInput.mjs')
    const raw = JSON.parse(fs.readFileSync(path.resolve(ROOT, flags.from), 'utf8'))
    step(1, `Reading ${c.b(flags.from)}`)
    details = inputToDetails(raw)
    inputTags = raw.tags || []
    if (raw.theme && !flags.theme) flags.theme = raw.theme
    if (raw.bookingUrl && !flags.booking) flags.booking = raw.bookingUrl
    step(2, `${c.b(details.displayName.text)} · ${details.rating ?? '—'}★ (${details.userRatingCount ?? 0}) · ${details.formattedAddress}`)
    step(3, 'Generating preview photos')
    const { demoPhotos } = await import('./demo.mjs')
    photoBuffers = await demoPhotos(Number(flags.photos) || 10)
  } else if (flags.demo) {
    const { demoDetails, demoPhotos } = await import('./demo.mjs')
    step(1, 'Building demo salon (no API calls)')
    details = demoDetails({ name: flags.name, city: flags.city, state: flags.state })
    step(2, 'Using bundled listing data')
    step(3, 'Generating placeholder photos')
    photoBuffers = await demoPhotos(10)
  } else if (flags.manual) {
    details = await manualFlow()
  } else {
    step(1, `Resolving ${c.b(input)}`)
    let placeId = flags['place-id']
    if (!placeId) {
      const parsed = await parseInput(input)
      placeId = parsed.placeId || (await searchPlace(parsed))
    }
    console.log(`      place ID ${c.dim(placeId)}`)

    step(2, 'Fetching listing details')
    details = await getDetails(placeId)
    console.log(`      ${c.b(details.displayName?.text)} · ${details.rating ?? '—'}★ (${details.userRatingCount ?? 0} reviews) · ${details.formattedAddress}`)

    const wanted = Math.min(Number(flags.photos) || 10, 10)
    const photoRefs = (details.photos || []).slice(0, wanted)
    step(3, `Downloading ${photoRefs.length} photo${photoRefs.length === 1 ? '' : 's'}`)
    for (const [i, p] of photoRefs.entries()) {
      try {
        const data = await fetchPhoto(p.name)
        photoBuffers.push({ data, attribution: p.authorAttributions?.[0]?.displayName || null })
        process.stdout.write(`\r      ${i + 1}/${photoRefs.length}`)
      } catch (e) {
        console.warn(`\n      ${c.y('skipped a photo:')} ${e.message}`)
      }
    }
    if (photoRefs.length) process.stdout.write('\n')
  }

  step(4, 'Deriving content')
  const config = deriveConfig(details, {
    themeOverride: flags.theme || null,
    bookingUrl: flags.booking || null,
    tags: inputTags,
    photoSource: (flags.from || flags.demo) ? 'preview' : 'google',
  })
  if (!flags.theme) {
    const { pickThemeForCity } = await import('./pickThemeForCity.mjs')
    config.theme = pickThemeForCity(config.address?.city, config.placeId || config.slug, config.slug)
  }

  console.log(`      theme ${c.b(config.theme)} · ${config.services.length} service categories · ${config.reviews.length} reviews kept`)

  const dir = path.join(sitesDir, config.slug)
  if (fs.existsSync(dir) && !flags.force) {
    console.error(c.r(`\nsites/${config.slug} already exists. Re-run with --force to overwrite.`))
    process.exit(1)
  }

  step(5, 'Writing site')
  await scaffoldSite(config, photoBuffers)

  console.log(`
${c.ok('Done.')} ${c.b(`sites/${config.slug}`)}

  ${c.b('npm install')}                      ${c.dim('# once, to link the new workspace')}
  ${c.b(`npm run dev -- ${config.slug}`)}
  ${c.b(`npm run deploy -- ${config.slug}`)}

  ${c.y('Before launch:')} ${(flags.demo || flags.from)
    ? 'these are generated placeholders — swap in the salon\'s real photos.'
    : 'photos came from Google and are for the pitch preview only. Swap in the'}
  ${(flags.demo || flags.from) ? '' : "owner's own photos, then set \"photoSource\": \"owner\"."} Verify with ${c.b(`npm run check -- ${config.slug}`)}.
`)
}

main().catch((e) => {
  console.error(`\n${c.r('Failed:')} ${e.message}\n`)
  process.exit(1)
})
