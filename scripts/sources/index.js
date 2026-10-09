import spaceWeather from './space-weather.js'
import launches from './launches.js'
import nightForecast from './night-forecast.js'
import satellites from './satellites.js'
import news from './news.js'

// Add new data sources here. Each source must export { name, title, attribution, fetch }.
export default [spaceWeather, launches, nightForecast, satellites, news]
