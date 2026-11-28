import { fetchJson } from '../lib/http.js'
import { title, attribution, formatRaw } from '../../src/formatters/news.formatter.js'

// Spaceflight News API v4.
const ENDPOINT = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=10'

export default {
  name: 'news',
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
