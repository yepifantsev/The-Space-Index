import { fetchJson } from '../lib/http.js'

// The Space Devs Launch Library 2 (free tier is rate-limited to ~15 req/hour).
const ENDPOINT = 'https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=10'

export default {
  name: 'launches',
  title: 'Upcoming Launches',
  attribution: { label: 'The Space Devs', url: 'https://thespacedevs.com/' },
  async fetch() {
    const raw = await fetchJson(ENDPOINT)
    return {
      launches: (raw.results ?? []).map((l) => ({
        id: l.id,
        name: l.name,
        net: l.net,
        status: l.status?.abbrev ?? l.status?.name ?? null,
        provider: l.launch_service_provider?.name ?? null,
        pad: l.pad?.name ?? null,
        location: l.pad?.location?.name ?? null,
      })),
    }
  },
}
