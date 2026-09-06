/*
 * LocalBusiness structured data. Deliberately WITHOUT aggregateRating:
 * Google's structured-data policy prohibits marking up ratings you collected
 * from a third-party site (their own Places API counts), and a manual action
 * across 200 client sites would be unrecoverable. The rating still displays
 * visually with attribution — it just isn't claimed as first-party markup.
 */
export function buildJsonLd(config, siteUrl = '') {
  const { name, address, phone, geo, hours = [], photos = [], mapsUrl, seo = {} } = config

  return {
    '@context': 'https://schema.org',
    '@type': 'NailSalon',
    name,
    description: seo.description,
    telephone: phone,
    url: siteUrl || undefined,
    image: photos.slice(0, 4).map((p) => (siteUrl ? siteUrl.replace(/\/$/, '') + p.src : p.src)),
    address: {
      '@type': 'PostalAddress',
      streetAddress: address?.line1,
      addressLocality: address?.city,
      addressRegion: address?.state,
      postalCode: address?.zip,
      addressCountry: 'US',
    },
    ...(geo?.lat
      ? { geo: { '@type': 'GeoCoordinates', latitude: geo.lat, longitude: geo.lng } }
      : {}),
    ...(mapsUrl ? { hasMap: mapsUrl } : {}),
    openingHoursSpecification: hours
      .filter((h) => !h.closed)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][h.day]}`,
        opens: h.open,
        closes: h.close,
      })),
    priceRange: config.priceRange || '$$',
  }
}
