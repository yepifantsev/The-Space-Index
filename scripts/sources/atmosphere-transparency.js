import { fetchJson } from '../lib/http.js'

export default {
  name: 'atmosphere-transparency',
  title: 'Atmosphere Transparency',
  attribution: { label: '7Timer!', url: 'https://www.7timer.info/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const raw = await fetchJson(
      'https://www.7timer.info/bin/api.pl' +
      `?lon=${lon}&lat=${lat}&product=astro&output=json`,
    )
    const init = String(raw.init ?? '')
    const initIso = init.length === 10
      ? `${init.slice(0, 4)}-${init.slice(4, 6)}-${init.slice(6, 8)}T${init.slice(8, 10)}:00:00Z`
      : null
    const initMs = initIso ? Date.parse(initIso) : null
    const forecast = (raw.dataseries ?? []).map((row) => ({
      time: Number.isFinite(initMs)
        ? new Date(initMs + Number(row.timepoint) * 3600000).toISOString()
        : null,
      rating: Number(row.transparency),
    })).filter((row) => row.time && Date.parse(row.time) >= now.getTime())
    return { location: { lat, lon }, forecast }
  },
}
