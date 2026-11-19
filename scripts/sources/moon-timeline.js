import { fetchJson, fetchText } from '../lib/http.js'
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

function easternDateParts(now) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const get = (type) => parts.find((part) => part.type === type)?.value
  return { year: get('year'), month: get('month'), day: get('day') }
}

async function fetchUsnoMoonAltitude(lat, lon, now) {
  const { year, month, day } = easternDateParts(now)
  const date = `${year}-${month}-${day}`
  const url =
    'https://aa.usno.navy.mil/calculated/altaz' +
    `?body=11&date=${date}&intv_mag=60` +
    `&lat=${lat}&lon=${lon}&tz=5&tz_sign=-1&submit=Get+Data`
  const html = await fetchText(url)
  const rows = []
  const rowPattern = /<tr>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<td>([^<]+)<\/td>\s*<\/tr>/gi
  let match
  while ((match = rowPattern.exec(html)) !== null) {
    const time = match[1].trim()
    const altitude = Number(match[2].replace(/[^0-9.+-]/g, ''))
    const azimuth = Number(match[3].replace(/[^0-9.+-]/g, ''))
    const illumination = Number(match[4].trim())
    if (/^\d{2}:\d{2}$/.test(time) && Number.isFinite(altitude)) {
      rows.push({ time, altitude, azimuth, illumination: Number.isFinite(illumination) ? illumination : null })
    }
  }

  const easternClock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(now)
  const currentMinutes = Number(easternClock.slice(0, 2)) * 60 + Number(easternClock.slice(3, 5))
  const nearest = rows.reduce((best, row) => {
    const [hour, minute] = row.time.split(':').map(Number)
    const distance = Math.abs(hour * 60 + minute - currentMinutes)
    return !best || distance < best.distance ? { ...row, distance } : best
  }, null)
  return nearest
}

async function fetchUsnoPrimaryPhases(now) {
  const { year } = easternDateParts(now)
  const currentYear = await fetchJson(
    `https://aa.usno.navy.mil/api/moon/phases/year?year=${year}&ID=TheSpaceIndex`,
  )
  const nextYear = await fetchJson(
    `https://aa.usno.navy.mil/api/moon/phases/year?year=${Number(year) + 1}&ID=TheSpaceIndex`,
  )
  const data = [
    ...(currentYear.phasedata ?? []),
    ...(nextYear.phasedata ?? []),
  ]

  const phases = data.map((phase) => ({
    name: phase.phase,
    time: new Date(
      Date.UTC(
        Number(phase.year),
        Number(phase.month) - 1,
        Number(phase.day),
        Number(phase.time.slice(0, 2)),
        Number(phase.time.slice(3, 5)),
      ),
    ).toISOString(),
  })).sort((first, second) => Date.parse(first.time) - Date.parse(second.time))

  return {
    previous: phases.filter((phase) => Date.parse(phase.time) < now.getTime()).at(-1) ?? null,
    next: phases.find((phase) => Date.parse(phase.time) >= now.getTime()) ?? null,
  }
}

export default {
  name: 'moon-timeline',
  title: 'Moon',
  attribution: [
    { label: 'USNO', url: 'https://aa.usno.navy.mil/data/AltAz' },
  ],
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const locationName = process.env.SITE_LOCATION_NAME || 'Greenwich, UK'
    const url =
      'https://api.open-meteo.com/v1/forecast' +
      `?latitude=${lat}&longitude=${lon}` +
      '&daily=sunrise,sunset,moonrise,moonset&timezone=UTC&forecast_days=7'
    const [raw, usno, primaryPhases] = await Promise.all([
      fetchJson(url),
      fetchUsnoMoonAltitude(lat, lon, now),
      fetchUsnoPrimaryPhases(now),
    ])
    const daily = raw.daily ?? {}
    const findNext = (values) =>
      (values ?? []).map(toUtcIso).find((time) => time && Date.parse(time) >= now.getTime()) ?? null

    const phase = moonPhase(now)
    const lunar = calculateGeneralLunarSkyGlow(
      usno?.illumination ?? phase.fraction,
      usno?.altitude ?? -1,
    )

    return {
      location: { name: locationName, lat, lon },
      sunrise: findNext(daily.sunrise),
      sunset: findNext(daily.sunset),
      moonrise: findNext(daily.moonrise),
      moonset: findNext(daily.moonset),
      moon: {
        ...phase,
        illumination: usno?.illumination != null
          ? Math.round(usno.illumination * 100)
          : phase.illumination,
        altitude: usno?.altitude ?? null,
        azimuth: usno?.azimuth ?? null,
        apparentMag: lunar.apparentMag,
        zenithSkySqm: lunar.zenithSkySqm,
        phaseAngleDeg: lunar.phaseAngleDeg,
        previousPhase: primaryPhases.previous,
        nextPhase: primaryPhases.next,
      },
    }
  },
}
