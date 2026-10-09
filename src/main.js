import './style.css'
import { h } from './h.js'
import { renderSection } from './sections.js'

// Data JSON files are produced by `npm run fetch` and bundled at build time,
// so visitors never make requests to third-party APIs.
const modules = import.meta.glob('../data/*.json', { eager: true, import: 'default' })
const order = ['space-weather', 'launches', 'night-forecast', 'satellites', 'news']
const sources = Object.values(modules).sort(
  (a, b) => (order.indexOf(a.name) + 1 || Infinity) - (order.indexOf(b.name) + 1 || Infinity),
)

const app = document.querySelector('#app')
if (sources.length === 0) {
  app.append(h('p', { class: 'muted' }, 'No data yet. Run `npm run fetch` to pull data, then reload.'))
} else {
  app.append(...sources.map(renderSection))
}

document.querySelector('#build-time').textContent = `Built ${new Date(__BUILD_TIME__).toLocaleString()}.`
