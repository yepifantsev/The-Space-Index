import './style.css'
import { h } from './h.js'
import { renderSection } from './sections.js'
import {
  title as moonTitle,
  attribution as moonAttribution,
  formatMoonTimeline,
  updateLiveMoonCard,
} from './sources/moon-timeline.js'
import * as spaceWeatherSource from './sources/space-weather.js'
import * as nightForecastSource from './sources/night-forecast.js'
import * as atmosphereTransparencySource from './sources/atmosphere-transparency.js'
import * as dewPointSpreadSource from './sources/dew-point-spread.js'
import * as windSource from './sources/wind.js'
import * as launchesSource from './sources/launches.js'
import * as visiblePlanetsSource from './sources/visible-planets.js'
import * as celestialEventsSource from './sources/celestial-events.js'
import * as neoCloseApproachesSource from './sources/neo-close-approaches.js'
import * as newsSource from './sources/news.js'
import * as satellitesSource from './sources/satellites.js'

// Data JSON files are produced by `npm run fetch` and bundled at build time,
// so visitors never make requests to third-party APIs.
const modules = import.meta.glob('../data/*.json', { eager: true, import: 'default' })
const rawModules = import.meta.glob('../data/raw/*.json', { eager: true, import: 'default' })
const order = ['night-forecast', 'wind', 'dew-point-spread', 'space-weather', 'atmosphere-transparency', 'moon-timeline', 'visible-planets', 'celestial-events', 'neo-close-approaches', 'launches', 'satellites', 'news']
const rank = (name) => (order.includes(name) ? order.indexOf(name) : order.length)
const sources = Object.values(modules).sort(
  (a, b) => rank(a.name) - rank(b.name) || String(a.name).localeCompare(String(b.name)),
)

const sharedSources = {
  'moon-timeline': {
    title: moonTitle,
    attribution: moonAttribution,
    formatRaw: formatMoonTimeline,
  },
  'space-weather': spaceWeatherSource,
  'night-forecast': nightForecastSource,
  'atmosphere-transparency': atmosphereTransparencySource,
  'dew-point-spread': dewPointSpreadSource,
  'wind': windSource,
  launches: launchesSource,
  'visible-planets': visiblePlanetsSource,
  'celestial-events': celestialEventsSource,
  'neo-close-approaches': neoCloseApproachesSource,
  news: newsSource,
  satellites: {
    title: satellitesSource.title,
    attribution: satellitesSource.attribution,
  },
}

for (const [name, shared] of Object.entries(sharedSources)) {
  const raw = rawModules[`../data/raw/${name}.json`]
  const source = sources.find((candidate) => candidate.name === name)
  if (!source) continue
  if (shared.title) source.title = shared.title
  if (shared.attribution) source.attribution = shared.attribution
  if (raw && shared.formatRaw) {
    source.data = shared.formatRaw(raw)
  }
}

const app = document.querySelector('#app')
if (sources.length === 0) {
  app.append(h('p', { class: 'muted' }, 'No data yet. Run `npm run fetch` to pull data, then reload.'))
} else {
  app.append(...sources.map(renderSection))
}

const moonSource = sources.find((source) => source.name === 'moon-timeline')
if (moonSource?.data?.location) {
  const moonCard = document.querySelector('#moon-timeline')
  const refreshLiveMoon = () => updateLiveMoonCard(
    moonCard,
    moonSource.data.location.lat,
    moonSource.data.location.lon,
  )
  refreshLiveMoon()
  setInterval(refreshLiveMoon, 60 * 1000)
}

document.querySelector('#build-time').textContent =
  `${new Date(__BUILD_TIME__).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })}`

document.querySelector('#build-version').textContent =
  `v${__APP_VERSION__}`


  const locationTime = document.querySelector('#site-location-time')

function formatLocationDateTime(date) {
  const month = new Intl.DateTimeFormat('en-US', {
    timeZone: __SITE_TIME_ZONE__,
    month: 'short',
  }).format(date)
  const day = new Intl.DateTimeFormat('en-US', {
    timeZone: __SITE_TIME_ZONE__,
    day: 'numeric',
  }).format(date)
  return `${month} ${day}`
}

function updateLocationTime() {
  locationTime.textContent = `${__SITE_LOCATION_NAME__} · ${formatLocationDateTime(new Date())}`
}

updateLocationTime()
setInterval(updateLocationTime, 30 * 1000)
