import { fetchJson } from '../lib/http.js'

// Open-Meteo hourly cloud cover for the configured observing location.
// Override with SITE_LAT / SITE_LON / SITE_LOCATION_NAME environment variables.
export default {
  name: 'night-forecast',
  title: 'Night Sky Forecast',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch() {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=cloud_cover,visibility,is_day' +
      '&daily=sunrise,sunset&timezone=auto&forecast_days=2'
    const raw = await fetchJson(url)
    const h = raw.hourly ?? {}
    const hours = (h.time ?? []).map((time, i) => ({
      time,
      cloudCover: h.cloud_cover?.[i] ?? null,
      visibility: h.visibility?.[i] ?? null,
      isDay: h.is_day?.[i] === 1,
    }))
    return {
      location: { name: locationName, lat, lon, timezone: raw.timezone ?? null },
      sunset: raw.daily?.sunset?.[0] ?? null,
      sunrise: raw.daily?.sunrise?.[1] ?? null,
      nightHours: hours.filter((x) => !x.isDay).slice(0, 12),
    }
  },
}
