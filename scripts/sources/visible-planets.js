import { fetchText } from '../lib/http.js'

const PLANETS = [
  { name: 'Mercury', id: '199', icon: '☿' },
  { name: 'Venus', id: '299', icon: '♀' },
  { name: 'Mars', id: '499', icon: '♂' },
  { name: 'Jupiter', id: '599', icon: '♃' },
  { name: 'Saturn', id: '699', icon: '♄' },
  { name: 'Uranus', id: '799', icon: '⛢' },
  { name: 'Neptune', id: '899', icon: '♆' },
]

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function constellationFromRa(raHours) {
  if (raHours < 2) return 'Pisces'
  if (raHours < 4) return 'Aries'
  if (raHours < 6) return 'Taurus'
  if (raHours < 8) return 'Gemini'
  if (raHours < 10) return 'Cancer'
  if (raHours < 12) return 'Leo'
  if (raHours < 14) return 'Virgo'
  if (raHours < 16) return 'Libra'
  if (raHours < 18) return 'Scorpius'
  if (raHours < 20) return 'Sagittarius'
  if (raHours < 22) return 'Capricornus'
  if (raHours < 24) return 'Aquarius'
  return 'Pisces'
}

function parseHorizons(text) {
  const positions = []
  const re = /^ (\d{4}-[A-Z][a-z]{2}-\d{2})\s+(\d{2}:\d{2})\s+(.*)$/gm
  let match
  while ((match = re.exec(text)) !== null) {
    const monthIndex = MONTHS.indexOf(match[1].slice(5, 8))
    const [year, , day] = match[1].split('-')
    const time = match[2]
    const values = match[3].trim().split(/\s+/)
      .map((token) => Number(token))
      .filter((value) => Number.isFinite(value))
    if (values.length < 4) continue
    const iso = new Date(Date.UTC(Number(year), monthIndex, Number(day), Number(time.slice(0, 2)), Number(time.slice(3, 5)))).toISOString()
    positions.push({
      time: iso,
      ra: values[0],
      dec: values[1],
      azimuth: values[2],
      altitude: values[3],
      apparentMagnitude: values[4] ?? null,
    })
  }
  return positions
}

function nextRiseSet(positions, nowMs) {
  let rise = null
  let set = null
  for (let i = 1; i < positions.length; i += 1) {
    const previous = positions[i - 1]
    const current = positions[i]
    const time = Date.parse(current.time)
    if (time < nowMs) continue
    if (previous.altitude <= 0 && current.altitude > 0 && !rise) {
      const previousTime = Date.parse(previous.time)
      const fraction = -previous.altitude / (current.altitude - previous.altitude)
      rise = new Date(previousTime + (time - previousTime) * fraction).toISOString()
    }
    if (previous.altitude >= 0 && current.altitude < 0 && !set) {
      const previousTime = Date.parse(previous.time)
      const fraction = previous.altitude / (previous.altitude - current.altitude)
      set = new Date(previousTime + (time - previousTime) * fraction).toISOString()
    }
  }
  return { rise, set }
}

function maximumElevation(positions, nowMs) {
  const upcoming = positions.filter((position) => Date.parse(position.time) >= nowMs)
  if (upcoming.length === 0) return null
  return upcoming.reduce((best, position) =>
    !best || position.altitude > best.altitude ? position : best,
  null)
}

export default {
  name: 'visible-planets',
  title: 'Visible Planets Tonight',
  attribution: { label: 'NASA/JPL Horizons', url: 'https://ssd.jpl.nasa.gov/horizons/' },
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
    const eastLon = lon >= 0 ? lon : 360 + lon
    const formatHorizonsDate = (date) =>
      `${date.getUTCFullYear()}-${MONTHS[date.getUTCMonth()]}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:00`
    const start = formatHorizonsDate(new Date(Math.floor(now.getTime() / 3600000) * 3600000))
    const stop = formatHorizonsDate(new Date(now.getTime() + 36 * 3600000))

    const planets = []
    for (const planet of PLANETS) {
      const url =
        'https://ssd.jpl.nasa.gov/api/horizons.api' +
        '?format=text&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=OBSERVER' +
        `&COMMAND='${planet.id}'&CENTER='coord@399'` +
        `&SITE_COORD='${eastLon},${lat},0'` +
        `&START_TIME='${start}'&STOP_TIME='${stop}'&STEP_SIZE='10 min'` +
        '&QUANTITIES=3,4,9,20'
      const text = await fetchText(url)
      const positions = parseHorizons(text)
      const nearest = positions.reduce((best, position) => {
        const distance = Math.abs(Date.parse(position.time) - now.getTime())
        return !best || distance < best.distance ? { ...position, distance } : best
      }, null)
      const { rise, set } = nextRiseSet(positions, now.getTime())
      const maximum = maximumElevation(positions, now.getTime())
      planets.push({
        name: planet.name,
        icon: planet.icon,
        aboveHorizon: nearest ? nearest.altitude > 0 : false,
        altitude: nearest?.altitude ?? null,
        azimuth: nearest?.azimuth ?? null,
        constellation: nearest ? constellationFromRa(nearest.ra / 15) : null,
        rise,
        set,
        maximumElevation: maximum?.altitude ?? null,
        maximumElevationTime: maximum?.time ?? null,
        apparentMagnitude: nearest?.apparentMagnitude ?? null,
      })
    }

    return { location: { lat, lon }, planets }
  },
}
