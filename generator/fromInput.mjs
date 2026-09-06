/*
 * The no-API-key path.
 *
 * Claude (or you) opens the salon's Google Maps listing, reads it, and writes a
 * short inputs/<slug>.json with the facts. This converts that into the exact
 * shape the Places API would have returned, so everything downstream —
 * deriveConfig, scaffoldSite — runs on one code path regardless of source.
 */

const DAY_KEYS = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }

/** "9:00-19:00" | "9-19" | "closed" -> {open,close} | null */
function parseRange(v) {
  if (!v || String(v).toLowerCase() === 'closed') return null
  const [a, b] = String(v).split('-').map((s) => s.trim())
  const pad = (s) => {
    const [h, m = '0'] = s.split(':')
    return `${String(Number(h)).padStart(2, '0')}:${String(Number(m)).padStart(2, '0')}`
  }
  return { open: pad(a), close: pad(b) }
}

/**
 * hours: { "default": "9:00-19:00", "sun": "9:00-18:00", "mon": "closed" }
 * Any day not named falls back to `default`.
 */
function buildPeriods(hours = {}) {
  const periods = []
  for (const [key, day] of Object.entries(DAY_KEYS)) {
    const r = parseRange(key in hours ? hours[key] : hours.default)
    if (!r) continue
    const [oh, om] = r.open.split(':').map(Number)
    const [ch, cm] = r.close.split(':').map(Number)
    periods.push({ open: { day, hour: oh, minute: om }, close: { day, hour: ch, minute: cm } })
  }
  return periods
}

/** "4222 El Camino Real, Palo Alto, CA 94306" -> Places addressComponents */
function parseAddress(full = '') {
  const parts = full.split(',').map((s) => s.trim())
  const street = parts[0] || ''
  const city = parts[1] || ''
  const [state = '', zip = ''] = (parts[2] || '').split(/\s+/)
  const num = street.match(/^\d+[A-Za-z]?/)?.[0] || ''
  const route = street.slice(num.length).trim()
  const c = (types, v) => ({ types, shortText: v, longText: v })
  return [
    c(['street_number'], num), c(['route'], route), c(['locality'], city),
    c(['administrative_area_level_1'], state), c(['postal_code'], zip),
  ]
}

export function inputToDetails(input) {
  const {
    name, address = '', phone = '', rating = null, reviewCount = null,
    hours = {}, website = null, mapsUrl = null, utcOffsetMinutes = -420,
    lat = null, lng = null, reviews = [], attributes = {}, summary = null,
    showRating = true, mapEmbed = null,
  } = input

  return {
    id: input.placeId || `maps-${name}-${address}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    displayName: { text: name },
    formattedAddress: address,
    addressComponents: parseAddress(address),
    location: lat && lng ? { latitude: lat, longitude: lng } : null,
    nationalPhoneNumber: phone,
    websiteUri: website,
    googleMapsUri: mapsUrl || `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${address}`)}`,
    utcOffsetMinutes,
    rating,
    userRatingCount: reviewCount,
    _showRating: showRating,
    _mapEmbed: mapEmbed,
    _heroImage: input.heroImage || null,
    editorialSummary: summary ? { text: summary } : undefined,
    regularOpeningHours: { periods: buildPeriods(hours) },
    parkingOptions: attributes.freeParking ? { freeParkingLot: true } : {},
    accessibilityOptions: attributes.wheelchairAccessible ? { wheelchairAccessibleEntrance: true } : {},
    paymentOptions: { acceptsCreditCards: attributes.cardsAccepted !== false },
    reviews: reviews.map((r) => ({
      rating: r.rating || 5,
      text: { text: r.text },
      originalText: { text: r.text },
      relativePublishTimeDescription: r.when || '',
      authorAttribution: { displayName: r.author || 'Google user' },
    })),
    photos: [],
  }
}
