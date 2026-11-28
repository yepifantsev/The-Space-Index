export const title = 'NEO Close Approaches'
export const attribution = { label: 'NASA/JPL CNEOS', url: 'https://cneos.jpl.nasa.gov/ca/' }

const AU_TO_LD = 389.17240072
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseCneosDate(value) {
  const match = /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}:\d{2})$/.exec(value)
  if (!match) return Number.POSITIVE_INFINITY
  const monthIndex = MONTHS.indexOf(match[2])
  if (monthIndex < 0) return Number.POSITIVE_INFINITY
  return Date.UTC(Number(match[1]), monthIndex, Number(match[3]), Number(match[4].slice(0, 2)), Number(match[4].slice(3, 5)))
}

function estimateDiameterKm(absoluteMagnitude) {
  if (!Number.isFinite(absoluteMagnitude)) return null
  return 1329 / Math.sqrt(0.14) * Math.pow(10, -absoluteMagnitude / 5)
}

export function formatRaw(raw) {
  const fields = raw.fields ?? []
  const index = Object.fromEntries(fields.map((field, i) => [field, i]))
  const approaches = (raw.data ?? []).map((row) => {
    const distanceAu = Number(row[index.dist])
    const absoluteMagnitude = Number(row[index.h])
    return {
      name: row[index.des],
      sbdbUrl: `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${encodeURIComponent(row[index.des])}`,
      date: row[index.cd],
      missDistanceLd: distanceAu * AU_TO_LD,
      relativeVelocityKph: Number(row[index.v_rel]) * 3600,
      absoluteMagnitude,
      estimatedDiameterKm: estimateDiameterKm(absoluteMagnitude),
    }
  }).filter((object) =>
    Number.isFinite(object.missDistanceLd) &&
    Number.isFinite(object.relativeVelocityKph),
  ).sort((first, second) => parseCneosDate(first.date) - parseCneosDate(second.date))
  return { approaches }
}
