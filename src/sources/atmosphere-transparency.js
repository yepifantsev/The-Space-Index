export const title = 'Atmosphere Transparency'
export const attribution = { label: '7Timer!', url: 'https://www.7timer.info/' }

export function formatRaw(raw, now = new Date()) {
  const at = now instanceof Date ? now : now?.now instanceof Date ? now.now : new Date()
  const init = String(raw?.init ?? '')
  const initIso = init.length === 10
    ? `${init.slice(0, 4)}-${init.slice(4, 6)}-${init.slice(6, 8)}T${init.slice(8, 10)}:00:00Z`
    : null
  const initMs = initIso ? Date.parse(initIso) : null
  const forecast = (raw?.dataseries ?? []).map((row) => ({
    time: Number.isFinite(initMs)
      ? new Date(initMs + Number(row.timepoint) * 3600000).toISOString()
      : null,
    rating: Number(row.transparency),
  })).filter((row) =>
    row.time &&
    Date.parse(row.time) >= at.getTime() - 24 * 3600000,
  )
  return { location: raw?.location ?? null, forecast }
}
