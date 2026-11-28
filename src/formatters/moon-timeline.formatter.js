import * as Astronomy from 'astronomy-engine'

const SYNODIC_MONTH_DAYS = 29.53058867
const KNOWN_NEW_MOON_MS = Date.parse('2000-01-06T18:14:00Z')

export const title = 'Moon'
export const attribution = [
  { label: '[1]', url: 'https://github.com/cosinekitty/astronomy' },
  { label: '[2]', url: 'https://open-meteo.com/' },
]

export function azimuthToCompass(azimuth) {
  const directions = [
    'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW',
  ]
  const normalized = ((azimuth % 360) + 360) % 360
  return directions[Math.floor((normalized + 11.25) / 22.5) % 16]
}

export function altitudeStatus(altitude) {
  return altitude >= 0 ? 'Above horizon' : 'Below horizon'
}

function normalizeUtcIso(value) {
  if (typeof value !== 'string' || !value) return null
  const normalized = value.trim().replace(' ', 'T')
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
}

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
  const deg2rad = Math.PI / 180
  const rad2deg = 180 / Math.PI
  const k = Math.max(0, Math.min(1, illumination))
  const alphaDeg = Math.acos(2 * k - 1) * rad2deg
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
  const zenithDistRad = zenithDistDeg * deg2rad
  const moonAirMass = Math.pow(1 - 0.96 * Math.pow(Math.sin(zenithDistRad), 2), -0.5)
  const illuminance = Math.pow(10, -0.4 * (apparentMag + 16.57))
  const rayleigh = Math.pow(10, 5.36) * (1.06 + Math.pow(Math.cos(zenithDistRad), 2))
  const mie = Math.pow(10, 6.15 - zenithDistDeg / 40)
  const moonBrightness =
    (rayleigh + mie) *
    illuminance *
    Math.pow(10, -0.4 * extinction * moonAirMass) *
    (1 - Math.pow(10, -0.4 * extinction))
  const darkBrightness = 34.08 * Math.exp(20.7233 - 0.92104 * darkSkySqm)
  const zenithSkySqm = (20.7233 - Math.log((darkBrightness + moonBrightness) / 34.08)) / 0.92104

  return {
    phaseAngleDeg: Number(alphaDeg.toFixed(1)),
    apparentMag: Number(apparentMag.toFixed(2)),
    extinctedMag: Number((apparentMag + extinction * moonAirMass).toFixed(2)),
    zenithSkySqm: Number(zenithSkySqm.toFixed(2)),
  }
}

export function formatMoonTimeline(raw, now = new Date()) {
  const location = raw?.location ?? null
  const lat = Number(location?.lat)
  const lon = Number(location?.lon)
  const daily = raw?.daily ?? {}
  const findNext = (values) =>
    (values ?? []).map(normalizeUtcIso).find((time) => time && Date.parse(time) >= now.getTime()) ?? null
  const localAltAz = Number.isFinite(lat) && Number.isFinite(lon)
    ? calculateMoonAltAz(lat, lon, now)
    : { altitude: null, azimuth: null }
  const phase = moonPhase(now)
  const lunar = calculateGeneralLunarSkyGlow(
    phase.fraction,
    localAltAz.altitude ?? -1,
  )
  const primaryPhases = calculatePrimaryLunarPhases(now)

  return {
    location,
    sunrise: findNext(daily.sunrise),
    sunset: findNext(daily.sunset),
    moonrise: findNext(daily.moonrise),
    moonset: findNext(daily.moonset),
    moon: {
      ...phase,
      altitude: localAltAz.altitude,
      aboveHorizon: localAltAz.altitude != null ? localAltAz.altitude >= 0 : null,
      azimuth: localAltAz.azimuth,
      apparentMag: lunar.apparentMag,
      zenithSkySqm: lunar.zenithSkySqm,
      phaseAngleDeg: lunar.phaseAngleDeg,
      previousPhase: primaryPhases.previous,
      nextPhase: primaryPhases.next,
    },
  }
}

export function calculateLiveMoon(lat, lon, now = new Date()) {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, now, observer, true, true)
  const horizontal = Astronomy.Horizon(now, observer, equatorial.ra, equatorial.dec, 'normal')
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, now)
  const phase = moonPhase(now)
  const zenithSkySqm = calculateLiveZenithSkyGlow(illumination.mag, horizontal.altitude)

  return {
    ...phase,
    illumination: Math.round(illumination.phase_fraction * 100),
    altitude: horizontal.altitude,
    aboveHorizon: horizontal.altitude >= 0,
    azimuth: horizontal.azimuth,
    apparentMag: illumination.mag,
    zenithSkySqm,
  }
}

function calculateLiveZenithSkyGlow(apparentMag, moonAltitude, options = {}) {
  const { extinction = 0.25, darkSkySqm = 21.5 } = options
  if (!Number.isFinite(apparentMag) || moonAltitude <= 0) return darkSkySqm

  const deg2rad = Math.PI / 180
  const zenithDistDeg = Math.max(5, 90 - moonAltitude)
  const zenithDistRad = zenithDistDeg * deg2rad
  const moonAirMass = Math.pow(1 - 0.96 * Math.pow(Math.sin(zenithDistRad), 2), -0.5)
  const illuminance = Math.pow(10, -0.4 * (apparentMag + 16.57))
  const rayleigh = Math.pow(10, 5.36) * (1.06 + Math.pow(Math.cos(zenithDistRad), 2))
  const mie = Math.pow(10, 6.15 - zenithDistDeg / 40)
  const moonBrightness =
    (rayleigh + mie) *
    illuminance *
    Math.pow(10, -0.4 * extinction * moonAirMass) *
    (1 - Math.pow(10, -0.4 * extinction))
  const darkBrightness = 34.08 * Math.exp(20.7233 - 0.92104 * darkSkySqm)
  return (20.7233 - Math.log((darkBrightness + moonBrightness) / 34.08)) / 0.92104
}

