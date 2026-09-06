/*
 * Google Places API (New) client.
 * Docs: https://developers.google.com/maps/documentation/places/web-service/place-details
 *
 * Three calls per salon, worst case:
 *   1. searchText   — resolve a Maps URL / "Name, City" into a place ID
 *   2. places/{id}  — one Details call with a full field mask
 *   3. .../media    — one call per photo
 * At ~200 salons that lands inside the free monthly SKU allowances.
 */

const BASE = 'https://places.googleapis.com/v1'

const DETAIL_FIELDS = [
  'id', 'displayName', 'formattedAddress', 'addressComponents', 'location',
  'nationalPhoneNumber', 'internationalPhoneNumber', 'websiteUri', 'googleMapsUri',
  'regularOpeningHours', 'utcOffsetMinutes', 'rating', 'userRatingCount',
  'reviews', 'photos', 'editorialSummary', 'priceLevel',
  'parkingOptions', 'accessibilityOptions', 'paymentOptions',
].join(',')

function requireKey() {
  const key = process.env.GOOGLE_MAPS_API_KEY
  if (!key) {
    throw new Error(
      'GOOGLE_MAPS_API_KEY is not set.\n' +
      '  1. console.cloud.google.com -> enable "Places API (New)"\n' +
      '  2. Credentials -> Create API key\n' +
      '  3. echo "GOOGLE_MAPS_API_KEY=..." >> nailkit/.env\n' +
      'Or run with --manual to skip the API entirely.'
    )
  }
  return key
}

/** Follow a maps.app.goo.gl short link to the full URL that names the place. */
async function expandUrl(url) {
  try {
    const res = await fetch(url, { redirect: 'follow', headers: { 'User-Agent': 'Mozilla/5.0' } })
    return res.url || url
  } catch {
    return url
  }
}

/**
 * Turn whatever the user pasted into a text query + optional location bias.
 * Accepts a short link, a full /maps/place/ URL, or plain "Name, City".
 */
export async function parseInput(input) {
  if (!/^https?:\/\//i.test(input)) return { query: input }

  const url = await expandUrl(input.trim())

  const placeIdMatch = url.match(/[?&]place_id=([^&]+)/)
  if (placeIdMatch) return { placeId: decodeURIComponent(placeIdMatch[1]), query: '' }

  const nameMatch = url.match(/\/maps\/place\/([^/@?]+)/)
  const coordMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)

  const name = nameMatch
    ? decodeURIComponent(nameMatch[1]).replace(/\+/g, ' ').trim()
    : ''

  if (!name) {
    throw new Error(
      `Couldn't read a business name out of that URL.\n  Resolved to: ${url}\n` +
      `  Try pasting the salon's name and city instead, e.g. "Heavenly Nail Spa, Palo Alto CA".`
    )
  }

  return {
    query: name,
    bias: coordMatch ? { lat: Number(coordMatch[1]), lng: Number(coordMatch[2]) } : null,
  }
}

export async function searchPlace({ query, bias }) {
  const key = requireKey()
  const body = { textQuery: query, maxResultCount: 1 }
  if (bias) {
    body.locationBias = { circle: { center: { latitude: bias.lat, longitude: bias.lng }, radius: 500 } }
  }

  const res = await fetch(`${BASE}/places:searchText`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
    },
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(`Places searchText failed (${res.status}): ${json.error?.message || JSON.stringify(json)}`)
  if (!json.places?.length) throw new Error(`No Google listing matched "${query}".`)

  return json.places[0].id
}

export async function getDetails(placeId) {
  const key = requireKey()
  const res = await fetch(`${BASE}/places/${placeId}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': DETAIL_FIELDS },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(`Places details failed (${res.status}): ${json.error?.message || JSON.stringify(json)}`)
  return json
}

/** Fetch one photo's bytes. `name` looks like places/{id}/photos/{ref}. */
export async function fetchPhoto(name, maxWidthPx = 1800) {
  const key = requireKey()
  const url = `${BASE}/${name}/media?maxWidthPx=${maxWidthPx}&key=${key}`
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) throw new Error(`Photo fetch failed (${res.status}) for ${name}`)
  return Buffer.from(await res.arrayBuffer())
}
