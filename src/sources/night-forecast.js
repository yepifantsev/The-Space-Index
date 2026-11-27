export const title = 'Cloud Cover Forecast'
export const attribution = { label: 'Open-Meteo', url: 'https://open-meteo.com/' }

function toUtcIso(value) {
  if (typeof value !== 'string' || !value) return null
  const normalized = value.trim().replace(' ', 'T')
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(normalized) ? normalized : `${normalized}Z`
}

export function formatRaw(raw, now = new Date()) {
  const at = now instanceof Date ? now : now?.now instanceof Date ? now.now : new Date()
  const hourly = raw?.hourly ?? {}
  const location = raw?.location ?? null
  const forecastHours = (hourly.time ?? []).map((time, index) => ({
    time: toUtcIso(time),
    cloudCover: hourly.cloud_cover?.[index] ?? null,
    cloudCoverHigh: hourly.cloud_cover_high?.[index] ?? null,
    cloudCoverMid: hourly.cloud_cover_mid?.[index] ?? null,
    cloudCoverLow: hourly.cloud_cover_low?.[index] ?? null,
    visibility: hourly.visibility?.[index] ?? null,
    isDay: hourly.is_day?.[index] === 1,
  })).filter((hour) =>
    hour.time &&
    Date.parse(hour.time) > at.getTime() - 25 * 3600 * 1000,
  )
  return { location, forecastHours }
}
