export const title = 'Active Meteor Showers & Comets'
export const attribution = [
  { label: 'MSCal', url: 'https://meteorshowercal.com/api/docs/' },
  { label: 'COBS', url: 'https://www.cobs.si/' },
]

export function formatRaw(raw) {
  const sortedActive = (raw.active ?? []).filter(Boolean).sort((first, second) =>
    (Date.parse(first.peakUtc) || Number.MAX_SAFE_INTEGER) -
    (Date.parse(second.peakUtc) || Number.MAX_SAFE_INTEGER),
  )
  const comets = (raw.comets ?? []).map((comet) => ({
    name: comet.fullname || comet.name,
    magnitude: Number(comet.current_mag),
    perihelionDate: comet.perihelion_date,
    isObserved: comet.is_observed,
  })).filter((comet) =>
    comet.name &&
    Number.isFinite(comet.magnitude) &&
    comet.magnitude <= 10,
  ).sort((first, second) => first.magnitude - second.magnitude)
  return {
    location: raw.location,
    showers: sortedActive,
    comets,
    peakHr: raw.peakHr ?? null,
    verdict: raw.verdict?.headline ?? raw.verdict ?? null,
  }
}
