import { fetchJson, fetchText } from '../lib/http.js'
import * as satellite from 'satellite.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { toUtcIso } from '../lib/time.js'

// CelesTrak general perturbations (GP) elements for the visual-satellite group.
const ENDPOINT = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=TLE'
const SUN_ENDPOINT =
  'https://api.open-meteo.com/v1/forecast' +
  '?daily=sunrise,sunset&timezone=UTC&forecast_days=7'

const HORIZON_RADIANS = satellite.degreesToRadians(0)
const AFTER_SUNSET_MINUTES = 30
const BEFORE_SUNRISE_MINUTES = 30
const TWILIGHT_WINDOW_LENGTH_MINUTES = 60

function compassDirection(azimuthDegrees) {
  const normalized = (azimuthDegrees + 360) % 360
  if (normalized < 22.5 || normalized >= 337.5) return 'N'
  if (normalized < 67.5) return 'NE'
  if (normalized < 112.5) return 'E'
  if (normalized < 157.5) return 'SE'
  if (normalized < 202.5) return 'S'
  if (normalized < 247.5) return 'SW'
  if (normalized < 292.5) return 'W'
  return 'NW'
}

function findNextPass(satrec, lat, lon, now, twilightWindows) {
  const observer = {
    latitude: satellite.degreesToRadians(lat),
    longitude: satellite.degreesToRadians(lon),
    height: 0,
  }
  let previousElevation = null
  let activePass = null
  let nextPass = null

  for (let minutes = 1; minutes <= 48 * 60; minutes += 1) {
    const time = new Date(now.getTime() + minutes * 60 * 1000)
    const positionAndVelocity = satellite.propagate(satrec, time)
    if (positionAndVelocity.position == null || positionAndVelocity.position === true) continue

    const gmst = satellite.gstime(time)
    const satelliteEcf = satellite.eciToEcf(positionAndVelocity.position, gmst)
    const look = satellite.ecfToLookAngles(observer, satelliteEcf)
    const elevation = look.elevation
    const azimuth = satellite.radiansToDegrees(look.azimuth)
    const elevationDegrees = satellite.radiansToDegrees(elevation)

    if (previousElevation != null && previousElevation < HORIZON_RADIANS && elevation >= HORIZON_RADIANS) {
      activePass = { time, maxAltitude: elevationDegrees, azimuth }
    }
    if (activePass) {
      if (elevationDegrees > activePass.maxAltitude) {
        activePass = { time, maxAltitude: elevationDegrees, azimuth }
      }
      if (previousElevation != null && previousElevation >= HORIZON_RADIANS && elevation < HORIZON_RADIANS) {
        const culminationTime = activePass.time.getTime()
        if (twilightWindows.some(([start, end]) => culminationTime >= start && culminationTime <= end)) {
          nextPass = {
            time: activePass.time.toISOString(),
            maxAltitude: activePass.maxAltitude,
            direction: compassDirection(activePass.azimuth),
          }
          break
        }
      }
    }
    previousElevation = elevation
  }
  return nextPass
}

export default {
  name: 'satellites',
  title: 'Upcoming Satellite Passes',
  attribution: { label: 'CelesTrak', url: 'https://celestrak.org/' },
  async fetch({ now = new Date(), lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat), lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon) } = {}) {
    const [raw, sunRaw] = await Promise.all([
      fetchText(ENDPOINT),
      fetchJson(
        `${SUN_ENDPOINT}&latitude=${lat}&longitude=${lon}`,
      ),
    ])
    const daily = sunRaw.daily ?? {}
    const twilightWindows = []
    for (const value of daily.sunset ?? []) {
      const sunset = Date.parse(toUtcIso(value))
      if (Number.isFinite(sunset)) {
        twilightWindows.push([
          sunset + AFTER_SUNSET_MINUTES * 60 * 1000,
          sunset + (AFTER_SUNSET_MINUTES + TWILIGHT_WINDOW_LENGTH_MINUTES) * 60 * 1000,
        ])
      }
    }
    for (const value of daily.sunrise ?? []) {
      const sunrise = Date.parse(toUtcIso(value))
      if (Number.isFinite(sunrise)) {
        twilightWindows.push([
          sunrise - (BEFORE_SUNRISE_MINUTES + TWILIGHT_WINDOW_LENGTH_MINUTES) * 60 * 1000,
          sunrise - BEFORE_SUNRISE_MINUTES * 60 * 1000,
        ])
      }
    }
    const upcomingWindows = twilightWindows.filter(([, end]) => end >= now.getTime())
    const lines = raw.split(/\r?\n/)
    const entries = []
    for (let i = 0; i + 2 < lines.length; i += 3) {
      const name = lines[i].trim()
      const line1 = lines[i + 1].trim()
      const line2 = lines[i + 2].trim()
      if (!name || !line1.startsWith('1 ') || !line2.startsWith('2 ')) continue
      entries.push({ name, line1, line2 })
    }
    return {
      satellites: entries.map((s) => {
        let nextPass = null
        try {
          nextPass = findNextPass(
            satellite.twoline2satrec(s.line1, s.line2),
            lat,
            lon,
            now,
            upcomingWindows,
          )
        } catch {
          nextPass = null
        }
        return {
          name: s.name,
          noradId: s.line1.slice(2, 7).trim(),
          nextPass,
        }
      }).filter((satellite) => satellite.nextPass && satellite.nextPass.maxAltitude >= 15),
    }
  },
}
