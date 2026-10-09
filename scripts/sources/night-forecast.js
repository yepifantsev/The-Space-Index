import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

// Open-Meteo hourly cloud cover for the configured observing location.
// Override with SITE_LAT / SITE_LON / SITE_LOCATION_NAME environment variables.
// Times are requested in UTC and stored as ISO strings so browsers display them correctly.
export default {
  name: 'night-forecast',
  title: 'Night Sky Forecast',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=cloud_cover,visibility,is_day' +
      '&daily=sunrise,sunset&timezone=UTC&forecast_days=3'
    const raw = await fetchJson(url)
    const h = raw.hourly ?? {}
    const nowMs = now.getTime()
    const hours = (h.time ?? []).map((time, i) => ({
      time: toUtcIso(time),
      cloudCover: h.cloud_cover?.[i] ?? null,
      visibility: h.visibility?.[i] ?? null,
      isDay: h.is_day?.[i] === 1,
    }))
    // Only upcoming hours: keep the current hour, drop anything that has already passed.
    const upcoming = hours.filter((x) => Date.parse(x.time) > nowMs - 3600 * 1000)
    const sunsets = (raw.daily?.sunset ?? []).map(toUtcIso)
    const sunrises = (raw.daily?.sunrise ?? []).map(toUtcIso)
    const sunset = sunsets.find((t) => Date.parse(t) > nowMs) ?? null
    const sunrise = sunrises.find((t) => Date.parse(t) > Date.parse(sunset ?? now.toISOString())) ?? null
    return {
      location: { name: locationName, lat, lon },
      sunset,
      sunrise,
      nightHours: upcoming.filter((x) => !x.isDay).slice(0, 12),
    }
  },
}
