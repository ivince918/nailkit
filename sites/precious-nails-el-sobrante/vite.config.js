import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

const here = (p) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react()],
  // The shared template is a workspace symlink — keep it as source so Vite
  // transforms its JSX instead of trying to pre-bundle it.
  optimizeDeps: { exclude: ['@nailkit/template'] },
  build: {
    target: 'es2020',
    // Real pages for the gallery and the request form (salon.config.json "pages").
    rollupOptions: {
      input: {
        main: here('index.html'),
        gallery: here('gallery/index.html'),
        book: here('book/index.html'),
      },
    },
  },
})
