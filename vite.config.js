import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this site from https://uvyaio.github.io/KaliPOS/,
  // not from the domain root, so every asset URL needs this prefix.
  // If you ever move to a custom domain or Vercel/Netlify, change this back to '/'.
  base: '/KaliPOS/',
})
