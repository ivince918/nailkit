# NailKit

## Preview the Precious Nails website

```bash
npm ci
npm run dev -- precious-nails-el-sobrante
```

Build with `npm run build -- precious-nails-el-sobrante`. Edit salon details in
`sites/precious-nails-el-sobrante/salon.config.json` and shared design in
`packages/template/src/`. The included standalone HTML preview is in the salon’s
site folder. Booking is a request flow; SMS delivery requires backend configuration.


Paste a nail salon's Google Maps link. Get a finished, deployable website.

Built for outbound: generate a real site for a prospect *before* you contact them,
send them the link, and let the site do the pitching.

```bash
npm run new -- "https://maps.app.goo.gl/xxxxxxxx"
npm install                      # links the new workspace
npm run dev    -- <slug>
npm run deploy -- <slug> --prod
```

---

## Setup (once)

```bash
cd nailkit && npm install
```

That's it. **No API key is required.**

### The default workflow: `--from` a listing file

Open the salon's Google Maps listing, read it, and drop the facts into
`inputs/<slug>.json`. See [`inputs/heavenly-nail-spa.json`](inputs/heavenly-nail-spa.json)
for a complete real example.

```bash
npm run new -- --from=inputs/marigold-demo.json
```

The Maps listing gives you everything the file needs, including the **review keyword
chips** ("eyebrow wax · 9", "gel manicure · 49") — put those in `tags` and the generator
uses them to decide which service categories the salon actually offers.

```jsonc
{
  "name": "Marigold Nail Studio",
  "address": "1840 Vireo Lane, Palo Alto, CA 94306",
  "phone": "(650) 555-0142",
  "rating": 4.9, "reviewCount": 486,
  "hours": { "default": "9:30-19:00", "sun": "10:00-18:00", "mon": "closed" },
  "tags": ["gel manicure", "eyebrow wax", "lash lift"],
  "theme": "blush-modern",                       // optional; auto-balanced otherwise
  "showRating": false,                           // hide a weak rating (see below)
  "bookingUrl": "https://...",                   // optional
  "reviews": [{ "author": "Dana W.", "when": "2 weeks ago", "text": "..." }]
}
```

### Optional: the Places API path

If you'd rather have it fetch automatically, add a key to `.env`
(`cp .env.example .env`; enable **Places API (New)** in Google Cloud) and pass a Maps
URL directly. It's the same pipeline — `--from` just skips the key.

Also available with no key: `--demo` (fictional salon, placeholder art) and
`--manual` (interactive prompts).

---

## Architecture

One repo and one Vercel project per salon — but **all the real code lives in one
shared package.** A generated site is a six-file shell that imports it.

```
packages/template/     ← every component, theme, and animation. Edit here.
generator/             ← Maps URL -> salon.config.json -> site folder
sites/<slug>/          ← generated. salon.config.json is the only file you edit.
```

Fix a bug in `packages/template`, rebuild, and all 200 sites get the fix. Nothing
is copy-pasted between salons.

Per-site files:

| File | What it is |
|---|---|
| `salon.config.json` | All content. **This is the file you hand-edit.** |
| `public/photos/` | Images, two widths each (`01.webp`, `01@sm.webp`) |
| `src/main.jsx` | 8 lines: render `<SalonSite config={config} />` |
| `index.html` | Title, meta, OG tags, theme vars, LocalBusiness JSON-LD |

---

## Commands

| Command | Does |
|---|---|
| `npm run new -- "<url\|name, city>"` | Generate a site |
| `npm run list` | Every site, its theme, and launch status |
| `npm run dev -- <slug>` | Dev server |
| `npm run build -- <slug\|all>` | Production build |
| `npm run check -- <slug>` | Launch-readiness gate |
| `npm run inline -- <slug>` | Bundle into one self-contained `.html` (see below) |
| `npm run deploy -- <slug> [--prod]` | Deploy via Vercel CLI |

Flags for `new`: `--from=<file>` · `--theme=<id>` · `--booking=<url>` · `--place-id=<id>` ·
`--photos=<n>` · `--force` · `--demo` · `--manual` · `--name= --city=` (with `--demo`)

---

## Real pages for the gallery and the request form

Sites are single-page by default. A salon with a big gallery can opt into `/gallery/` and
`/book/` as real pages; the home page then shows six photos and a "See all" link, and every
"Request a time" button goes to the booking page. Service links carry the choice across:
`/book/?service=Gel%20Manicure` preselects it.

1. `"pages": { "gallery": "/gallery/", "book": "/book/" }` in `salon.config.json`
2. `gallery/index.html` and `book/index.html` (copy `index.html`, change the title, drop the canonical)
3. `src/gallery.jsx` and `src/book.jsx` rendering `<SalonSite config={config} page="gallery" />`
4. list all three in `vite.config.js` `build.rollupOptions.input`

`sites/precious-nails-el-sobrante` is the working example. The single-file export
(`npm run inline`) only bundles the home page, so its gallery and booking links need the
hosted version.

## Temporary preview hosting (Cloudflare Workers)

For a pitch you want a URL, not a file. Static assets on Workers is free, needs no domain,
and takes one command. `sites/precious-nails-el-sobrante/wrangler.jsonc` is the working example.

```bash
npm run build -- <slug>
cd sites/<slug> && npx wrangler deploy        # -> https://<name>.<account>.workers.dev
npx wrangler delete                           # tear it down when the pitch is over
```

Two things the preview carries that a live site must not:

- `public/_headers` sets `X-Robots-Tag: noindex` so the workers.dev URL never gets indexed under
  the salon's name. `npm run check` fails until it is deleted.
- There is no `/api/book` on Workers, so the request form falls back to a prefilled SMS to the
  salon. That is the right behaviour for a demo; the Twilio path needs the Vercel deploy.

## Sending a prospect one file

```bash
npm run build  -- <slug>
npm run inline -- <slug>
```

Produces `sites/<slug>/<slug>.html` — JS, CSS, images and webfonts all inlined. ~1–2 MB,
no server, no network. Open it from disk or email it as an attachment. Add `--fragment`
to strip the outer `<html>` wrapper for embedding in a host page.

The embedded map is the only part that needs the network, so the address panel behind it
is always rendered and the map fades in on top only once it actually loads. Offline, the
prospect still sees a clean address block with a directions button.

---

## What gets pulled and what gets inferred

**Taken from the listing:** name, address, phone, hours, timezone, rating, review count,
reviews, coordinates, parking/accessibility/payment options.

**Inferred, with evidence:**

- **Theme** — balanced, not just hashed. Picks the least-used theme **in that city**
  first, then the least-used across all your sites, then falls back to a place-ID hash.
  Six salons in one city get six different looks. Pure hashing collided ~11% of the time.
- **Headline** — a variant chosen by the same hash; the "highest-rated" wording only
  unlocks at 4.7★ or above.
- **Services** — five core categories every nail salon offers, *plus* waxing, lashes,
  kids' spa, or massage **only if the salon's own reviews or keyword chips mention them.**
- **Why Choose Us** — the six strengths reviewers actually name, ranked by how often.

Nothing invents a founding year, an award, a staff count, or a price.

---

## When the rating is weak

`"rating"` and `"reviewCount"` drive a badge in the hero, a stat in the trust bar, a line
in the footer and the testimonials subhead. That sells a 4.8 from 1,200 reviews. It does
not sell a 4.2 from 55.

Set `"showRating": false` in the input file and all four drop out. The reviews themselves
still render, still attributed to Google — you're choosing not to lead with the number,
not hiding it. Roughly: leave it on above ~4.5 with 100+ reviews.

---

## Photo quality

The hero renders edge-to-edge, so it is the one image where source resolution shows.
Rules the pipeline follows:

- **Photo 1 keeps its native width** (up to 2560) and encodes at WebP q90. Every other
  photo caps at 1600 / q82. Downscaling a 1672px source to 1600 throws away detail on the
  only image rendered across the full viewport.
- **Feed it PNG where possible.** Re-encoding an already-compressed JPEG compounds
  artifacts; a PNG source means WebP is the only lossy step.
- **`srcSet` + `sizes="100vw"`** so phones fetch the 800px file, not the full hero, and
  `fetchPriority="high"` because the hero is the LCP element.
- **The gallery needs at least 6 photos.** It is a masonry, so every photo keeps its own shape;
  portrait phone shots balance best. Below six the section and its nav links drop out.
- **Aim for ~1600px wide minimum.** At a 1440px viewport a 1672px source is a 1.13x
  downscale and looks sharp; the 459px image it replaced was a 3.1x upscale and looked it.

Drop replacements into `generator/preview-photos/` — any `.png/.jpg/.webp`, sorted by
filename, first one becomes the hero. No code change needed.

---

## Maps

Paste Google's own embed snippet into the input file as `mapEmbed` — open the listing,
**Share → Embed a map → Copy HTML**. The field takes the whole `<iframe …>` or just the
URL; the generator pulls out the `src` either way. Google's `pb` payload frames the pin
correctly, which a hand-built address query can't. Without it, the site falls back to an
address query, so `mapEmbed` is optional.

---

## Booking

Every site has a request-to-book section: category → service → day → time → name and phone.
Days the salon is closed are disabled, slots come from that day's real opening hours in the
salon's timezone, and today's slots inside the next hour are dropped.

**It is a request, not a booking.** Nothing checks a calendar, so the copy says so — the
slot list is captioned "these are opening hours, not confirmed openings," and the
confirmation reads "your appointment is not booked until they reply." Do not reword those
into a confirmation; a customer arriving at a full salon is worse than no website.

Submitting POSTs to `api/book.js` (scaffolded into every site), which texts the salon
via Twilio. Set these once on the Vercel project — all sites share them:

```bash
TWILIO_ACCOUNT_SID   TWILIO_AUTH_TOKEN   TWILIO_FROM
```

The destination number is read from the site's own `salon.config.json`, never from the
request body — otherwise the endpoint would be an open SMS relay for anyone who found the
URL. There's a coarse per-IP throttle in memory; put Upstash in front of it before launch.

With no backend (single-file export, opened from disk, offline) the form detects the
missing endpoint and offers a prefilled SMS to the salon instead of failing silently.

Salons with real online booking (`bookingUrl`) keep it — the nav button goes there, and
the section links to it as the instant option.

---

## Typography

Each theme carries a deliberate display/body pairing rather than one house font:

| Theme | Display | Body | Reads as |
|---|---|---|---|
| `marble-gold` | Cormorant Garamond | Lato | Luxury boutique |
| `blush-modern` | Playfair Display | Poppins | High-fashion, trend-forward |
| `sage-minimal` | Montserrat | Lato | Modern minimalist spa |
| `midnight-neon` | Bebas Neue | Poppins | Edgy nail bar (sets uppercase) |
| `terracotta-warm` | Fraunces | Lato | Cozy neighborhood salon |
| `pearl-clean` | Bodoni Moda | Inter | High-contrast editorial |

Themes also set `--display-transform` and `--display-line`, so a condensed uppercase face
(Bebas) and a didone (Bodoni) share one component set without either looking wrong.

**Note:** *Obviously* was requested but is a commercial font from OH no Type Co. and can't
ship on client sites without a purchased license. Bebas Neue covers the same loud,
condensed slot and is open-licensed.

---

## Mastheads

Salons this size rarely have a usable logo file, so the generator draws one. `Masthead`
renders a monogram (initials, skipping generic words — "Heavenly Nail Spa" becomes **H**)
inside a theme-specific frame: a double hairline ring for `marble-gold`, a hexagon for
`midnight-neon`, an arch for `terracotta-warm`, and so on. The `stacked` variant adds the
name and a locality line for the footer. It's SVG and inherits the theme accent, so it
costs nothing and never 404s.

---

## Themes

Each theme is a palette, a **typeface pairing**, a corner radius, and a monogram shape —
all defined as CSS variables in `packages/template/src/themes.js`. Override per site with
`--theme=`, or by editing `"theme"` in `salon.config.json`.

| Theme | Display | Body | Monogram | Reads as |
|---|---|---|---|---|
| `marble-gold` | Cormorant Garamond | Lato | double hairline ring | luxury boutique |
| `pearl-clean` | Bodoni Moda | Inter | ring + baseline rule | high-contrast editorial |
| `blush-modern` | Playfair Display | Poppins | squircle | high-fashion, trend-led |
| `sage-minimal` | Montserrat | Lato | bare square | modern minimalist spa |
| `midnight-neon` | Bebas Neue | Poppins | hexagon | edgy downtown nail bar |
| `terracotta-warm` | Fraunces | Lato | arch | cozy neighborhood spot |

Faces are carried per theme along with the knobs they need — `--display-transform`
(Bebas sets everything uppercase), `--display-line`, `--display-tracking`, and
`--headline-measure`, since a condensed face fits far more characters per line than a
garalde. Headlines also use `text-wrap: balance` so no salon name strands a one-word line.

**Fraunces is the one substitution.** "Obviously" is a commercial licence from OH no Type
Co. and can't ship on client sites without buying it; the other eight faces are Google
Fonts and are embedded directly into the single-file export, so they render offline.

---

## Mastheads

Salons this size rarely have a usable logo file, and a prospect who opens their site and
sees a real mark takes the pitch more seriously than one who sees their name in the body
font. So every site gets a generated lockup: a monogram whose shape is picked by theme,
plus the wordmark in that theme's display face.

Initials skip generic words — *Heavenly Nail Spa* → **H**, *Bella Rose Nail Lounge* →
**BR**, *Atelier Nail Co* → **A**. Two variants ship: inline in the nav, and stacked over
a `NAIL STUDIO · CITY, ST` rule in the footer. Both live in
`packages/template/src/components/Masthead.jsx`; swapping in a real logo means replacing
one component.

---

## Before a site goes live

`npm run check -- <slug>` blocks launch until two things are handled. Both are real
policy limits, not busywork:

1. **Photos.** Google's Places policy does not permit hosting their photo content as a
   business's permanent site imagery. Google photos are fine for the pitch preview.
   Once the client signs, drop their own photos into `public/photos/` and set
   `"photoSource": "owner"`.
2. **Ratings in markup.** Google's structured-data policy bars marking up third-party
   ratings as first-party. The JSON-LD in `seo.js` deliberately omits `aggregateRating`;
   the rating still displays on the page, attributed to Google. Don't "fix" this.

Prices are off by default and every service reads "Call". Turn on `"showPrices": true`
only with a menu the owner confirmed — publishing guessed prices under a real
business's name is a liability.

---

## Editing a generated site

Almost everything is `salon.config.json`:

```jsonc
{
  "theme": "blush-modern",
  "bookingUrl": "https://booking-site.com/salon",   // enables "Book online" CTAs
  "showPrices": true,
  "social": { "instagram": "https://...", "facebook": "https://..." },
  "hero":  { "headline": "...", "sub": "..." },
  "story": { "title": "...", "body": ["para one", "para two"] },
  "why":   [{ "icon": "shield", "title": "...", "body": "..." }],
  "services": [
    { "name": "Manicures", "icon": "hand",
      "items": [{ "name": "Gel Manicure", "price": "$45" }] }   // or plain strings
  ]
}
```

Icon names are the keys in `packages/template/src/components/icons.jsx`.

Changing how *every* site looks or behaves means editing `packages/template` and
rebuilding — never edit a site's copy of a component, because there isn't one.

---

## Running a batch

```bash
for url in $(cat prospects.txt); do npm run new -- "$url" || echo "FAILED: $url" >> failures.txt; done
npm install
npm run build -- all
```

Generation is ~15 seconds per salon, mostly photo downloads.

### Cinematic salon introduction and hero

The shared template includes a skippable 2.75-second polish-monogram opening, shown once per tab session. Reduced-motion visitors and direct section links skip it. Service-menu links preselect the treatment in the booking request form.

Set optional `heroImage` in an input JSON or salon config to keep campaign artwork separate from gallery placeholders. Supply `src`, `srcSm`, `width`, `height`, `smallWidth`, and `concept: true` for preview concept imagery. Place the referenced files in that site’s `public/photos/` folder. The Precious Nails source artwork is preserved at `assets/hero-editorial-v2.png`; responsive WebP copies use its native resolution without upscaling. Booking requests still require the existing SMS backend configuration before live use.
