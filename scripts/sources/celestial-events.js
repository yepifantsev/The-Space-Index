import { fetchJson } from '../lib/http.js'

export default {
  name: 'celestial-events',
  title: 'Active Meteor Showers & Comets',
  attribution: [
    { label: 'MeteorShowerCal', url: 'https://meteorshowercal.com/api/docs/' },
    { label: 'COBS', url: 'https://www.cobs.si/' },
  ],
  async fetch({ now = new Date() } = {}) {
    const lat = Number(process.env.SITE_LAT || 51.4769)
    const lon = Number(process.env.SITE_LON || -0.0005)
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

    const active = [
      meteor.shower,
      ...(meteor.alsoActive ?? []),
    ].filter(Boolean).map((shower) => ({
      name: shower.name,
      code: shower.code,
      zhr: Number(shower.zhr),
      url: shower.url,
    })).filter((shower) => Number.isFinite(shower.zhr))

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
      showers: active,
      comets,
      peakHr: meteor.peakHr ?? null,
      verdict: meteor.verdict?.headline ?? null,
    }
  },
}
