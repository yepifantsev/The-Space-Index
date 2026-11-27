export const title = 'Space News'
export const attribution = { label: 'Spaceflight News', url: 'https://api.spaceflightnewsapi.net/' }

export function formatRaw(raw) {
  return {
    articles: (raw.results ?? []).map((article) => ({
      id: article.id,
      title: article.title,
      url: article.url,
      site: article.news_site,
      summary: article.summary,
      publishedAt: article.published_at,
    })),
  }
}
