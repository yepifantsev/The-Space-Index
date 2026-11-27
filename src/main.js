import './style.css'
import { h } from './h.js'
import { renderSection } from './sections.js'
import { updateLiveMoonCard } from './moon.js'

// Data JSON files are produced by `npm run fetch` and bundled at build time,
// so visitors never make requests to third-party APIs.
const modules = import.meta.glob('../data/*.json', { eager: true, import: 'default' })
const order = ['night-forecast', 'wind', 'dew-point-spread', 'space-weather', 'atmosphere-transparency', 'moon-timeline', 'visible-planets', 'celestial-events', 'neo-close-approaches', 'launches', 'satellites', 'news']
const rank = (name) => (order.includes(name) ? order.indexOf(name) : order.length)
const sources = Object.values(modules).sort(
  (a, b) => rank(a.name) - rank(b.name) || String(a.name).localeCompare(String(b.name)),
)

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
