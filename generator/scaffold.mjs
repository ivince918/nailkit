/* Writes a complete, buildable site folder for one salon. */

import fs from 'node:fs/promises'
import path from 'node:path'
import { bookApiSource } from './bookApi.mjs'
import { THEMES } from '../packages/template/src/themes.js'
import { buildJsonLd } from '../packages/template/src/seo.js'

export const ROOT = path.resolve(new URL('..', import.meta.url).pathname)
export const sitesDir = path.join(ROOT, 'sites')

const w = async (file, body) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, body)
}

/** Download + convert to webp at two widths. Falls back to raw bytes if sharp is missing. */
export async function savePhotos(dir, buffers, altBase) {
  await fs.mkdir(dir, { recursive: true })
  let sharp = null
  try {
    ({ default: sharp } = await import('sharp'))
  } catch {
    console.warn('  ! sharp not installed — saving original JPEGs (larger, but works)')
  }

  const out = []
  for (let i = 0; i < buffers.length; i++) {
    const n = String(i + 1).padStart(2, '0')
    const entry = { alt: buffers[i].alt || `${altBase} — photo ${i + 1}`, attribution: buffers[i].attribution || null, sourceUrl: buffers[i].sourceUrl || null }

    if (sharp) {
      const img = sharp(buffers[i].data).rotate()
      const meta = await img.metadata()

      /*
       * Photo 1 carries the full-bleed hero, so it gets treated differently:
       * it keeps its native width up to 2560 instead of being capped at 1600,
       * and encodes at a higher quality. Downscaling a 1672px source to 1600
       * throws away detail for no reason when it is the one image rendered
       * edge-to-edge across the viewport.
       */
      const isHero = i === 0
      const wideW = Math.min(meta.width || 1600, isHero ? 2560 : 1600)

      const wide = await img.clone().resize({ width: wideW, withoutEnlargement: true })
        .webp({ quality: isHero ? 90 : 82 }).toFile(path.join(dir, `${n}.webp`))
      const small = await img.clone().resize({ width: 800, withoutEnlargement: true })
        .webp({ quality: 78 }).toFile(path.join(dir, `${n}@sm.webp`))

      entry.src = `/photos/${n}.webp`
      entry.srcSm = `/photos/${n}@sm.webp`
      entry.smallWidth = small.width
      entry.width = wide.width
      entry.height = wide.height
    } else {
      await fs.writeFile(path.join(dir, `${n}.jpg`), buffers[i].data)
      entry.src = `/photos/${n}.jpg`
      entry.srcSm = `/photos/${n}.jpg`
    }
    out.push(entry)
  }
  return out
}

function indexHtml(config) {
  const theme = THEMES[config.theme] || THEMES['pearl-clean']
  const vars = Object.entries(theme.vars).map(([k, v]) => `      ${k}: ${v};`).join('\n')
  const jsonLd = JSON.stringify(buildJsonLd(config), null, 2).replace(/</g, '\\u003c')
  const ogImage = config.photos?.[0]?.src || ''

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ${config.preview ? '<meta name="robots" content="noindex,nofollow" />' : ''}
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(config.seo.title)}</title>
    <meta name="description" content="${escapeHtml(config.seo.description)}" />


    <meta property="og:type" content="website" />
    <meta property="og:title" content="${escapeHtml(config.seo.title)}" />
    <meta property="og:description" content="${escapeHtml(config.seo.description)}" />
    ${ogImage ? `<meta property="og:image" content="${ogImage}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />

    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${theme.fonts.href}" />

    <style>
      /* Theme vars inlined so the first paint is already the right color. */
      :root {
${vars}
        --font-display: ${theme.fonts.display};
        --font-body: ${theme.fonts.body};
      }
      html { background: ${theme.vars['--bg']}; }
    </style>

    <script type="application/ld+json">
${jsonLd}
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`
}

const escapeHtml = (s = '') =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function scaffoldSite(config, photoBuffers = []) {
  const dir = path.join(sitesDir, config.slug)
  await fs.mkdir(dir, { recursive: true })

  if (photoBuffers.length) {
    config.photos = await savePhotos(path.join(dir, 'public', 'photos'), photoBuffers, config.name)
  }

  await w(path.join(dir, 'salon.config.json'), JSON.stringify(config, null, 2) + '\n')
  await w(path.join(dir, 'index.html'), indexHtml(config))
  await w(path.join(dir, 'api', 'book.js'), bookApiSource)

  await w(path.join(dir, 'package.json'), JSON.stringify({
    name: `site-${config.slug}`,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      '@nailkit/template': '*',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.1',
      autoprefixer: '^10.4.19',
      postcss: '^8.4.39',
      tailwindcss: '^3.4.6',
      vite: '^5.3.4',
    },
  }, null, 2) + '\n')

  await w(path.join(dir, 'vite.config.js'), `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The shared template is a workspace symlink — keep it as source so Vite
  // transforms its JSX instead of trying to pre-bundle it.
  optimizeDeps: { exclude: ['@nailkit/template'] },
  build: { target: 'es2020', rollupOptions: { input: ${JSON.stringify(Object.fromEntries([['main','index.html'], ...(config.pages?.gallery ? [['gallery','gallery/index.html']] : []), ...(config.pages?.book ? [['book','book/index.html']] : [])]))} } },
})
`)

  await w(path.join(dir, 'tailwind.config.js'), `import preset from '../../packages/template/src/tailwind-preset.js'

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
    './salon.config.json',
    '../../packages/template/src/**/*.{js,jsx}',
  ],
}
`)

  await w(path.join(dir, 'postcss.config.js'), `export default { plugins: { tailwindcss: {}, autoprefixer: {} } }\n`)

  await w(path.join(dir, 'src', 'main.jsx'), `import React from 'react'
import { createRoot } from 'react-dom/client'
import SalonSite from '@nailkit/template'
import '@nailkit/template/styles.css'
import config from '../salon.config.json'

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SalonSite config={config} />
  </React.StrictMode>
)
`)

  for (const page of ['gallery', 'book']) {
    if (!config.pages?.[page]) continue
    await w(path.join(dir, page, 'index.html'), indexHtml(config).replace('/src/main.jsx', `/src/${page}.jsx`).replace('href="/"', `href="/${page}/"`))
    await w(path.join(dir, 'src', `${page}.jsx`), `import React from 'react'
import { createRoot } from 'react-dom/client'
import SalonSite from '@nailkit/template'
import '@nailkit/template/styles.css'
import config from '../salon.config.json'
createRoot(document.getElementById('root')).render(<SalonSite config={config} page="${page}" />)
`)
  }

  await w(path.join(dir, '.gitignore'), 'node_modules\ndist\n.vercel\n')

  await w(path.join(dir, 'vercel.json'), JSON.stringify({
    buildCommand: 'npm run build',
    outputDirectory: 'dist',
    framework: 'vite',
  }, null, 2) + '\n')

  return dir
}
