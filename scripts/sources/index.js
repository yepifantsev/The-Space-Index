import spaceWeather from './space-weather.js'
import nightForecast from './night-forecast.js'
import satellites from './satellites.js'
import news from './news.js'
import launches from './launches.js'
import moonTimeline from './moon-timeline.js'
import observingConditions from './observing-conditions.js'

// Add new data sources here. Each source must export { name, title, attribution, fetch }.
export default [spaceWeather, launches, nightForecast, observingConditions, moonTimeline, satellites, news]
