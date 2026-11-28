import { h } from '../../h.js'
import { formatEasternClock, formatEasternNavigation } from './panel-helpers.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svgElement(tag, attrs = {}, text) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value))
  if (text != null) element.textContent = text
  return element
}

export function transparencyNumeric(rating) {
  const values = [0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1]
  return values[Math.max(1, Math.min(8, Number(rating))) - 1]
}

export function transparencyColorForValue(value) {
  if (!Number.isFinite(value)) return '#343b50'
  const navy = [6, 22, 70]
  const gray = [170, 170, 170]
  const amount = Math.max(0, Math.min(1, value))
  return `rgb(${navy.map((channel, i) => Math.round(channel + (gray[i] - channel) * amount)).join(', ')})`
}

export function dewSpreadColor(fahrenheit) {
  if (!Number.isFinite(fahrenheit)) return '#343b50'
  if (fahrenheit > 12) return '#061160'
  if (fahrenheit >= 8) return '#4369a5'
  if (fahrenheit >= 5) return '#78a9c8'
  if (fahrenheit >= 2) return '#e6a04a'
  return '#d66b63'
}

export function windSpeedColor(mph) {
  if (!Number.isFinite(mph)) return '#343b50'
  if (mph <= 5) return '#061160'
  if (mph <= 8) return '#4369a5'
  if (mph <= 11) return '#78a9c8'
  if (mph <= 14) return '#e6a04a'
  return '#d66b63'
}

export function renderStandaloneMetricWindow(hours, start, metric) {
  const width = 400
  const height = 280
  const left = 58
  const right = 396
  const top = 10
  const bottom = 200
  const plotHeight = bottom - top
  const end = start + 24 * 60 * 60 * 1000
  const x = (time) => left + ((time - start) / (end - start)) * (right - left)
  const min = Number.isFinite(metric.min) ? metric.min : 0
  const max = Number.isFinite(metric.max) && metric.max > min ? metric.max : min + 1
  const y = Number.isFinite(metric.min)
    ? (value) => bottom - ((Math.max(min, Math.min(max, value)) - min) / (max - min)) * plotHeight
    : (value) => bottom - (Math.max(0, Math.min(max, value)) / max) * plotHeight
  const chart = svgElement('svg', {
    class: 'night-chart',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `${metric.title} forecast.`,
  })
  chart.append(svgElement('title', {}, `24-hour ${metric.title} forecast`))

  metric.ticks.forEach((tick) => {
    const tickY = y(tick.value)
    chart.append(
      svgElement('line', { x1: left, x2: right, y1: tickY, y2: tickY, class: 'night-grid' }),
      svgElement('text', { x: left - 8, y: tickY + 4, class: 'night-tick', 'text-anchor': 'end' }, tick.label),
    )
  })
  chart.append(svgElement(
    'text',
    { x: 10, y: (top + bottom) / 2, class: 'night-axis-label', 'text-anchor': 'middle', transform: `rotate(-90 10 ${(top + bottom) / 2})` },
    metric.yLabel,
  ))

  hours.forEach((hour) => {
    const hourStart = Date.parse(hour.time)
    let value
    let fill
    let tooltip

    if (metric.type === 'transparency') {
      value = Number(hour.extinction)
      fill = transparencyColorForValue(value)
      tooltip = `${value.toFixed(1)}`
    } else if (metric.type === 'dew') {
      const spreadC = Number(hour.spreadC)
      value = Number.isFinite(spreadC) ? spreadC * 9 / 5 : null
      fill = dewSpreadColor(value)
      tooltip = `${value == null ? 'No data' : value.toFixed(1)}${value == null ? '' : ' °F'}`
    } else {
      value = Number(hour.speed)
      fill = windSpeedColor(value)
      tooltip = `${Number.isFinite(value) ? Math.round(value) : 'No data'}${Number.isFinite(value) ? ' mph' : ''}`
    }
    if (!Number.isFinite(value)) return

    const duration = 60 * 60 * 1000
    const barWidth = duration / (24 * 60 * 60 * 1000) * (right - left)
    const barY = y(value)
    const bar = svgElement('rect', {
      x: x(hourStart) + 1,
      y: barY,
      width: Math.max(1, barWidth - 2),
      height: bottom - barY,
      rx: 2,
      fill,
      class: 'night-cell',
    })
    bar.append(svgElement('title', {}, tooltip))
    chart.append(bar)
  })

  const currentHourStart = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000
  if (currentHourStart >= start && currentHourStart < end) {
    const currentHour = hours.find((hour) => {
      const hourStart = Date.parse(hour.time)
      return hourStart <= currentHourStart && hourStart + 60 * 60 * 1000 > currentHourStart
    })
    let currentValue
    if (currentHour) {
      if (metric.type === 'transparency') currentValue = Number(currentHour.extinction)
      else if (metric.type === 'dew') {
        const spreadC = Number(currentHour.spreadC)
        currentValue = Number.isFinite(spreadC) ? spreadC * 9 / 5 : null
      } else {
        currentValue = Number(currentHour.speed)
      }
    }
    const currentBarY = Number.isFinite(currentValue) ? y(currentValue) : bottom
    chart.append(svgElement('rect', {
      x: x(currentHourStart) + 1,
      y: currentBarY,
      width: Math.max(1, (60 * 60 * 1000 / (24 * 60 * 60 * 1000)) * (right - left) - 2),
      height: bottom - currentBarY,
      rx: 2,
      class: 'night-current-hour',
    }))
  }

  for (let i = 0; i < hours.length; i += 4) {
    const hourStart = Date.parse(hours[i].time)
    chart.append(
      svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: bottom, class: 'night-grid night-grid-vertical' }),
      svgElement('text', { x: x(hourStart), y: bottom + 18, class: 'night-time-label', 'text-anchor': 'middle' }, formatEasternClock(hourStart)),
    )
  }

  const defs = svgElement('defs')
  const gradient = svgElement('linearGradient', { id: `${metric.type}-metric-gradient`, x1: '0%', x2: '100%' })
  metric.gradient.forEach((stop) => {
    gradient.append(svgElement('stop', { offset: stop.offset, 'stop-color': stop.color }))
  })
  defs.append(gradient)
  chart.append(defs)

  const legendY = 250
  chart.append(
    svgElement('text', { x: left, y: 240, class: 'night-legend-title' }, metric.legendTitle),
    svgElement('rect', { x: left, y: legendY, width: right - left, height: 12, rx: 2, fill: `url(#${metric.type}-metric-gradient)` }),
    svgElement('text', { x: left, y: legendY + 27, class: 'night-time-label' }, metric.legendLeft),
    svgElement('text', { x: right, y: legendY + 27, class: 'night-time-label', 'text-anchor': 'end' }, metric.legendRight),
  )
  return chart
}

export function renderStandaloneMetric(hours = [], metric) {
  const validHours = hours
    .filter((hour) => Number.isFinite(Date.parse(hour.time)))
    .sort((first, second) => Date.parse(first.time) - Date.parse(second.time))
  if (validHours.length === 0) return h('p', { class: 'muted' }, 'No hourly forecast available.')

  const hourMs = 60 * 60 * 1000
  const windowMs = 24 * hourMs
  const earliest = Date.parse(validHours[0].time)
  const latest = Date.parse(validHours.at(-1).time)
  const nowMs = Date.now()
  const currentHour = Math.floor(nowMs / hourMs) * hourMs
  const earliestHour = Math.floor(earliest / hourMs) * hourMs
  const latestHour = Math.floor(latest / hourMs) * hourMs
  const firstWindow = earliestHour
  const lastWindow = Math.max(firstWindow, latestHour - windowMs + hourMs)
  let windowStartTime = Math.max(firstWindow, Math.min(currentHour, lastWindow))
  const previous = h('button', { class: 'night-chart-nav', type: 'button', title: 'Previous 24 hours', 'aria-label': 'Previous 24 hours' }, '‹')
  const next = h('button', { class: 'night-chart-nav', type: 'button', title: 'Next 24 hours', 'aria-label': 'Next 24 hours' }, '›')
  const range = h('span', { class: 'night-chart-range', 'aria-live': 'polite' })
  const chartHost = h('div', { class: 'night-chart-host' })
  const controls = h('div', { class: 'night-chart-controls' }, previous, range, next)

  function updateWindow() {
    const windowEndTime = windowStartTime + windowMs
    const windowHours = validHours.filter((hour) => {
      const time = Date.parse(hour.time)
      return time >= windowStartTime && time < windowEndTime
    })
    if (windowHours.length === 0) return
    let chartHours = windowHours
    if (metric.type === 'transparency') {
      chartHours = []
      for (let time = windowStartTime; time < windowEndTime; time += hourMs) {
        if (time < earliest) continue
        const exact = validHours.find((hour) => Date.parse(hour.time) === time)
        if (exact) {
          chartHours.push({ time: new Date(time).toISOString(), extinction: transparencyNumeric(exact.rating) })
          continue
        }
        const before = validHours.filter((hour) => Date.parse(hour.time) < time).at(-1)
        const after = validHours.find((hour) => Date.parse(hour.time) > time)
        let extinction
        if (before && after) {
          const beforeTime = Date.parse(before.time)
          const afterTime = Date.parse(after.time)
          extinction = transparencyNumeric(before.rating) +
            (transparencyNumeric(after.rating) - transparencyNumeric(before.rating)) *
            ((time - beforeTime) / (afterTime - beforeTime))
        } else if (before) {
          extinction = transparencyNumeric(before.rating)
        } else if (after) {
          extinction = transparencyNumeric(after.rating)
        }
        if (Number.isFinite(extinction)) {
          chartHours.push({ time: new Date(time).toISOString(), extinction })
        }
      }
    }
    previous.disabled = windowStartTime <= firstWindow
    next.disabled = windowStartTime >= lastWindow
    range.textContent = `${formatEasternNavigation(windowStartTime)} - ${formatEasternNavigation(windowEndTime)}`
    chartHost.replaceChildren(renderStandaloneMetricWindow(chartHours, windowStartTime, metric))
  }

  previous.addEventListener('click', () => {
    if (windowStartTime > firstWindow) {
      windowStartTime = Math.max(windowStartTime - windowMs, firstWindow)
      updateWindow()
    }
  })
  next.addEventListener('click', () => {
    if (windowStartTime < lastWindow) {
      windowStartTime = Math.min(windowStartTime + windowMs, lastWindow)
      updateWindow()
    }
  })
  updateWindow()
  return h('div', { class: 'night-chart-wrap' }, controls, chartHost)
}
