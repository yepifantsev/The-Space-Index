import { fetchJson, fetchText } from '../lib/http.js'
import * as satellite from 'satellite.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution } from '../../src/formatters/satellites.formatter.js'
import { toUtcIso } from '../lib/time.js'

// CelesTrak general perturbations (GP) elements for the visual-satellite group.
const ENDPOINT = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=TLE'
const SUN_ENDPOINT =
  'https://api.open-meteo.com/v1/forecast' +
  '?daily=sunrise,sunset&timezone=UTC&forecast_days=7'

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
  for (let minutes = 1; minutes <= 48 * 60; minutes += 1) {
    const time = new Date(now.getTime() + minutes * 60 * 1000)
    const propagated = satellite.propagate(satrec, time)
    if (propagated.position == null || propagated.position === true) continue
    const gmst = satellite.gstime(time)
    const ecf = satellite.eciToEcf(propagated.position, gmst)
    const look = satellite.ecfToLookAngles(observer, ecf)
    const elevationDegrees = satellite.radiansToDegrees(look.elevation)
    if (previousElevation != null && previousElevation < 0 && look.elevation >= 0) {
      activePass = { time, maxAltitude: elevationDegrees, azimuth: satellite.radiansToDegrees(look.azimuth) }
    }
    if (activePass) {
      if (elevationDegrees > activePass.maxAltitude) {
        activePass = { time, maxAltitude: elevationDegrees, azimuth: satellite.radiansToDegrees(look.azimuth) }
      }
      if (previousElevation != null && previousElevation >= 0 && look.elevation < 0) {
        if (twilightWindows.some(([start, end]) => activePass.time.getTime() >= start && activePass.time.getTime() <= end)) {
          return {
            time: activePass.time.toISOString(),
            maxAltitude: activePass.maxAltitude,
            direction: compassDirection(activePass.azimuth),
          }
        }
      }
    }
    previousElevation = look.elevation
  }
  return null
}

function formatSatelliteRaw(raw, now = new Date()) {
  const at = now instanceof Date ? now : now?.now instanceof Date ? now.now : new Date()
  const lat = raw.location.lat
  const lon = raw.location.lon
  const twilightWindows = []
  for (const value of raw.sun.sunset ?? []) {
    const sunset = Date.parse(toUtcIso(value))
    if (Number.isFinite(sunset)) twilightWindows.push([sunset + 30 * 60 * 1000, sunset + 90 * 60 * 1000])
  }
  for (const value of raw.sun.sunrise ?? []) {
    const sunrise = Date.parse(toUtcIso(value))
    if (Number.isFinite(sunrise)) twilightWindows.push([sunrise - 90 * 60 * 1000, sunrise - 30 * 60 * 1000])
  }
  const upcoming = twilightWindows.filter(([, end]) => end >= at.getTime())
  const satellites = []
  const lines = raw.tle.split(/\r?\n/)
  for (let index = 0; index + 2 < lines.length; index += 3) {
    const name = lines[index].trim()
    const line1 = lines[index + 1].trim()
    const line2 = lines[index + 2].trim()
    if (!name || !line1.startsWith('1 ') || !line2.startsWith('2 ')) continue
    try {
      const nextPass = findNextPass(
        satellite.twoline2satrec(line1, line2),
        lat,
        lon,
        at,
        upcoming,
      )
      if (nextPass && nextPass.maxAltitude >= 15) {
        satellites.push({ name, noradId: line1.slice(2, 7).trim(), nextPass })
      }
    } catch {
      // Ignore malformed TLE records.
    }
  }
  return { satellites }
}

export default {
  name: 'satellites',
  title,
  attribution,
  async fetchRaw({ lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat), lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon) } = {}) {
    const [raw, sunRaw] = await Promise.all([
      fetchText(ENDPOINT),
      fetchJson(
        `${SUN_ENDPOINT}&latitude=${lat}&longitude=${lon}`,
      ),
    ])
    return { location: { lat, lon }, tle: raw, sun: sunRaw.daily ?? {} }
  },
  formatRaw: formatSatelliteRaw,
  async fetch({ now = new Date() } = {}) {
    return formatSatelliteRaw(await this.fetchRaw(), now)
  },
}
