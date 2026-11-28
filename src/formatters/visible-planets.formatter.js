export const title = 'Visible Planets Tonight'
export const attribution = { label: 'NASA/JPL Horizons', url: 'https://ssd.jpl.nasa.gov/horizons/' }

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
    const [hour, minute] = match[2].split(':').map(Number)
    const values = match[3].trim().split(/\s+/).map(Number).filter(Number.isFinite)
    if (values.length < 4) continue
    positions.push({
      time: new Date(Date.UTC(Number(year), monthIndex, Number(day), hour, minute)).toISOString(),
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
  for (let index = 1; index < positions.length; index += 1) {
    const previous = positions[index - 1]
    const current = positions[index]
    const time = Date.parse(current.time)
    if (time < nowMs) continue
    if (previous.altitude <= 0 && current.altitude > 0 && !rise) {
      const previousTime = Date.parse(previous.time)
      rise = new Date(previousTime + (time - previousTime) * (-previous.altitude / (current.altitude - previous.altitude))).toISOString()
    }
    if (previous.altitude >= 0 && current.altitude < 0 && !set) {
      const previousTime = Date.parse(previous.time)
      set = new Date(previousTime + (time - previousTime) * (previous.altitude / (previous.altitude - current.altitude))).toISOString()
    }
  }
  return { rise, set }
}

export function formatRaw(raw, now = new Date()) {
  const at = now instanceof Date ? now : now?.now instanceof Date ? now.now : new Date()
  const planets = (raw.horizons ?? []).map((planet) => {
    const positions = parseHorizons(planet.text)
    const nearest = positions.reduce((best, position) => {
      const distance = Math.abs(Date.parse(position.time) - at.getTime())
      return !best || distance < best.distance ? { ...position, distance } : best
    }, null)
    const { rise, set } = nextRiseSet(positions, at.getTime())
    const upcoming = positions.filter((position) => Date.parse(position.time) >= at.getTime())
    const maximum = upcoming.reduce((best, position) =>
      !best || position.altitude > best.altitude ? position : best,
    null)
    const definition = PLANETS.find((candidate) => candidate.name === planet.name)
    return {
      name: planet.name,
      icon: definition?.icon ?? '•',
      aboveHorizon: nearest ? nearest.altitude > 0 : false,
      altitude: nearest?.altitude ?? null,
      azimuth: nearest?.azimuth ?? null,
      constellation: nearest ? constellationFromRa(nearest.ra / 15) : null,
      rise,
      set,
      maximumElevation: maximum?.altitude ?? null,
      maximumElevationTime: maximum?.time ?? null,
      apparentMagnitude: nearest?.apparentMagnitude ?? null,
    }
  })
  return { location: raw.location, planets }
}
