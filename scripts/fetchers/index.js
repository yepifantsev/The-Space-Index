import spaceWeather from './space-weather.fetcher.js'
import nightForecast from './night-forecast.fetcher.js'
import satellites from './satellites.fetcher.js'
import news from './news.fetcher.js'
import launches from './launches.fetcher.js'
import moonTimeline from './moon-timeline.fetcher.js'
import atmosphereTransparency from './atmosphere-transparency.fetcher.js'
import dewPointSpread from './dew-point-spread.fetcher.js'
import wind from './wind.fetcher.js'
import visiblePlanets from './visible-planets.fetcher.js'
import celestialEvents from './celestial-events.fetcher.js'
import neoCloseApproaches from './neo-close-approaches.fetcher.js'

// Add new data sources here. Each source must export { name, title, attribution, fetch }.
export default [spaceWeather, launches, nightForecast, atmosphereTransparency, dewPointSpread, wind, moonTimeline, visiblePlanets, celestialEvents, neoCloseApproaches, satellites, news]
