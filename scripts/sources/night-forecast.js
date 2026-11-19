import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

// Open-Meteo hourly cloud cover for the configured observing location.
// Override with SITE_LAT / SITE_LON / SITE_LOCATION_NAME environment variables.
// Times are requested in UTC and stored as ISO strings so browsers display them correctly.
export default {
  name: 'night-forecast',
  title: 'Cloud Cover',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&hourly=cloud_cover,cloud_cover_high,cloud_cover_mid,cloud_cover_low,visibility,is_day' +
      '&timezone=UTC&past_hours=24&forecast_hours=72'
    const raw = await fetchJson(url)
    const h = raw.hourly ?? {}
    const nowMs = now.getTime()
    const hours = (h.time ?? []).map((time, i) => ({
      time: toUtcIso(time),
      cloudCover: h.cloud_cover?.[i] ?? null,
      cloudCoverHigh: h.cloud_cover_high?.[i] ?? null,
      cloudCoverMid: h.cloud_cover_mid?.[i] ?? null,
      cloudCoverLow: h.cloud_cover_low?.[i] ?? null,
      visibility: h.visibility?.[i] ?? null,
      isDay: h.is_day?.[i] === 1,
    }))
    // Keep the prior 24 hours and current forecast horizon for chart paging.
    const forecastHours = hours.filter((x) => Date.parse(x.time) > nowMs - 25 * 3600 * 1000)
    return {
      location: { name: locationName, lat, lon },
      forecastHours,
    }
  },
}
