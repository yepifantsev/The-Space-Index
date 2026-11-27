import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calculateLiveMoon, azimuthToCompass } from '../src/moon.js'

test('calculateLiveMoon returns current phase and horizontal coordinates', () => {
  const moon = calculateLiveMoon(
    30.3322,
    -81.6556,
    new Date('2026-11-27T05:13:37Z'),
  )

  assert.equal(moon.name, 'Waning Gibbous')
  assert.equal(moon.glyph, '🌖')
  assert.equal(typeof moon.illumination, 'number')
  assert.ok(moon.illumination >= 0 && moon.illumination <= 100)
  assert.ok(moon.altitude >= -90 && moon.altitude <= 90)
  assert.ok(moon.azimuth >= 0 && moon.azimuth < 360)
})

test('azimuthToCompass maps bearings to the nearest cardinal direction', () => {
  assert.equal(azimuthToCompass(0), 'N')
  assert.equal(azimuthToCompass(45), 'NE')
  assert.equal(azimuthToCompass(135), 'SE')
  assert.equal(azimuthToCompass(225), 'SW')
  assert.equal(azimuthToCompass(315), 'NW')
})
