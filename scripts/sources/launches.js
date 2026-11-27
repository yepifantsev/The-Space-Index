import { fetchJson } from '../lib/http.js'
import { title, attribution, formatRaw } from '../../src/formatters/launches.formatter.js'

// The Space Devs Launch Library 2 (free tier is rate-limited to ~15 req/hour).
const ENDPOINT = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=10'

export default {
  name: 'launches',
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
