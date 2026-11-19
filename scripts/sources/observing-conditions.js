import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

export default {
  name: 'observing-conditions',
  title: 'Transparency, Dew & Wind',
  attribution: [
    { label: '7Timer!', url: 'https://www.7timer.info/' },
    { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  ],
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'

    const [weather, astro] = await Promise.all([
      fetchJson(
        'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${lat}&longitude=${lon}` +
          '&hourly=temperature_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m' +
          '&temperature_unit=celsius&wind_speed_unit=mph&timezone=UTC&past_hours=24&forecast_hours=72',
      ),
      fetchJson(
        'https://www.7timer.info/bin/api.pl' +
          `?lon=${lon}&lat=${lat}&product=astro&output=json`,
      ),
    ])

    const init = String(astro.init ?? '')
    const initIso = init.length === 10
      ? `${init.slice(0, 4)}-${init.slice(4, 6)}-${init.slice(6, 8)}T${init.slice(8, 10)}:00:00Z`
      : null
    const initMs = initIso ? Date.parse(initIso) : null

    const transparency = (astro.dataseries ?? [])
      .map((row) => ({
        time: Number.isFinite(initMs)
          ? initMs + Number(row.timepoint) * 3600 * 1000
          : null,
        rating: Number(row.transparency),
      }))
      .filter((row) => Number.isFinite(row.time) && Number.isFinite(row.rating))

    const h = weather.hourly ?? {}
    const forecast = (h.time ?? []).map((time, i) => {
      const parsedTime = Date.parse(toUtcIso(time))
      const nearest = transparency
        .map((row) => ({ ...row, distance: Math.abs(row.time - parsedTime) }))
        .sort((a, b) => a.distance - b.distance)[0]

      const temperature = h.temperature_2m?.[i] ?? null
      const dewPoint = h.dew_point_2m?.[i] ?? null
      return {
        time: toUtcIso(time),
        temperature,
        dewPoint,
        dewSpread: Number.isFinite(temperature) && Number.isFinite(dewPoint)
          ? temperature - dewPoint
          : null,
        windSpeed: h.wind_speed_10m?.[i] ?? null,
        windGust: h.wind_gusts_10m?.[i] ?? null,
        transparency: nearest && nearest.distance <= 90 * 60 * 1000 ? nearest.rating : null,
      }
    }).filter((row) => row.time && Date.parse(row.time) >= now.getTime() - 24 * 3600 * 1000)

    return {
      location: { name: locationName, lat, lon },
      forecast: forecast.slice(-96),
    }
  },
}
