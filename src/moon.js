import * as Astronomy from 'astronomy-engine'

export function azimuthToCompass(azimuth) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(((azimuth % 360) + 360) % 360 / 45) % 8]
}

export function calculateLiveMoon(lat, lon, now = new Date()) {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, now, observer, true, true)
  const horizontal = Astronomy.Horizon(now, observer, equatorial.ra, equatorial.dec, 'normal')
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, now)
  const angle = ((Astronomy.MoonPhase(now) % 360) + 360) % 360

  let name
  let glyph
  if (angle < 11.25 || angle >= 348.75) {
    name = 'New Moon'
    glyph = '🌑'
  } else if (angle < 78.75) {
    name = 'Waxing Crescent'
    glyph = '🌒'
  } else if (angle < 101.25) {
    name = 'First Quarter'
    glyph = '🌓'
  } else if (angle < 168.75) {
    name = 'Waxing Gibbous'
    glyph = '🌔'
  } else if (angle < 191.25) {
    name = 'Full Moon'
    glyph = '🌕'
  } else if (angle < 258.75) {
    name = 'Waning Gibbous'
    glyph = '🌖'
  } else if (angle < 281.25) {
    name = 'Last Quarter'
    glyph = '🌗'
  } else {
    name = 'Waning Crescent'
    glyph = '🌘'
  }

  return {
    name,
    glyph,
    illumination: Math.round(illumination.phase_fraction * 100),
    altitude: horizontal.altitude,
    azimuth: horizontal.azimuth,
  }
}

export function updateLiveMoonCard(card, lat, lon, now = new Date()) {
  if (!card) return

  const moon = calculateLiveMoon(lat, lon, now)
  const glyph = card.querySelector('.moon-glyph')
  const name = card.querySelector('.moon-name')
  const illumination = card.querySelector('.moon-illumination')
  const altitude = card.querySelector('.moon-altitude')
  const azimuth = card.querySelector('.moon-azimuth')

  glyph.textContent = moon.glyph
  glyph.setAttribute('aria-label', moon.name)
  name.textContent = moon.name
  illumination.textContent = `${moon.illumination}% illuminated`
  altitude.textContent = `${moon.altitude.toFixed(1)}°`
  azimuth.textContent = `${moon.azimuth.toFixed(1)}° (${azimuthToCompass(moon.azimuth)})`
}
