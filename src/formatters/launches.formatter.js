export const title = 'Upcoming Launches'
export const attribution = { label: 'The Space Devs', url: 'https://thespacedevs.com/' }

export function formatRaw(raw) {
  return {
    launches: (raw.results ?? []).map((launch) => ({
      id: launch.id,
      name: launch.name,
      net: launch.net,
      status: launch.status?.abbrev ?? launch.status?.name ?? null,
      provider: launch.launch_service_provider?.name ?? null,
      pad: launch.pad?.name ?? null,
      location: launch.pad?.location?.name ?? null,
    })),
  }
}
