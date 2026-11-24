import { fetchJson } from '../lib/http.js'
import { DEFAULT_LOCATION } from '../lib/location.js'

export default {
  name: 'celestial-events',
  title: 'Active Meteor Showers & Comets',
  attribution: [
    { label: 'MSCal', url: 'https://meteorshowercal.com/api/docs/' },
    { label: 'COBS', url: 'https://www.cobs.si/' },
  ],
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || DEFAULT_LOCATION.lat)
    const lon = Number(process.env.SITE_LON || DEFAULT_LOCATION.lon)
    const meteorUrl =
      'https://meteorshowercal.com/api/v1/tonight' +
      `?lat=${lat}&lon=${lon}`
    const cometUrl =
      'https://cobs.si/api/comet_list.api' +
      '?type=C&alt-des=true&cur-mag=10&page=1'

    const [meteor, cometData] = await Promise.all([
      fetchJson(meteorUrl),
      fetchJson(cometUrl),
    ])

    const activeShowerData = [
      meteor.shower,
      ...(meteor.alsoActive ?? []),
    ].filter(Boolean)

    const active = await Promise.all(
      activeShowerData.map(async (shower) => {
        const zhr = Number(shower.zhr)
        if (!Number.isFinite(zhr)) return null
        const detail = await fetchJson(
          `https://meteorshowercal.com/api/v1/shower/${encodeURIComponent(shower.code)}` +
          `?lat=${lat}&lon=${lon}&date=${now.toISOString().slice(0, 10)}`,
        )
        return {
          name: shower.name,
          code: shower.code,
          zhr,
          peakUtc: detail.peak?.utc ?? null,
          url: shower.url,
        }
      }),
    )
    const sortedActive = active
      .filter(Boolean)
      .sort((first, second) =>
        (Date.parse(first.peakUtc) || Number.MAX_SAFE_INTEGER) -
        (Date.parse(second.peakUtc) || Number.MAX_SAFE_INTEGER),
      )

    const comets = (cometData.objects ?? [])
      .filter((comet) => comet.is_active && Number(comet.current_mag) <= 10)
      .map((comet) => ({
        name: comet.fullname || comet.name,
        magnitude: Number(comet.current_mag),
        perihelionDate: comet.perihelion_date,
        isObserved: comet.is_observed,
      }))
      .sort((a, b) => a.magnitude - b.magnitude)

    return {
      location: { lat, lon },
      showers: sortedActive,
      comets,
      peakHr: meteor.peakHr ?? null,
      verdict: meteor.verdict?.headline ?? null,
    }
  },
}
