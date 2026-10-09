import { fetchJson } from '../lib/http.js'

// Spaceflight News API v4.
const URL = 'https://api.spaceflightnewsapi.net/v4/articles/?limit=10'

export default {
  name: 'news',
  title: 'Space News',
  attribution: { label: 'Spaceflight News API', url: 'https://spaceflightnewsapi.net/' },
  async fetch() {
    const raw = await fetchJson(URL)
    return {
      articles: (raw.results ?? []).map((a) => ({
        id: a.id,
        title: a.title,
        url: a.url,
        site: a.news_site,
        summary: a.summary,
        publishedAt: a.published_at,
      })),
    }
  },
}
