import spaceWeather from './space-weather.fetcher.js'
import nightForecast from './night-forecast.fetcher.js'
import satellites from './satellites.fetcher.js'
import news from './news.fetcher.js'
import launches from './launches.fetcher.js'
import moonTimeline from './moon-timeline.fetcher.js'
import transparency from './transparency.fetcher.js'
import dewPoint from './dew-point.fetcher.js'
import wind from './wind.fetcher.js'
import visiblePlanets from './visible-planets.fetcher.js'
import celestialEvents from './celestial-events.fetcher.js'
import neo from './neo.fetcher.js'

// Add new data sources here. Each source must export { name, title, attribution, fetch }.
export default [spaceWeather, launches, nightForecast, transparency, dewPoint, wind, moonTimeline, visiblePlanets, celestialEvents, neo, satellites, news]
