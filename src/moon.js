import * as Astronomy from 'astronomy-engine'

export function azimuthToCompass(azimuth) {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return directions[Math.round(((azimuth % 360) + 360) % 360 / 45) % 8]
}

export function altitudeStatus(altitude) {
  return altitude >= 0 ? 'Above horizon' : 'Below horizon'
}

export function calculateZenithSkyGlow(apparentMag, moonAltitude, options = {}) {
  const { extinction = 0.25, darkSkySqm = 21.5 } = options
  if (!Number.isFinite(apparentMag) || moonAltitude <= 0) {
    return darkSkySqm
  }

  const deg2rad = Math.PI / 180
  const zenithDistDeg = Math.max(5, 90 - moonAltitude)
  const zenithDistRad = zenithDistDeg * deg2rad
  const moonAirMass = Math.pow(1 - 0.96 * Math.pow(Math.sin(zenithDistRad), 2), -0.5)
  const illuminance = Math.pow(10, -0.4 * (apparentMag + 16.57))
  const rayleigh = Math.pow(10, 5.36) * (1.06 + Math.pow(Math.cos(zenithDistRad), 2))
  const mie = Math.pow(10, 6.15 - zenithDistDeg / 40)
  const moonBrightness =
    (rayleigh + mie) *
    illuminance *
    Math.pow(10, -0.4 * extinction * moonAirMass) *
    (1 - Math.pow(10, -0.4 * extinction))
  const darkBrightness = 34.08 * Math.exp(20.7233 - 0.92104 * darkSkySqm)
  return (20.7233 - Math.log((darkBrightness + moonBrightness) / 34.08)) / 0.92104
}

export function calculateLiveMoon(lat, lon, now = new Date()) {
  const observer = new Astronomy.Observer(lat, lon, 0)
  const equatorial = Astronomy.Equator(Astronomy.Body.Moon, now, observer, true, true)
  const horizontal = Astronomy.Horizon(now, observer, equatorial.ra, equatorial.dec, 'normal')
  const illumination = Astronomy.Illumination(Astronomy.Body.Moon, now)
  const angle = ((Astronomy.MoonPhase(now) % 360) + 360) % 360
  const apparentMag = illumination.mag
  const zenithSkySqm = calculateZenithSkyGlow(apparentMag, horizontal.altitude)

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
    aboveHorizon: horizontal.altitude >= 0,
    azimuth: horizontal.azimuth,
    apparentMag,
    zenithSkySqm,
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
  const apparentMag = card.querySelector('.moon-apparent-magnitude')
  const zenithSkySqm = card.querySelector('.moon-sky-glow')

  glyph.textContent = moon.glyph
  glyph.setAttribute('aria-label', moon.name)
  name.textContent = moon.name
  illumination.textContent = `${moon.illumination}% illuminated`
  altitude.textContent = `${moon.altitude.toFixed(1)}° (${altitudeStatus(moon.altitude)})`
  altitude.classList.toggle('muted', !moon.aboveHorizon)
  azimuth.textContent = `${moon.azimuth.toFixed(1)}° (${azimuthToCompass(moon.azimuth)})`
  apparentMag.textContent = moon.apparentMag.toFixed(2)
  zenithSkySqm.textContent = `${moon.zenithSkySqm.toFixed(2)} mag/arcsec²`
}
