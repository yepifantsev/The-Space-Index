import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import {
  attribution,
  title,
  formatMoonTimeline,
} from '../../src/sources/moon-timeline.js'

export { formatMoonTimeline }

export default {
  name: 'moon-timeline',
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
      '&daily=sunrise,sunset,moonrise,moonset&timezone=UTC&forecast_days=7'
    const raw = await fetchJson(url)
    return {
      location: { name: locationName, lat, lon },
      daily: raw.daily ?? {},
    }
  },
  formatRaw(raw, { now = new Date() } = {}) {
    return formatMoonTimeline(raw, now)
  },
  async fetch({ now = new Date() } = {}) {
    const raw = await this.fetchRaw()
    return this.formatRaw(raw, { now })
  },
}
