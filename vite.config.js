import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // For GitHub Pages project sites, assets must be served from /<repo-name>/
  base: mode === 'production' ? '/mitochondrian/' : '/',
  plugins: [react()],
}))
