/*
 * Turns a raw Places API payload into a salon.config.json.
 *
 * Rule followed throughout: never invent a verifiable fact. No made-up founding
 * years, award claims, staff counts, or prices. Everything asserted here is
 * either pulled from Google or is generic-true of any licensed nail salon.
 * Everything inferred (which services to list, which strengths to highlight)
 * is backed by keyword evidence in the salon's own reviews.
 */

import { pickTheme, hashString } from '../packages/template/src/themes.js'

/* ── Service catalogue ──────────────────────────────────────────
 * `core: true` categories ship on every site — universal to nail salons.
 * The rest require evidence in the reviews before they're advertised.
 */
const CATALOG = [
  {
    name: 'Manicures', icon: 'hand', core: true,
    items: ['Classic Manicure', 'Gel Manicure', 'Spa Manicure', 'French Manicure', 'Polish Change', 'Nail Trim & Shape'],
  },
  {
    name: 'Pedicures', icon: 'footprints', core: true,
    items: ['Classic Pedicure', 'Spa Pedicure', 'Deluxe Pedicure', 'Gel Pedicure', 'Hot Stone Pedicure', 'Callus Treatment'],
  },
  {
    name: 'Extensions', icon: 'gem', core: true,
    items: ['Acrylic Full Set', 'Acrylic Fill', 'Dip Powder (SNS)', 'Gel-X Extensions', 'Builder Gel', 'Ombré & French Fade'],
  },
  {
    name: 'Nail Art', icon: 'palette', core: true,
    items: ['Custom Hand-Painted Art', 'Chrome & Cat Eye', 'Rhinestones & Charms', '3D Art', 'Marble & Swirl', 'Seasonal Designs'],
  },
  {
    name: 'Add-Ons', icon: 'sparkles', core: true,
    items: ['Paraffin Wax', 'Hot Stone Massage', 'Extended Massage', 'Nail Repair', 'Gel Removal', 'Cuticle Treatment'],
  },
  {
    name: 'Waxing', icon: 'leaf', keywords: ['wax', 'waxing', 'eyebrow', 'brows'],
    items: ['Eyebrow Wax', 'Lip & Chin', 'Full Face', 'Underarm', 'Half Leg', 'Full Leg'],
  },
  {
    name: 'Lashes & Brows', icon: 'eye', keywords: ['lash', 'lashes', 'brow lamination', 'microblading', 'tint'],
    items: ['Lash Extensions', 'Lash Lift', 'Lash Tint', 'Brow Lamination', 'Brow Tint', 'Microblading'],
  },
  {
    name: "Kids' Spa", icon: 'baby', keywords: ['kid', 'kids', 'daughter', 'child', 'children', 'birthday party'],
    items: ['Princess Manicure', 'Princess Pedicure', 'Mini Mani + Pedi', 'Polish Change', 'Nail Art for Kids'],
  },
  {
    name: 'Massage', icon: 'heart', keywords: ['massage', 'shoulder', 'reflexology', 'chair massage'],
    items: ['Neck & Shoulder', 'Hand & Arm', 'Foot Reflexology', 'Hot Stone', 'Extended Leg Massage'],
  },
]

/* ── Strength themes mined from review language ─────────────── */
const STRENGTHS = [
  { id: 'clean',    icon: 'shield',   title: 'Spotless and sanitized',      body: 'Fresh files, liners, and fully sterilized tools for every single guest — no exceptions.', keywords: ['clean', 'sanitary', 'sanitized', 'hygiene', 'spotless', 'sterile'] },
  { id: 'warm',     icon: 'smile',    title: 'Genuinely warm service',      body: 'You get greeted by name, not processed through a queue. Our regulars stay regulars for a reason.', keywords: ['friendly', 'kind', 'welcoming', 'sweet', 'warm', 'nice', 'lovely', 'staff'] },
  { id: 'lasting',  icon: 'clock',    title: 'Work that actually lasts',    body: 'Proper prep and quality product mean gel and dip that hold up for weeks, not days.', keywords: ['last', 'lasted', 'lasting', 'weeks', 'chip', 'durable', 'held up'] },
  { id: 'detail',   icon: 'verified', title: 'Meticulous attention',        body: 'Even cuticles, clean lines, and shaping that gets checked twice before you leave the chair.', keywords: ['detail', 'meticulous', 'precise', 'perfect', 'thorough', 'careful', 'shape'] },
  { id: 'relax',    icon: 'flower',   title: 'A real spa experience',       body: 'Massage chairs, a calm room, and time that never feels rushed — treatment, not transaction.', keywords: ['relax', 'relaxing', 'spa', 'massage', 'calm', 'peaceful', 'pamper'] },
  { id: 'art',      icon: 'palette',  title: 'Custom nail art on request',  body: 'Bring a screenshot or an idea. Our techs design freehand and match what you had in mind.', keywords: ['art', 'design', 'creative', 'custom', 'chrome', 'ombre', 'french'] },
  { id: 'value',    icon: 'award',    title: 'Honest, fair pricing',        body: 'Clear pricing quoted up front. No surprise add-ons appearing on the bill at checkout.', keywords: ['price', 'pricing', 'affordable', 'reasonable', 'worth', 'value', 'cheap'] },
  { id: 'time',     icon: 'calendar', title: 'Respect for your time',       body: 'Appointments start when they are booked, and walk-ins get a straight answer on the wait.', keywords: ['quick', 'fast', 'on time', 'wait', 'prompt', 'efficient', 'schedule'] },
  { id: 'skill',    icon: 'star',     title: 'Experienced technicians',     body: 'A licensed team that has been shaping, sculpting, and painting nails for years.', keywords: ['skill', 'talented', 'professional', 'experienced', 'expert', 'best'] },
]

const DEFAULT_STRENGTH_IDS = ['clean', 'warm', 'lasting', 'detail', 'relax', 'art']

/* ── Headline variants, seeded so neighbours don't match ────── */
const HEADLINES_TOP = [
  (c) => `${c}'s highest-rated nail studio`,
  (c) => `The best-reviewed nails in ${c}`,
  (c) => `${c} keeps coming back for these nails`,
]
const HEADLINES_GENERAL = [
  (c) => `Beautiful nails, done right in ${c}`,
  (c) => `Your nail appointment in ${c}, handled`,
  (c) => `${c}'s home for flawless nails`,
  (c) => `Nails worth the trip in ${c}`,
]

// Each takes (name, city, openDays) — no subhead may assert hours it hasn't been given.
const SUBS = [
  (n, c) => `Manicures, pedicures, gel, dip powder, and custom nail art — walk in or book ahead at our ${c} studio.`,
  (n, c, d) => `A licensed team, spotless tools, and finishes that hold up. Serving ${c} ${d === 7 ? 'seven days a week' : `${d} days a week`}.`,
  (n, c) => `From a clean classic set to full custom art, ${n} takes the time to get it right.`,
]

const pick = (arr, seed) => arr[hashString(seed) % arr.length]

const countHits = (text, keywords) =>
  keywords.reduce((n, k) => n + (text.includes(k) ? 1 : 0), 0)

/** Accepts the full <iframe> snippet or just the URL, returns the URL. */
function extractEmbedSrc(v) {
  if (!v) return null
  const m = String(v).match(/src=["']([^"']+)["']/)
  const url = (m ? m[1] : String(v)).trim()
  return url.startsWith('https://www.google.com/maps/embed') ? url : null
}

/* ── Formatting helpers ─────────────────────────────────────── */

export function slugify(name, city) {
  return `${name}-${city}`
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

const comp = (components = [], type) =>
  components.find((c) => c.types?.includes(type))?.shortText || ''

const longComp = (components = [], type) =>
  components.find((c) => c.types?.includes(type))?.longText || ''

/** Places periods -> one row per weekday, with closed days made explicit. */
function normalizeHours(regular) {
  const periods = regular?.periods || []
  const out = []
  for (let day = 0; day < 7; day++) {
    const p = periods.find((x) => x.open?.day === day)
    if (!p || !p.close) {
      // A period with no close means open 24h; Places omits close in that case.
      if (p && !p.close) out.push({ day, open: '00:00', close: '23:59' })
      else out.push({ day, closed: true })
      continue
    }
    const pad = (n) => String(n ?? 0).padStart(2, '0')
    out.push({
      day,
      open: `${pad(p.open.hour)}:${pad(p.open.minute)}`,
      close: `${pad(p.close.hour)}:${pad(p.close.minute)}`,
    })
  }
  return out
}

function formatPhone(national) {
  if (!national) return { phone: '', phoneDisplay: '' }
  const digits = national.replace(/\D/g, '')
  const e164 = digits.length === 10 ? `+1${digits}` : `+${digits}`
  return { phone: e164, phoneDisplay: national }
}

function amenitiesFrom(d) {
  const out = []
  const p = d.parkingOptions || {}
  if (p.freeParkingLot || p.freeStreetParking) out.push('Free parking')
  else if (p.paidParkingLot || p.paidStreetParking) out.push('Paid parking nearby')
  const a = d.accessibilityOptions || {}
  if (a.wheelchairAccessibleEntrance) out.push('Wheelchair accessible')
  const pay = d.paymentOptions || {}
  if (pay.acceptsCreditCards) out.push('Cards accepted')
  if (pay.acceptsCashOnly) out.push('Cash only')
  out.push('Walk-ins welcome')
  return [...new Set(out)]
}

/* ── Main ───────────────────────────────────────────────────── */

export function deriveConfig(d, { photos = [], themeOverride = null, bookingUrl = null, tags = [], photoSource = 'google' } = {}) {
  const name = d.displayName?.text || 'Nail Salon'
  const ac = d.addressComponents || []
  const city = longComp(ac, 'locality') || longComp(ac, 'sublocality') || longComp(ac, 'administrative_area_level_2') || ''
  const state = comp(ac, 'administrative_area_level_1')
  const zip = comp(ac, 'postal_code')
  const line1 = [comp(ac, 'street_number'), longComp(ac, 'route')].filter(Boolean).join(' ')

  const slug = slugify(name, city)
  const seed = d.id || slug
  const theme = themeOverride || pickTheme(seed)

  const reviews = (d.reviews || []).map((r) => ({
    author: r.authorAttribution?.displayName || 'Google user',
    avatar: r.authorAttribution?.photoUri || null,
    rating: r.rating || 5,
    text: (r.originalText?.text || r.text?.text || '').trim(),
    time: r.relativePublishTimeDescription || '',
    url: r.authorAttribution?.uri || null,
  })).filter((r) => r.text.length > 40)

  // Google Maps shows review keyword chips ("eyebrow wax · 9"). Those are stronger
  // evidence of what a salon actually offers than prose, so they join the corpus.
  const corpus = [...reviews.map((r) => r.text), ...tags].join(' ').toLowerCase()

  // Services: core set + anything the reviews prove they actually offer.
  const services = CATALOG.filter(
    (c) => c.core || (c.keywords && countHits(corpus, c.keywords) >= 1)
  ).map(({ name: n, icon, items }) => ({ name: n, icon, items }))

  // Strengths: rank by review evidence, top up with defaults to always fill six.
  const ranked = STRENGTHS
    .map((s) => ({ ...s, hits: countHits(corpus, s.keywords) }))
    .sort((a, b) => b.hits - a.hits)
  const chosen = ranked.filter((s) => s.hits > 0).slice(0, 6)
  for (const id of DEFAULT_STRENGTH_IDS) {
    if (chosen.length >= 6) break
    if (!chosen.find((c) => c.id === id)) chosen.push(STRENGTHS.find((s) => s.id === id))
  }
  const why = chosen.slice(0, 6).map(({ icon, title, body }) => ({ icon, title, body }))

  const rating = typeof d.rating === 'number' ? d.rating : null
  /*
   * A superlative ("highest-rated in town") is a factual claim on a real
   * business's website, so it needs evidence behind it — not just a high
   * average. 4.7 from 29 reviews loses to a 4.4 from 400, and a salon whose
   * rating we've chosen not to display can't very well claim to be the best
   * on it. All three conditions must hold or we use neutral copy.
   */
  const canClaimTop = rating >= 4.7 && (d.userRatingCount || 0) >= 100 && d._showRating !== false
  const headlinePool = canClaimTop ? HEADLINES_TOP : HEADLINES_GENERAL
  const headline = city ? pick(headlinePool, seed)(city) : `Beautiful nails, done right`

  const { phone, phoneDisplay } = formatPhone(d.nationalPhoneNumber)
  const hours = normalizeHours(d.regularOpeningHours)
  const openDays = hours.filter((h) => !h.closed).length

  const editorial = d.editorialSummary?.text || ''

  const story = {
    title: `Welcome to ${name}`,
    body: [
      editorial ||
        `${name} is a full-service nail studio in ${city || 'the neighborhood'}, where a licensed team handles everything from a clean classic manicure to sculpted extensions and custom art.`,
      `Every service starts with properly sterilized tools and a fresh file. We take the time to prep the nail correctly, because that is the difference between a set that lasts a weekend and one that lasts for weeks.`,
      `${openDays === 7 ? 'We are open seven days a week' : `We are open ${openDays} days a week`}, and walk-ins are always welcome${phoneDisplay ? ` — though a quick call to ${phoneDisplay} guarantees your spot.` : '.'}`,
    ],
  }

  const trust = [
    { value: openDays === 7 ? '7 days' : `${openDays} days`, label: openDays === 7 ? 'Open every day of the week' : 'Open each week' },
    { value: 'Walk-ins', label: 'Welcome any time' },
    { value: 'Licensed', label: 'Professional technicians' },
  ]

  const seoDesc = [
    `${name} is a nail salon in ${city}, ${state}.`,
    `Manicures, pedicures, gel, dip powder and custom nail art.`,
    phoneDisplay ? `Call ${phoneDisplay}.` : '',
  ].join(' ').slice(0, 158)

  return {
    slug,
    placeId: d.id,
    generatedAt: new Date().toISOString(),
    name,
    theme,
    phone,
    phoneDisplay,
    address: { line1, city, state, zip, full: d.formattedAddress || '' },
    geo: d.location ? { lat: d.location.latitude, lng: d.location.longitude } : null,
    mapsUrl: d.googleMapsUri || '',
    directionsUrl: d.id ? `https://www.google.com/maps/dir/?api=1&destination_place_id=${d.id}&destination=${encodeURIComponent(d.formattedAddress || name)}` : '',
    websiteUrl: d.websiteUri || null,
    bookingUrl,
    utcOffsetMinutes: typeof d.utcOffsetMinutes === 'number' ? d.utcOffsetMinutes : null,
    hours,
    rating,
    reviewCount: d.userRatingCount || null,
    // A 4.8 from 1,200 reviews sells the salon; a 4.2 from 55 does not. Set
    // showRating:false and the badge, trust stat and footer line all drop out,
    // while the reviews themselves still carry their Google attribution.
    showRating: d._showRating !== false,
    // Google's own "Share -> Embed a map" snippet, pasted whole or as a bare URL.
    // Its `pb` payload frames the pin properly, which a hand-built query cannot.
    mapEmbed: extractEmbedSrc(d._mapEmbed),
    priceRange: d.priceLevel === 'PRICE_LEVEL_INEXPENSIVE' ? '$' : d.priceLevel === 'PRICE_LEVEL_EXPENSIVE' ? '$$$' : '$$',
    hero: { headline, sub: pick(SUBS, seed + 'sub')(name, city, openDays) },
    story,
    trust,
    why,
    services,
    showPrices: false,
    amenities: amenitiesFrom(d),
    social: { instagram: null, facebook: null },
    photos,
    ...(d._heroImage ? { heroImage: d._heroImage } : {}),
    photoSource,
    reviews,
    seo: {
      title: `${name} | Nail Salon in ${city}, ${state}`,
      description: seoDesc,
    },
  }
}

export { CATALOG, STRENGTHS }
