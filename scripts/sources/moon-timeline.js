import { fetchJson } from '../lib/http.js'
import { toUtcIso } from '../lib/time.js'

const SYNODIC_MONTH_DAYS = 29.53058867
const KNOWN_NEW_MOON_MS = Date.parse('2000-01-06T18:14:00Z')

export function moonPhase(now = new Date()) {
  const elapsedDays = (now.getTime() - KNOWN_NEW_MOON_MS) / 86400000
  const ageDays = ((elapsedDays % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS
  const fraction = ageDays / SYNODIC_MONTH_DAYS
  const illumination = (1 - Math.cos(2 * Math.PI * fraction)) / 2 * 100

  let name
  let glyph
  if (fraction < 0.0625 || fraction >= 0.9375) {
    name = 'New Moon'; glyph = '🌑'
  } else if (fraction < 0.1875) {
    name = 'Waxing Crescent'; glyph = '🌒'
  } else if (fraction < 0.3125) {
    name = 'First Quarter'; glyph = '🌓'
  } else if (fraction < 0.4375) {
    name = 'Waxing Gibbous'; glyph = '🌔'
  } else if (fraction < 0.5625) {
    name = 'Full Moon'; glyph = '🌕'
  } else if (fraction < 0.6875) {
    name = 'Waning Gibbous'; glyph = '🌖'
  } else if (fraction < 0.8125) {
    name = 'Last Quarter'; glyph = '🌗'
  } else {
    name = 'Waning Crescent'; glyph = '🌘'
  }
  return { name, glyph, illumination: Math.round(illumination), fraction }
}

export default {
  name: 'moon-timeline',
  title: 'Moon',
  attribution: { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&daily=sunrise,sunset,moonrise,moonset&timezone=UTC&forecast_days=7'
    const raw = await fetchJson(url)
    const daily = raw.daily ?? {}
    const findNext = (values) =>
      (values ?? []).map(toUtcIso).find((time) => time && Date.parse(time) >= now.getTime()) ?? null

    return {
      location: { name: locationName, lat, lon },
      sunrise: findNext(daily.sunrise),
      sunset: findNext(daily.sunset),
      moonrise: findNext(daily.moonrise),
      moonset: findNext(daily.moonset),
      moon: moonPhase(now),
    }
  },
}
