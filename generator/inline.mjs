#!/usr/bin/env node
/*
 * Bundles a built site into ONE self-contained .html file: JS, CSS, images and
 * webfonts all inlined. No server, no network. Open it from disk, email it to a
 * prospect, or publish it anywhere.
 *
 *   npm run inline -- <slug>
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { sitesDir } from './scaffold.mjs'

const args = process.argv.slice(2)
const slug = args.find((a) => !a.startsWith('--'))
// --fragment strips the outer document so the file can be embedded in a host
// page (Claude Artifacts wraps uploads in their own <html>/<head>/<body>).
const fragment = args.includes('--fragment')
if (!slug) { console.error('Usage: npm run inline -- <slug>'); process.exit(1) }

const dir = path.join(sitesDir, slug)
const dist = path.join(dir, 'dist')
const MIME = { '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml' }

/** Pull every woff2 the Google Fonts stylesheet references and base64 them in. */
async function inlineFonts(html) {
  const linkRe = /<link rel="stylesheet" href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"\s*\/?>/
  const m = html.match(linkRe)
  if (!m) return html

  const cssRes = await fetch(m[1].replace(/&amp;/g, '&'), {
    // Without a modern UA Google serves TTF instead of the much smaller woff2.
    headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
  })
  if (!cssRes.ok) { console.warn('  ! font CSS fetch failed; falling back to system fonts'); return html.replace(linkRe, '') }
  let css = await cssRes.text()

  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map((x) => x[1]))]
  let bytes = 0
  for (const url of urls) {
    try {
      const r = await fetch(url)
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      bytes += buf.length
      css = css.replaceAll(url, () => `data:font/woff2;base64,${buf.toString('base64')}`)
    } catch { /* leave the remote URL; it just won't render offline */ }
  }
  console.log(`  fonts   ${urls.length} files, ${(bytes / 1024).toFixed(0)} KB`)
  return html.replace(linkRe, () => `<style>\n${css}\n</style>`)
}

async function main() {
  let html = await fs.readFile(path.join(dist, 'index.html'), 'utf8')

  // CSS
  for (const m of [...html.matchAll(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/g)]) {
    const css = await fs.readFile(path.join(dist, m[1]), 'utf8')
    html = html.replace(m[0], () => `<style>\n${css}\n</style>`)
  }

  // JS — read first so photo paths inside the bundle get rewritten too.
  let js = ''
  let scriptTag = ''
  for (const m of [...html.matchAll(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/g)]) {
    js = await fs.readFile(path.join(dist, m[1]), 'utf8')
    scriptTag = m[0]
  }

  // Images -> data URIs, in both the HTML and the JS bundle.
  const photoDir = path.join(dist, 'photos')
  let imgBytes = 0, imgCount = 0
  try {
    for (const file of await fs.readdir(photoDir)) {
      const ext = path.extname(file)
      if (!MIME[ext]) continue
      const buf = await fs.readFile(path.join(photoDir, file))
      const uri = `data:${MIME[ext]};base64,${buf.toString('base64')}`
      const ref = `/photos/${file}`
      if (js.includes(ref) || html.includes(ref)) { imgBytes += buf.length; imgCount++ }
      js = js.replaceAll(ref, () => uri)
      html = html.replaceAll(ref, () => uri)
    }
  } catch { console.warn('  ! no photos directory') }
  console.log(`  images  ${imgCount} files, ${(imgBytes / 1024).toFixed(0)} KB`)

  // Vite's bundle contains literal "</script>" inside string constants, which
  // would close the inline tag early. "<\/script" is identical in JS source.
  js = js.replaceAll('</script', String.raw`<\/script`)

  if (scriptTag) html = html.replace(scriptTag, () => `<script type="module">\n${js}\n</script>`)
  html = await inlineFonts(html)

  if (fragment) {
    html = html
      .replace(/<!doctype html>/i, '')
      .replace(/<\/?(html|head|body)(\s[^>]*)?>/gi, '')
      // The SEO title ("Name | Nail Salon in City, ST") is right for a deployed
      // site but reads as filler as a gallery/tab name. Keep just the salon.
      .replace(/<title>([^|<]+)\|[^<]*<\/title>/i, (_, name) => `<title>${name.trim()}</title>`)
      .trim()
  }

  const out = path.join(dir, fragment ? `${slug}.fragment.html` : `${slug}.html`)
  await fs.writeFile(out, html)
  const kb = (Buffer.byteLength(html) / 1024).toFixed(0)
  console.log(`\n  ${out}\n  ${kb} KB, fully self-contained.\n`)
}

main().catch((e) => { console.error(e.message); process.exit(1) })
