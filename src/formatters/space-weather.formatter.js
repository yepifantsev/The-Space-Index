export const title = 'Space Weather'
export const attribution = { label: 'NOAA SWPC', url: 'https://www.swpc.noaa.gov/' }

export function toUtcIso(value) {
  if (typeof value !== 'string' || !value) return null
  const normalized = value.trim().replace(' ', 'T')
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
}

export function formatRaw(raw) {
  let rows = []
  if (Array.isArray(raw) && Array.isArray(raw[0])) {
    const [header, ...rest] = raw
    rows = rest.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index]])))
  } else if (Array.isArray(raw)) {
    rows = raw
  }
  const kp = rows
    .map((row) => ({ time: toUtcIso(row.time_tag), kp: Number(row.Kp ?? row.kp ?? row.kp_index) }))
    .filter((row) => row.time && Number.isFinite(row.kp))
  return { latest: kp.at(-1) ?? null, kp: kp.slice(-24) }
}
