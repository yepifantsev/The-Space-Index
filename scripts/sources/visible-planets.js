import { fetchText } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'
import { title, attribution, formatRaw } from '../../src/formatters/visible-planets.formatter.js'

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

export default {
  name: 'visible-planets',
  title,
  attribution,
  async fetchRaw({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const eastLon = lon >= 0 ? lon : 360 + lon
    const formatHorizonsDate = (date) =>
      `${date.getUTCFullYear()}-${MONTHS[date.getUTCMonth()]}-${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}:00`
    const start = formatHorizonsDate(new Date(Math.floor(now.getTime() / 3600000) * 3600000))
    const stop = formatHorizonsDate(new Date(now.getTime() + 36 * 3600000))

    const horizons = []
    for (const planet of PLANETS) {
      const url =
        'https://ssd.jpl.nasa.gov/api/horizons.api' +
        '?format=text&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=OBSERVER' +
        `&COMMAND='${planet.id}'&CENTER='coord@399'` +
        `&SITE_COORD='${eastLon},${lat},0'` +
        `&START_TIME='${start}'&STOP_TIME='${stop}'&STEP_SIZE='10 min'` +
        '&QUANTITIES=3,4,9,20'
      const text = await fetchText(url)
      horizons.push({ name: planet.name, text })
    }
    return { location: { lat, lon }, horizons }
  },
  formatRaw,
  async fetch({ now = new Date() } = {}) {
    return formatRaw(await this.fetchRaw({ now }), now)
  },
}
