import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution, formatRaw } from '../../src/formatters/night-forecast.formatter.js'

// Open-Meteo hourly cloud cover for the configured observing location.
// Override with SITE_LAT / SITE_LON / SITE_LOCATION_NAME environment variables.
// Times are requested in UTC and stored as ISO strings so browsers display them correctly.
export default {
  name: 'night-forecast',
  title,
  attribution,
  async fetchRaw() {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const locationName = (process.env.SITE_LOCATION_NAME || 'Greenwich, UK')
      .replace(/^["']|["']$/g, '')
      .trim()
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=cloud_cover,cloud_cover_high,cloud_cover_mid,cloud_cover_low,visibility,is_day' +
      '&timezone=UTC&past_hours=24&forecast_hours=72'
    const raw = await fetchJson(url)
    return {
      location: { name: locationName, lat, lon },
      hourly: raw.hourly ?? {},
    }
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw(), now)
  },
}
