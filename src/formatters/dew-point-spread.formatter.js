export const title = 'Dew Point Spread Forecast'
export const attribution = { label: 'Open-Meteo', url: 'https://open-meteo.com/' }

function toUtcIso(value) {
  if (typeof value !== 'string' || !value) return null
  const normalized = value.trim().replace(' ', 'T')
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
}

export function formatRaw(raw, now = new Date()) {
  const at = now instanceof Date ? now : now?.now instanceof Date ? now.now : new Date()
  const hourly = raw?.hourly ?? {}
  const forecast = (hourly.time ?? []).map((time, index) => {
    const temperature = hourly.temperature_2m?.[index]
    const dewPoint = hourly.dew_point_2m?.[index]
    return {
      time: toUtcIso(time),
      spreadC: Number.isFinite(temperature) && Number.isFinite(dewPoint)
        ? temperature - dewPoint
        : null,
    }
  }).filter((row) =>
    row.time &&
    Date.parse(row.time) >= at.getTime() - 24 * 3600000,
  )
  return { location: raw?.location ?? null, forecast }
}
