import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { toUtcIso } from '../lib/time.js'

export default {
  name: 'wind',
  title: 'Wind Forecast',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const raw = await fetchJson(
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=wind_speed_10m&wind_speed_unit=mph&timezone=UTC&past_hours=24&forecast_hours=72',
    )
    const h = raw.hourly ?? {}
    const forecast = (h.time ?? []).map((time, i) => ({
      time: toUtcIso(time),
      speed: h.wind_speed_10m?.[i] ?? null,
    })).filter((row) => row.time && Date.parse(row.time) >= now.getTime() - 24 * 3600000)
    return { location: { lat, lon }, forecast }
  },
}
