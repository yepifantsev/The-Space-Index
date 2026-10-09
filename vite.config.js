import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project sites are served from /<repo>/. The deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  server: {
    host: true,
    port: 5173,
  },
})
