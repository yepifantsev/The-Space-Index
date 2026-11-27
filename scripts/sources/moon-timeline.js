import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { toUtcIso } from '../lib/time.js'
import * as Astronomy from 'astronomy-engine'

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

export function calculateMoonAltAz(lat, lon, now = new Date()) {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, now, observer, true, true)
  const horizontal = Astronomy.Horizon(now, observer, equatorial.ra, equatorial.dec, 'normal')
  return {
    altitude: Number(horizontal.altitude.toFixed(1)),
    azimuth: Number(horizontal.azimuth.toFixed(1)),
  }
}

export function calculatePrimaryLunarPhases(now = new Date()) {
  const phaseNames = ['New Moon', 'First Quarter', 'Full Moon', 'Last Quarter']
  const phases = []
  let searchFrom = new Date(now.getTime() - 40 * 86400000)

  for (let index = 0; index < 8; index += 1) {
    const quarter = Astronomy.SearchMoonQuarter(searchFrom, 1)
    const time = quarter.time.date
    phases.push({ name: phaseNames[quarter.quarter], time: time.toISOString() })
    searchFrom = new Date(time.getTime() + 1000)
  }

  return {
    previous: phases.filter((phase) => Date.parse(phase.time) < now.getTime()).at(-1) ?? null,
    next: phases.find((phase) => Date.parse(phase.time) >= now.getTime()) ?? null,
  }
}

export function calculateGeneralLunarSkyGlow(illumination, moonAltDeg, options = {}) {
  const { extinction = 0.25, darkSkySqm = 21.5 } = options
  const DEG2RAD = Math.PI / 180
  const RAD2DEG = 180 / Math.PI
  const k = Math.max(0, Math.min(1, illumination))
  const alphaDeg = Math.acos(2 * k - 1) * RAD2DEG
  const apparentMag = -12.73 + 0.026 * Math.abs(alphaDeg) + 4e-9 * Math.pow(alphaDeg, 4)

  if (moonAltDeg <= 0 || k <= 0.001) {
    return {
      phaseAngleDeg: Number(alphaDeg.toFixed(1)),
      apparentMag: Number(apparentMag.toFixed(2)),
      extinctedMag: null,
      zenithSkySqm: Number(darkSkySqm.toFixed(2)),
    }
  }

  const zenithDistDeg = Math.max(5, 90 - moonAltDeg)
  const zenithDistRad = zenithDistDeg * DEG2RAD
  const X_moon = Math.pow(1 - 0.96 * Math.pow(Math.sin(zenithDistRad), 2), -0.5)
  const X_zenith = 1.0
  const illuminance = Math.pow(10, -0.4 * (apparentMag + 16.57))
  const rayleigh = Math.pow(10, 5.36) * (1.06 + Math.pow(Math.cos(zenithDistRad), 2))
  const mie = Math.pow(10, 6.15 - zenithDistDeg / 40)
  const scattering = rayleigh + mie
  const B_moon_nL =
    scattering *
    illuminance *
    Math.pow(10, -0.4 * extinction * X_moon) *
    (1 - Math.pow(10, -0.4 * extinction * X_zenith))
  const B_dark_nL = 34.08 * Math.exp(20.7233 - 0.92104 * darkSkySqm)
  const zenithSkySqm = (20.7233 - Math.log((B_dark_nL + B_moon_nL) / 34.08)) / 0.92104

  return {
    phaseAngleDeg: Number(alphaDeg.toFixed(1)),
    apparentMag: Number(apparentMag.toFixed(2)),
    extinctedMag: Number((apparentMag + extinction * X_moon).toFixed(2)),
    zenithSkySqm: Number(zenithSkySqm.toFixed(2)),
  }
}

export default {
  name: 'moon-timeline',
  title: 'Moon 123',
  attribution: [
    { label: 'Astronomy Engine', url: 'https://github.com/cosinekitty/astronomy' },
    { label: 'Open-Meteo', url: 'https://open-meteo.com/' },
  ],
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const locationName = (process.env.SITE_LOCATION_NAME || 'Greenwich, UK')
      .replace(/^["']|["']$/g, '')
      .trim()
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&daily=sunrise,sunset,moonrise,moonset&timezone=UTC&forecast_days=7'
    const localAltAz = calculateMoonAltAz(lat, lon, now)
    const primaryPhases = calculatePrimaryLunarPhases(now)
    const [rawResult] = await Promise.allSettled([fetchJson(url)])
    const raw = rawResult.status === 'fulfilled' ? rawResult.value : {}
    const daily = raw.daily ?? {}
    const findNext = (values) =>
      (values ?? []).map(toUtcIso).find((time) => time && Date.parse(time) >= now.getTime()) ?? null

    const phase = moonPhase(now)
    const lunar = calculateGeneralLunarSkyGlow(
      phase.fraction,
      localAltAz.altitude,
    )

    return {
      location: { name: locationName, lat, lon },
      sunrise: findNext(daily.sunrise),
      sunset: findNext(daily.sunset),
      moonrise: findNext(daily.moonrise),
      moonset: findNext(daily.moonset),
      moon: {
        ...phase,
        altitude: localAltAz.altitude,
        aboveHorizon: localAltAz.altitude >= 0,
        azimuth: localAltAz.azimuth,
        apparentMag: lunar.apparentMag,
        zenithSkySqm: lunar.zenithSkySqm,
        phaseAngleDeg: lunar.phaseAngleDeg,
        previousPhase: primaryPhases.previous,
        nextPhase: primaryPhases.next,
      },
    }
  },
}
