import { fetchJson } from '../lib/http.js'

const AU_TO_LD = 389.17240072

function estimateDiameterKm(absoluteMagnitude) {
  if (!Number.isFinite(absoluteMagnitude)) return null
  const albedo = 0.14
  return 1329 / Math.sqrt(albedo) * Math.pow(10, -absoluteMagnitude / 5)
}

export default {
  name: 'neo-close-approaches',
  title: 'NEO Close Approaches',
  attribution: { label: 'NASA/JPL CNEOS', url: 'https://cneos.jpl.nasa.gov/ca/' },
  async fetch({ now = new Date() } = {}) {
    const dateStart = now.toISOString().slice(0, 10)
    const dateEnd = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10)
    const url =
      'https://ssd-api.jpl.nasa.gov/cad.api' +
      `?date-min=${dateStart}&date-max=${dateEnd}` +
      '&dist-max=0.05&limit=20'
    const raw = await fetchJson(url)
    const fields = raw.fields ?? []
    const index = Object.fromEntries(fields.map((field, i) => [field, i]))
    const approaches = (raw.data ?? []).map((row) => {
      const distanceAu = Number(row[index.dist])
      const absoluteMagnitude = Number(row[index.h])
      const diameterKm = estimateDiameterKm(absoluteMagnitude)
      return {
        name: row[index.des],
        date: row[index.cd],
        missDistanceLd: distanceAu * AU_TO_LD,
        relativeVelocityKph: Number(row[index.v_rel]) * 3600,
        absoluteMagnitude,
        estimatedDiameterKm: diameterKm,
      }
    }).filter((object) =>
      Number.isFinite(object.missDistanceLd) &&
      Number.isFinite(object.relativeVelocityKph),
    ).sort((a, b) => a.missDistanceLd - b.missDistanceLd)

    return { approaches }
  },
}
