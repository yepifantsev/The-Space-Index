import { fetchJson } from '../lib/http.js'
import { title, attribution, formatRaw } from '../../src/sources/neo-close-approaches.js'

export default {
  name: 'neo-close-approaches',
  title,
  attribution,
  async fetchRaw({ now = new Date() } = {}) {
    const dateStart = now.toISOString().slice(0, 10)
    const dateEnd = new Date(now.getTime() + 30 * 86400000).toISOString().slice(0, 10)
    const url =
      'https://ssd-api.jpl.nasa.gov/cad.api' +
      `?date-min=${dateStart}&date-max=${dateEnd}` +
      '&dist-max=0.05&limit=100'
    return fetchJson(url)
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw({ now }))
  },
}
