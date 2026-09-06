import fs from 'node:fs'
import path from 'node:path'
import { THEME_IDS, hashString } from '../packages/template/src/themes.js'
import { sitesDir } from './scaffold.mjs'

/*
 * Pure hashing spreads themes evenly overall, but ~1 in 6 pairs still collide —
 * and the pairs that matter are two salons in the SAME city, where the prospect
 * can plausibly see both sites. So: prefer the least-used theme among salons
 * already generated in that city, breaking ties with the place-ID hash so the
 * result stays deterministic. No collisions until a city has more than 6 salons.
 */
export function pickThemeForCity(city, seed, ownSlug) {
  const inCity = new Map(THEME_IDS.map((t) => [t, 0]))
  const overall = new Map(THEME_IDS.map((t) => [t, 0]))

  if (fs.existsSync(sitesDir)) {
    for (const dir of fs.readdirSync(sitesDir)) {
      if (dir === ownSlug) continue
      const cfgPath = path.join(sitesDir, dir, 'salon.config.json')
      if (!fs.existsSync(cfgPath)) continue
      try {
        const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
        if (!overall.has(cfg.theme)) continue
        overall.set(cfg.theme, overall.get(cfg.theme) + 1)
        if (city && (cfg.address?.city || '').toLowerCase() === city.toLowerCase()) {
          inCity.set(cfg.theme, inCity.get(cfg.theme) + 1)
        }
      } catch { /* a malformed config shouldn't block generating a new site */ }
    }
  }

  const h = hashString(String(seed))
  const tiebreak = (t) => (h + THEME_IDS.indexOf(t)) % THEME_IDS.length

  // Same-city clashes matter most (a prospect can see a rival's site), then
  // overall balance so adjacent towns in one market don't drift into a rut,
  // then the hash so the result is still deterministic for a given salon.
  return THEME_IDS.slice().sort((a, b) =>
    inCity.get(a) - inCity.get(b) ||
    overall.get(a) - overall.get(b) ||
    tiebreak(a) - tiebreak(b)
  )[0]
}
