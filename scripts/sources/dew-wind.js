import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

export default {
  name: 'dew-wind',
  title: 'Dew Point Spread & Wind Gusts',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=temperature_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m&temperature_unit=celsius&wind_speed_unit=mph&timezone=UTC&past_hours=6&forecast_hours=72'
    const raw = await fetchJson(url)
    const h = raw.hourly ?? {}
    const forecast = (h.time ?? []).map((time, i) => ({
      time: toUtcIso(time),
      temperature: h.temperature_2m?.[i] ?? null,
      dewPoint: h.dew_point_2m?.[i] ?? null,
      windSpeed: h.wind_speed_10m?.[i] ?? null,
      windGust: h.wind_gusts_10m?.[i] ?? null,
    })).filter((row) => row.time && Date.parse(row.time) >= now.getTime())

    return {
      location: { name: locationName, lat, lon },
      forecast: forecast.slice(0, 12),
    }
  },
}
