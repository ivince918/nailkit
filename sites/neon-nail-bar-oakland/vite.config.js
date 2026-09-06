import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // The shared template is a workspace symlink — keep it as source so Vite
  // transforms its JSX instead of trying to pre-bundle it.
  optimizeDeps: { exclude: ['@nailkit/template'] },
  build: { target: 'es2020' },
})
