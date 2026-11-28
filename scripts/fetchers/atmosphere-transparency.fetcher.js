import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution, formatRaw } from '../../src/formatters/atmosphere-transparency.formatter.js'

export default {
  name: 'atmosphere-transparency',
  title,
  attribution,
  async fetchRaw() {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const data = await fetchJson(
      'https://www.7timer.info/bin/api.pl' +
      `?lon=${lon}&lat=${lat}&product=astro&output=json`,
    )
    return { ...data, location: { lat, lon } }
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw(), now)
  },
}
