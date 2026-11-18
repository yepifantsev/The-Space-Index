import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

export default {
  name: 'astronomical-conditions',
  title: 'Astronomical Seeing & Transparency',
  attribution: { label: '7Timer!', url: 'https://www.7timer.info/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const url =
      'https://www.7timer.info/bin/api.pl' +
      `?lon=${lon}&lat=${lat}&product=astro&output=json`
    const raw = await fetchJson(url)

    const init = String(raw.init ?? '')
    const initIso = init.length === 10
      ? `${init.slice(0, 4)}-${init.slice(4, 6)}-${init.slice(6, 8)}T${init.slice(8, 10)}:00:00Z`
      : null
    const initMs = initIso ? Date.parse(initIso) : null

    const forecasts = (raw.dataseries ?? []).map((row) => {
      const time = Number.isFinite(initMs)
        ? toUtcIso(new Date(initMs + Number(row.timepoint) * 3600 * 1000).toISOString())
        : null
      return {
        time,
        cloudCover: row.cloudcover ?? null,
        seeing: row.seeing ?? null,
        transparency: row.transparency ?? null,
      }
    }).filter((row) => row.time && Date.parse(row.time) >= now.getTime())

    return {
      location: { lat, lon },
      forecasts: forecasts.slice(0, 12),
      scale: {
        seeing: '1-8 category scale',
        transparency: '1-8 category scale',
      },
    }
  },
}
