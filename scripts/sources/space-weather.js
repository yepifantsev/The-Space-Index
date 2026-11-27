import { fetchJson } from '../lib/http.js'
import { title, attribution, formatRaw } from '../../src/sources/space-weather.js'

// NOAA SWPC planetary K-index (3-hour values, last ~7 days). time_tag values are UTC.
const ENDPOINT = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'

export default {
  name: 'space-weather',
  title,
  attribution,
  async fetchRaw() {
    return fetchJson(ENDPOINT)
  },
  formatRaw,
  async fetch() {
    return formatRaw(await this.fetchRaw())
  },
}
