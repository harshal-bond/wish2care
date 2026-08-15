import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'node:fs'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      // Vercel serves dist/404.html for unknown paths — keep it identical to the SPA shell
      name: 'spa-404-fallback',
      closeBundle() {
        const dist = path.resolve(__dirname, 'dist')
        const indexHtml = path.join(dist, 'index.html')
        const notFoundHtml = path.join(dist, '404.html')
        if (existsSync(indexHtml)) {
          copyFileSync(indexHtml, notFoundHtml)
        }
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
