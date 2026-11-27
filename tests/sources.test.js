import { test } from 'node:test'
import assert from 'node:assert/strict'
import sources from '../scripts/sources/index.js'

function mockResponse(mode) {
  return async (url) => {
    const textUrl = String(url)
    const parsedUrl = new URL(textUrl, 'http://localhost')
    const host = parsedUrl.hostname
    const path = parsedUrl.pathname
    const query = parsedUrl.search
    const json = () => {
      if (mode === 'bad') {
        if (textUrl.includes('planetary-k-index')) return [[ 'time_tag', 'Kp' ], ['bad', 'bad']]
        if (host === 'api.open-meteo.com') return { hourly: {}, daily: {} }
        if (host === 'api.pl') return { dataseries: [{ timepoint: 'bad', transparency: 'bad' }] }
        if (host === 'cads.api' || host === 'cad.api') return { fields: [], data: [] }
        if (host === 'meteorshowercal.com') return { shower: null, alsoActive: [] }
        if (host === 'cobs.si') return { objects: [] }
        if (textUrl.includes('articles')) return { results: [] }
        return {}
      }
      if (mode === 'good') {
        if (textUrl.includes('planetary-k-index')) return [['time_tag', 'Kp'], ['2026-01-01T12:00:00Z', 3]]
        if (host === 'll.thespacedevs.com') return { results: [{ id: '1', name: 'Falcon 9', net: '2026-01-01T12:00:00Z', status: { abbrev: 'Go' } }] }
        if (host === 'api.open-meteo.com') {
          if (query.includes('daily=sunrise')) return { daily: { sunrise: ['2026-01-01T12:00'], sunset: ['2026-01-01T22:00'] } }
          return {
            hourly: {
              time: ['2026-01-01T12:00'],
              cloud_cover: [20],
              cloud_cover_high: [10],
              cloud_cover_mid: [15],
              cloud_cover_low: [25],
              temperature_2m: [20],
              dew_point_2m: [15],
              wind_speed_10m: [8],
            },
          }
        }
        if (host === 'api.pl') return { init: '2026010112', dataseries: [{ timepoint: 1, transparency: 0.3 }] }
        if (host === 'cad.api') return { fields: ['des', 'cd', 'dist', 'v_rel', 'h'], data: [['2026 AA', '2026-Jan-01 12:00', '0.01', '10000', '20']] }
        if (host === 'meteorshowercal.com' && path.includes('/api/v1/tonight')) return { shower: { code: 'QUA', name: 'Quadrantids', zhr: 30 }, alsoActive: [], verdict: { headline: 'Active' } }
        if (host === 'meteorshowercal.com' && path.includes('/api/v1/shower')) return { peak: { utc: '2026-01-01T12:00:00Z' } }
        if (host === 'cobs.si') return { objects: [{ fullname: 'Comet A', is_active: true, current_mag: 5 }] }
        if (textUrl.includes('articles')) return { results: [{ id: 1, title: 'News', url: 'https://example.com', news_site: 'Example', published_at: '2026-01-01T12:00:00Z' }] }
      }
      if (mode === 'none') return {}
      return {}
    }
    const text = async () => {
      if (mode === 'bad') return 'bad malformed data'
      if (mode === 'none') return ''
      if (textUrl.includes('GROUP=visual')) {
        return 'ISS (ZARYA)\n1 25544U 98067A   24001.00000000  .00000000  00000+0  00000+0 0  9999\n2 25544  51.6400 123.0000 0004000 123.0000 123.0000 15.49000000 99999\n'
      }
      if (host === 'horizons.api') {
        return ' 2026-Jan-01 12:00  1.0 2.0 180.0 30.0 -1.0\n'
      }
      return ''
    }
    return { ok: true, status: 200, statusText: 'OK', json, text }
  }
}

for (const source of sources) {
  test(`${source.name}: good source payload parses`, async () => {
    const original = globalThis.fetch
    globalThis.fetch = mockResponse('good')
    try {
      const payload = await source.fetch({ now: new Date('2026-01-01T00:00:00Z') })
      assert.ok(payload && typeof payload === 'object')
    } finally {
      globalThis.fetch = original
    }
  })

  test(`${source.name}: bad source values are handled`, async () => {
    const original = globalThis.fetch
    globalThis.fetch = mockResponse('bad')
    try {
      await assert.doesNotReject(() => source.fetch({ now: new Date('2026-01-01T00:00:00Z') }))
    } finally {
      globalThis.fetch = original
    }
  })

  test(`${source.name}: no source data is handled`, async () => {
    const original = globalThis.fetch
    globalThis.fetch = mockResponse('none')
    try {
      await assert.doesNotReject(() => source.fetch({ now: new Date('2026-01-01T00:00:00Z') }))
    } finally {
      globalThis.fetch = original
    }
  })
}

test('neo-close-approaches: requests a dynamic 30-day window within 0.05 AU', async () => {
  const source = sources.find((candidate) => candidate.name === 'neo-close-approaches')
  const original = globalThis.fetch
  let requestedUrl
  globalThis.fetch = async (url) => {
    requestedUrl = String(url)
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ fields: ['des', 'cd', 'dist', 'v_rel', 'h'], data: [] }),
      text: async () => '',
    }
  }

  try {
    await source.fetch({ now: new Date('2026-01-01T00:00:00Z') })
  } finally {
    globalThis.fetch = original
  }

  const url = new URL(requestedUrl)
  assert.equal(url.hostname, 'ssd-api.jpl.nasa.gov')
  assert.equal(url.pathname, '/cad.api')
  assert.equal(url.searchParams.get('date-min'), '2026-01-01')
  assert.equal(url.searchParams.get('date-max'), '2026-01-31')
  assert.equal(url.searchParams.get('dist-max'), '0.05')
})
