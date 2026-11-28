import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<main id="app"></main>')
globalThis.window = dom.window
globalThis.document = dom.window.document
globalThis.Node = dom.window.Node
globalThis.__SITE_TIME_ZONE__ = 'America/New_York'

const { renderers, renderSection } = await import('../src/sections.js')

const names = [
  'launches',
  'night-forecast',
  'transparency',
  'dew-point',
  'wind',
  'moon-timeline',
  'celestial-events',
  'neo',
  'satellites',
  'news',
]

const goodData = {
  'space-weather': {
    latest: { time: '2026-01-01T12:00:00Z', kp: 3 },
    kp: [{ time: '2026-01-01T12:00:00Z', kp: 3 }],
  },
  launches: {
    launches: [{ name: 'Falcon 9', net: '2026-01-01T12:00:00Z', status: 'Go', location: 'Florida' }],
  },
  'night-forecast': {
    forecastHours: [{ time: '2026-01-01T12:00:00Z', isDay: false, cloudCover: 20, cloudCoverHigh: 10, cloudCoverMid: 15, cloudCoverLow: 25 }],
  },
  'transparency': {
    forecast: [{ time: '2026-01-01T12:00:00Z', rating: 4 }],
  },
  'dew-point': {
    forecast: [{ time: '2026-01-01T12:00:00Z', spreadC: 5 }],
  },
  wind: {
    forecast: [{ time: '2026-01-01T12:00:00Z', speed: 8 }],
  },
  'moon-timeline': {
    moonrise: '2026-01-01T12:00:00Z',
    moonset: '2026-01-01T13:00:00Z',
    moon: { name: 'Waxing Crescent', glyph: '🌒', illumination: 25, altitude: 10, apparentMag: -12, zenithSkySqm: 21 },
  },
  'visible-planets': {
    planets: [{ name: 'Mars', icon: '♂', aboveHorizon: true, apparentMagnitude: -1, maximumElevationTime: '2026-01-01T12:00:00Z', rise: '2026-01-01T10:00:00Z', set: '2026-01-01T14:00:00Z', constellation: 'Aries' }],
  },
  'celestial-events': {
    verdict: 'Active',
    showers: [{ name: 'Quadrantids', zhr: 30, peakUtc: '2026-01-01T12:00:00Z' }],
    comets: [{ name: 'Comet A', magnitude: 5 }],
  },
  'neo': {
    approaches: [{ name: '2026 AA', date: '2026-Jan-01 12:00', missDistanceLd: 2, relativeVelocityKph: 50000, estimatedDiameterKm: 0.2 }],
  },
  satellites: {
    satellites: [{ name: 'ISS (ZARYA)', nextPass: { time: '2026-01-01T12:00:00Z', maxAltitude: 45, direction: 'SE' } }],
  },
  news: {
    articles: [{ title: 'Launch update', url: 'https://example.com', site: 'Example', publishedAt: '2026-01-01T12:00:00Z' }],
  },
}

const badData = {
  'space-weather': { latest: null, kp: [{ time: 'bad', kp: 'NaN' }] },
  launches: { launches: [{ name: null, net: 'bad', status: null, location: null }] },
  'night-forecast': { forecastHours: [{ time: 'bad', cloudCover: 'bad', cloudCoverHigh: null, cloudCoverMid: Infinity, cloudCoverLow: -100 }] },
  'transparency': { forecast: [{ time: 'bad', rating: 'bad' }] },
  'dew-point': { forecast: [{ time: 'bad', spreadC: 'bad' }] },
  wind: { forecast: [{ time: 'bad', speed: 'bad' }] },
  'moon-timeline': { moon: { illumination: null, altitude: 'bad', apparentMag: Infinity }, moonrise: null, moonset: 'bad' },
  'visible-planets': { planets: [{ name: null, icon: null, aboveHorizon: false, apparentMagnitude: 'bad', maximumElevationTime: 'bad', rise: null, set: null, constellation: null }] },
  'celestial-events': { verdict: null, showers: [{ name: null, zhr: 'bad', peakUtc: 'bad' }], comets: [{ name: null, magnitude: 'bad' }] },
  'neo': { approaches: [{ name: null, date: 'bad', missDistanceLd: 'bad', relativeVelocityKph: Infinity }] },
  satellites: { satellites: [{ name: null, nextPass: { time: 'bad', maxAltitude: 'bad', direction: null } }] },
  news: { articles: [{ title: null, url: null, site: null, publishedAt: 'bad' }] },
}

for (const name of names) {
  test(`${name}: good data renders`, () => {
    assert.ok(renderers[name])
    const node = renderers[name](goodData[name])
    assert.ok(node instanceof dom.window.Node)
  })

  test(`${name}: bad values do not crash`, () => {
    const node = renderers[name](badData[name])
    assert.ok(node instanceof dom.window.Node)
  })

  test(`${name}: no data renders`, () => {
    const node = renderSection({ name, title: name, data: null, updatedAt: null, attribution: null })
    assert.equal(node.tagName, 'SECTION')
  })
}

test('transparency: min controls the chart baseline', () => {
  const node = renderers['transparency'](goodData['transparency'])
  const tickLines = [...node.querySelectorAll('line.night-grid')]
  const minTick = tickLines.find((line) => line.getAttribute('y1') === '200')

  assert.ok(minTick)
  assert.equal(minTick.getAttribute('y1'), '200')

  const valueBar = node.querySelector('rect.night-cell')
  assert.ok(valueBar)
  assert.equal(valueBar.getAttribute('y'), '124')
})

test('standalone metrics without min keep their original zero baseline', () => {
  const dewNode = renderers['dew-point'](goodData['dew-point'])
  const dewBar = dewNode.querySelector('rect.night-cell')
  assert.equal(dewBar.getAttribute('y'), '105')

  const windNode = renderers.wind(goodData.wind)
  const windBar = windNode.querySelector('rect.night-cell')
  assert.equal(windBar.getAttribute('y'), '124')
})

test('neo: empty state covers the next 30 days', () => {
  const node = renderers['neo']({ approaches: [] })
  assert.equal(node.textContent.includes('No close approaches reported for the next 30 days.'), true)
})

test('neo: asteroid glyph rotation uses the last two name characters', () => {
  const node = renderers['neo']({
    approaches: [
      { name: '2026 VV11', date: '2026-Nov-25 21:20', missDistanceLd: 16, relativeVelocityKph: 30000, estimatedDiameterKm: 0.04 },
      { name: '2026 VQ19', date: '2026-Nov-26 10:15', missDistanceLd: 4, relativeVelocityKph: 24000, estimatedDiameterKm: 0.03 },
    ],
  })
  const approaches = [...node.querySelectorAll('.neo-approach')]
  assert.notEqual(approaches[0].style.getPropertyValue('--rock-rotation'), approaches[1].style.getPropertyValue('--rock-rotation'))
})
