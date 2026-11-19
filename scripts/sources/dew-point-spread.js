import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

export default {
  name: 'dew-point-spread',
  title: 'Dew Point Spread Forecast',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const raw = await fetchJson(
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,dew_point_2m&temperature_unit=celsius&timezone=UTC&past_hours=24&forecast_hours=72',
    )
    const h = raw.hourly ?? {}
    const forecast = (h.time ?? []).map((time, i) => {
      const temperature = h.temperature_2m?.[i]
      const dewPoint = h.dew_point_2m?.[i]
      return {
        time: toUtcIso(time),
        spreadC: Number.isFinite(temperature) && Number.isFinite(dewPoint)
          ? temperature - dewPoint
          : null,
      }
    }).filter((row) => row.time && Date.parse(row.time) >= now.getTime() - 24 * 3600000)
    return { location: { lat, lon }, forecast }
  },
}
