import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

// NOAA SWPC planetary K-index (3-hour values, last ~7 days). time_tag values are UTC.
const ENDPOINT = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'

export default {
  name: 'space-weather',
  title: 'Space Weather',
  attribution: { label: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/' },
  async fetch() {
    const raw = await fetchJson(ENDPOINT)
    // Product is either [header, ...rows] (array of arrays) or an array of objects.
    let rows = []
    if (Array.isArray(raw) && Array.isArray(raw[0])) {
      const [header, ...rest] = raw
      rows = rest.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])))
    } else if (Array.isArray(raw)) {
      rows = raw
    }
    const kp = rows
      .map((r) => ({ time: toUtcIso(r.time_tag), kp: Number(r.Kp ?? r.kp ?? r.kp_index) }))
      .filter((r) => r.time && Number.isFinite(r.kp))
    return { latest: kp.at(-1) ?? null, kp: kp.slice(-24) }
  },
}
