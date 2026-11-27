import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution, formatRaw } from '../../src/formatters/celestial-events.formatter.js'

export default {
  name: 'celestial-events',
  title,
  attribution,
  async fetchRaw({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const meteorUrl =
      'https://meteorshowercal.com/api/v1/tonight' +
      `?lat=${lat}&lon=${lon}`
    const cometUrl =
      'https://cobs.si/api/comet_list.api' +
      '?type=C&alt-des=true&cur-mag=10&page=1'

    const [meteor, cometData] = await Promise.all([
      fetchJson(meteorUrl),
      fetchJson(cometUrl),
    ])

    const activeShowerData = [meteor.shower, ...(meteor.alsoActive ?? [])].filter(Boolean)

    const active = await Promise.all(
      activeShowerData.map(async (shower) => {
        const zhr = Number(shower.zhr)
        if (!Number.isFinite(zhr)) return null
        const detail = await fetchJson(
          `https://meteorshowercal.com/api/v1/shower/${encodeURIComponent(shower.code)}` +
          `?lat=${lat}&lon=${lon}&date=${now.toISOString().slice(0, 10)}`,
        )
        return {
          name: shower.name,
          code: shower.code,
          zhr,
          peakUtc: detail.peak?.utc ?? null,
          url: shower.url,
        }
      }),
    )
    return {
      location: { lat, lon },
      active: active.filter(Boolean),
      comets: cometData.objects ?? [],
      peakHr: meteor.peakHr ?? null,
      verdict: meteor.verdict ?? null,
    }
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw({ now }))
  },
}
