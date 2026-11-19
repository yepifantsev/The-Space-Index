import spaceWeather from './space-weather.js'
import nightForecast from './night-forecast.js'
import satellites from './satellites.js'
import news from './news.js'
import launches from './launches.js'
import moonTimeline from './moon-timeline.js'
import atmosphereTransparency from './atmosphere-transparency.js'
import dewPointSpread from './dew-point-spread.js'
import wind from './wind.js'
import visiblePlanets from './visible-planets.js'
import celestialEvents from './celestial-events.js'
import neoCloseApproaches from './neo-close-approaches.js'

// Add new data sources here. Each source must export { name, title, attribution, fetch }.
export default [spaceWeather, launches, nightForecast, atmosphereTransparency, dewPointSpread, wind, moonTimeline, visiblePlanets, celestialEvents, neoCloseApproaches, satellites, news]
