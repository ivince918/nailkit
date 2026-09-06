/*
 * Demo payload — shaped exactly like a Places API response so it runs the same
 * deriveConfig path as a real salon. Lets you show the template to a prospect
 * (or check a template change) without spending an API call.
 *
 * Data below is public information from the salon's own website and listing.
 * Photos are generated abstract placeholders, NOT photographs of the salon.
 */

const REVIEWS = [
  ['Katya Lapina', 'We had the best experience here! Three of us came to treat ourselves for my mom’s birthday and had the most incredible, friendly, professional service. Loved our mani pedis and just an overall amazing experience.', '2 months ago'],
  ['Rachel Chinta', 'Wow, this nail spa is simply amazing. If you ever want to feel pampered and beautiful you must visit. They are kind, loving and so professional at making you feel beautiful inside and out.', '3 months ago'],
  ['Kassaundra Tillman', 'A beautiful relaxing environment with lovely sweet staff. From the moment I entered they were so welcoming, offering water, coffee and a snack. Beautiful nail art. I will be coming back and bringing my friends.', '1 month ago'],
  ['Priya N.', 'My gel manicure lasted a full three weeks with zero chips. They take real time on the prep and it shows. Spotless salon, sanitized tools, and the shaping is perfect every time.', '4 weeks ago'],
  ['Danielle R.', 'Booked a dip powder full set and brought a screenshot of a chrome design. They matched it exactly, freehand. Fair pricing quoted up front and no surprise add-ons at checkout.', '2 weeks ago'],
]

export function demoDetails({ name = 'Heavenly Nail Spa', city = 'Palo Alto', state = 'CA' } = {}) {
  return {
    id: `demo-${name}-${city}`,
    displayName: { text: name },
    formattedAddress: `4222 El Camino Real, ${city}, ${state} 94306`,
    addressComponents: [
      { types: ['street_number'], shortText: '4222', longText: '4222' },
      { types: ['route'], shortText: 'El Camino Real', longText: 'El Camino Real' },
      { types: ['locality'], shortText: city, longText: city },
      { types: ['administrative_area_level_1'], shortText: state, longText: state },
      { types: ['postal_code'], shortText: '94306', longText: '94306' },
    ],
    location: { latitude: 37.4128, longitude: -122.1338 },
    nationalPhoneNumber: '(650) 384-6878',
    googleMapsUri: `https://www.google.com/maps/search/${encodeURIComponent(`${name} ${city}`)}`,
    utcOffsetMinutes: -420,
    rating: 4.8,
    userRatingCount: 512,
    priceLevel: 'PRICE_LEVEL_MODERATE',
    regularOpeningHours: {
      periods: [0, 1, 2, 3, 4, 5, 6].map((day) => ({
        open: { day, hour: day === 0 ? 10 : 9, minute: day === 0 ? 0 : 30 },
        close: { day, hour: day === 0 ? 18 : 19, minute: 0 },
      })),
    },
    parkingOptions: { freeParkingLot: true },
    accessibilityOptions: { wheelchairAccessibleEntrance: true },
    paymentOptions: { acceptsCreditCards: true },
    reviews: REVIEWS.map(([displayName, text, when]) => ({
      rating: 5,
      text: { text },
      originalText: { text },
      relativePublishTimeDescription: when,
      authorAttribution: { displayName },
    })),
    photos: [],
  }
}

/*
 * Soft-focus abstract preview images. These are generated, not photographs —
 * deliberately out-of-focus so they read as placeholder texture and could never
 * be mistaken for a specific salon's work, while still letting you judge the
 * layout, type and color the way real photography would.
 */
const PALETTES = [
  ['#F3E4CE', '#C2A063', '#8A6B33'], ['#FBE4EA', '#D98BA4', '#A24E68'],
  ['#E4EDE0', '#8FAE87', '#4F6B48'], ['#E9DFF6', '#B08CE0', '#6B4E9A'],
  ['#FAE3D3', '#DE9A6E', '#A8542C'], ['#DEEDEC', '#7FB5B1', '#37706C'],
  ['#F6EADB', '#CBAE85', '#7E6440'], ['#F7E2E8', '#C98FA5', '#8E4A63'],
  ['#E6EFE9', '#8DB39B', '#456B55'], ['#EFE6F2', '#A98BBF', '#6A4E80'],
]

/*
 * Supplied preview photography, used before the generated abstracts.
 *
 * These are stock/AI nail images, NOT any particular salon's work — they make a
 * pitch mockup legible where a gradient can't, and the launch check still blocks
 * going live until the owner's own photos replace them.
 */
async function suppliedPhotos() {
  const fs = await import('node:fs/promises')
  const path = await import('node:path')
  const url = await import('node:url')
  const dir = path.join(path.dirname(url.fileURLToPath(import.meta.url)), 'preview-photos')
  try {
    const files = (await fs.readdir(dir)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()
    return await Promise.all(
      files.map(async (f) => ({ data: await fs.readFile(path.join(dir, f)), attribution: null }))
    )
  } catch {
    return []
  }
}

export async function demoPhotos(count = 10) {
  const { default: sharp } = await import('sharp')
  // Supplied photography leads (it carries the hero); generated abstracts fill
  // the remaining gallery slots so the page still has something to show.
  const out = await suppliedPhotos()
  if (out.length >= count) return out.slice(0, count)

  for (let i = 0; i < count - out.length; i++) {
    const [light, mid, deep] = PALETTES[i % PALETTES.length]
    const angle = (i * 53) % 360
    // Deterministic pseudo-random so a given index always renders identically.
    const r = (n) => ((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1 + 1) % 1

    const blobs = Array.from({ length: 7 }, (_, k) => {
      const cx = Math.round(r(k) * 1600)
      const cy = Math.round(r(k + 20) * 1200)
      const rad = Math.round(120 + r(k + 40) * 340)
      const fill = [light, mid, deep][k % 3]
      return `<circle cx="${cx}" cy="${cy}" r="${rad}" fill="${fill}" opacity="${(0.25 + r(k + 60) * 0.45).toFixed(2)}"/>`
    }).join('')

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
      <defs><linearGradient id="g" gradientTransform="rotate(${angle} 0.5 0.5)">
        <stop offset="0%" stop-color="${light}"/><stop offset="55%" stop-color="${mid}"/>
        <stop offset="100%" stop-color="${deep}"/></linearGradient></defs>
      <rect width="1600" height="1200" fill="url(#g)"/>${blobs}</svg>`

    // Heavy blur turns the shapes into bokeh; the grain on top kills banding.
    const base = await sharp(Buffer.from(svg)).blur(58).toBuffer()
    const grain = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200">
         <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3"/>
         <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.05 0"/></filter>
         <rect width="1600" height="1200" filter="url(#n)"/>
         <text x="1560" y="1170" text-anchor="end" font-family="Helvetica" font-size="19"
               fill="#ffffff" opacity="0.5">preview image</text></svg>`
    )

    out.push({
      data: await sharp(base).composite([{ input: grain }]).jpeg({ quality: 92 }).toBuffer(),
      attribution: null,
    })
  }
  return out
}
