/**
 * Normalize a UTC timestamp without an offset (e.g. "2026-01-01 00:00:00" or
 * "2026-01-01T00:00") to ISO 8601 with a trailing "Z". Values that already
 * carry an offset are returned unchanged.
 */
export function toUtcIso(value) {
  if (typeof value !== 'string' || !value) return null
  const s = value.trim().replace(' ', 'T')
  return /(Z|[+-]\d{2}:?\d{2})$/i.test(s) ? s : `${s}Z`
}
