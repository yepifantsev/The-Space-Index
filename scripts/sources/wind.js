import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution, formatRaw } from '../../src/formatters/wind.formatter.js'

export default {
  name: 'wind',
  title,
  attribution,
  async fetchRaw() {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const raw = await fetchJson(
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=wind_speed_10m&wind_speed_unit=mph&timezone=UTC&past_hours=24&forecast_hours=72',
    )
    return { location: { lat, lon }, hourly: raw.hourly ?? {} }
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw(), now)
  },
}
