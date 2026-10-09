import { fetchJson } from '../lib/http.js'

// CelesTrak general perturbations (GP) elements for crewed space stations.
const URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json'

export default {
  name: 'satellites',
  title: 'Satellite Tracking',
  attribution: { label: 'CelesTrak', url: 'https://celestrak.org/' },
  async fetch() {
    const raw = await fetchJson(URL)
    return {
      satellites: (Array.isArray(raw) ? raw : []).slice(0, 25).map((s) => ({
        name: s.OBJECT_NAME,
        noradId: s.NORAD_CAT_ID,
        epoch: s.EPOCH,
        inclination: s.INCLINATION,
        meanMotion: s.MEAN_MOTION,
        eccentricity: s.ECCENTRICITY,
      })),
    }
  },
}
