import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages project sites are served from /<repo>/. The deploy workflow sets BASE_PATH.
  base: process.env.BASE_PATH || '/',
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __SITE_LOCATION_NAME__: JSON.stringify(process.env.SITE_LOCATION_NAME || 'Greenwich, UK'),
    __SITE_TIME_ZONE__: JSON.stringify(process.env.SITE_TIME_ZONE || 'America/New_York'),
  },
  server: {
    host: true,
    port: 5173,
  },
})
