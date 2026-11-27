import { h, formatTime } from './h.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const KP_INTERVAL_MS = 3 * 60 * 60 * 1000
const KP_WINDOW_MS = 24 * KP_INTERVAL_MS
const EASTERN_TIME_ZONE = 'America/New_York'

function formatEasternClock(value) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)).replace(':00', '')
}

function formatEasternNavigation(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const month = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, day: 'numeric' }).format(date)
  return `${month} ${day}, ${formatEasternClock(date)}`
}

function formatLocationNavigation(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  const month = new Intl.DateTimeFormat('en-US', { timeZone: __SITE_TIME_ZONE__, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: __SITE_TIME_ZONE__, day: 'numeric' }).format(date)
  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: __SITE_TIME_ZONE__,
    hour: 'numeric',
    minute: '2-digit',
  }).format(date).replace(':00', '')
  return `${month} ${day}, ${time}`
}

function formatEasternDate(value) {
  const date = new Date(value)
  const month = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, month: 'short' }).format(date)
  const day = new Intl.DateTimeFormat('en-US', { timeZone: EASTERN_TIME_ZONE, day: 'numeric' }).format(date)
  return `${month} ${day}`
}

function formatLaunchStatus(status) {
  const labels = {
    Go: 'Go for launch',
    Success: 'Succeeded',
    TBC: 'To be confirmed',
    TBD: 'To be determined',
    Hold: 'On hold',
    Failure: 'Failed',
    'In Flight': 'In flight',
  }
  return labels[status] ?? status
}

function launchStatusStyle(status) {
  const colors = {
    Go: '#67c9a2',
    Success: '#67c9a2',
    Hold: '#e5c95f',
    Failure: '#d66b63',
    'In Flight': '#e5c95f',
  }
  return colors[status] ? `color: ${colors[status]}` : undefined
}

function formatCneosDate(value) {
  const match = /^(\d{4})-([A-Z][a-z]{2})-(\d{2}) (\d{2}:\d{2})$/.exec(value)
  if (!match) return String(value)
  const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(match[2])
  if (monthIndex < 0) return String(value)
  const date = new Date(Date.UTC(Number(match[1]), monthIndex, Number(match[3]), Number(match[4].slice(0, 2)), Number(match[4].slice(3, 5))))
  return new Intl.DateTimeFormat('en-US', {
    timeZone: EASTERN_TIME_ZONE,
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}

function svgElement(tag, attrs = {}, text) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value))
  if (text != null) element.textContent = text
  return element
}

function kpColor(kp) {
  if (!Number.isFinite(kp)) return '#67c9a2'
  if (kp >= 7) return '#f06b64'
  if (kp >= 5) return '#f2a65a'
  if (kp >= 3) return '#e5c95f'
  return '#67c9a2'
}

function renderKpChart(readings = []) {
  const now = Date.now()
  const start = now - KP_WINDOW_MS
  const width = 760
  const height = 416
  const left = 46
  const right = 748
  const top = 20
  const bottom = 352
  const plotWidth = right - left
  const plotHeight = bottom - top
  const x = (time) => left + ((time - start) / KP_WINDOW_MS) * plotWidth
  const y = (kp) => bottom - (kp / 9) * plotHeight
  const chart = svgElement('svg', {
    class: 'kp-chart',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Planetary K-index readings over the last 72 hours. The vertical line marks now; times are UTC.',
  })

  for (let kp = 0; kp <= 9; kp += 1) {
    const levelY = y(kp)
    chart.append(
      svgElement('line', {
        x1: left,
        x2: right,
        y1: levelY,
        y2: levelY,
        class: kp === 0 ? 'kp-axis' : 'kp-grid',
      }),
      svgElement('text', { x: left - 10, y: levelY + 4, class: 'kp-tick', 'text-anchor': 'end' }, kp),
    )
  }

  const validReadings = readings
    .map((reading) => ({ time: Date.parse(reading.time), kp: Number(reading.kp) }))
    .filter((reading) => Number.isFinite(reading.time) && Number.isFinite(reading.kp) && reading.kp >= 0 && reading.kp <= 9)
    .sort((first, second) => first.time - second.time)

  for (let i = 0; i < validReadings.length; i += 8) {
    const reading = validReadings[i]
    const tickX = x(reading.time)
    chart.append(
      svgElement('line', { x1: tickX, x2: tickX, y1: top, y2: bottom, class: 'kp-grid kp-grid-vertical' }),
      svgElement('text', { x: tickX, y: bottom + 23, class: 'kp-tick', 'text-anchor': 'middle' }, formatEasternDate(reading.time)),
    )
  }

  for (const reading of validReadings) {
    const slotStart = Math.max(start, reading.time)
    const slotEnd = Math.min(now, reading.time + KP_INTERVAL_MS)
    if (slotEnd <= slotStart) continue

    const barTop = y(reading.kp)
    const barWidth = Math.max(0, (x(slotEnd) - x(slotStart)) * 0.84)
    const colors = kpColor(reading.kp)
    chart.append(
      svgElement('rect', {
        x: x(slotStart),
        y: barTop,
        width: barWidth,
        height: Math.max(1, bottom - barTop),
        rx: 1,
        fill: colors,
        class: 'kp-bar',
      }),
    )
  }

  chart.append(
    svgElement('line', { x1: right, x2: right, y1: top, y2: bottom, class: 'kp-now' }),
    svgElement('text', { x: right - 4, y: top + 11, class: 'kp-now-label', 'text-anchor': 'end' }, 'NOW'),
    svgElement('text', { x: 15, y: top + plotHeight / 2, class: 'kp-axis-label', 'text-anchor': 'middle', transform: `rotate(-90 15 ${top + plotHeight / 2})` }, 'Kp'),
    svgElement('text', { x: (left + right) / 2, y: 402, class: 'kp-axis-label', 'text-anchor': 'middle' }, 'Eastern Time'),
  )

  return chart
}

function cloudColor(value, isDay) {
  if (!Number.isFinite(value)) return '#343b50'
  if (isDay) {
    const amount = Math.max(0, Math.min(100, value)) / 100
    const clear = [255, 242, 0]
    const overcast = [119, 117, 94]
    const channels = clear.map((channel, index) => Math.round(channel + (overcast[index] - channel) * amount))
    return `rgb(${channels.join(', ')})`
  }
  if (value <= 10) return '#061160'
  if (value <= 30) return '#2a288b'
  if (value <= 50) return '#49418c'
  if (value <= 75) return '#717199'
  return '#9595a7'
}

function renderNightSkyWindow(validHours, start) {
  const rows = [
    { label: 'High', key: 'cloudCoverHigh' },
    { label: 'Mid', key: 'cloudCoverMid' },
    { label: 'Low', key: 'cloudCoverLow' },
  ]
  const width = 400
  const height = 275
  const left = 40
  const right = 396
  const top = 0
  const rowHeight = 56
  const end = start + 24 * 60 * 60 * 1000
  const x = (time) => left + ((time - start) / (end - start)) * (right - left)
  const chart = svgElement('svg', {
    class: 'night-chart',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `Hourly cloud cover forecast for ${validHours.length} hours. Daylight uses yellow shades and nighttime uses blue shades. Rows show high, middle, and low clouds. Times are UTC.`,
  })
  chart.append(svgElement('title', {}, '24-hour cloud-cover heatmap'))

  rows.forEach((row, rowIndex) => {
    const rowY = top + rowIndex * rowHeight
    chart.append(
      svgElement('text', { x: left - 10, y: rowY + 22, class: 'night-row-label', 'text-anchor': 'end' }, row.label),
      svgElement('line', { x1: left, x2: right, y1: rowY + rowHeight, y2: rowY + rowHeight, class: 'night-grid' }),
    )

    validHours.forEach((hour, hourIndex) => {
      const hourStart = Date.parse(hour.time)
      const hourEnd = Math.min(hourStart + 60 * 60 * 1000, end)
      const rawValue = hour[row.key]
      const value = rawValue == null ? NaN : Number(rawValue)
      const cell = svgElement('rect', {
        x: x(hourStart) + 1,
        y: rowY + 3,
        width: Math.max(1, x(hourEnd) - x(hourStart) - 2),
        height: rowHeight - 6,
        rx: 2,
        fill: cloudColor(value, hour.isDay),
        class: 'night-cell',
      })
      const label = Number.isFinite(value) ? `${value}%` : 'No data'
      cell.append(svgElement('title', {}, `${hour.time} UTC, ${row.label.toLowerCase()}: ${label}`))
      chart.append(cell)

      if (rowIndex === 0 && hourIndex % 4 === 0) {
        const date = new Date(hourStart)
        chart.append(
          svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: top + rows.length * rowHeight, class: 'night-grid night-grid-vertical' }),
          svgElement('text', { x: x(hourStart), y: top + rows.length * rowHeight + 17, class: 'night-time-label', 'text-anchor': 'middle' }, formatEasternClock(hourStart)),
        )
      }
    })
  })

  const currentHourStart = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000
  const currentHourIndex = validHours.findIndex((hour) => Date.parse(hour.time) === currentHourStart)
  if (currentHourIndex >= 0) {
    const cellX = x(currentHourStart) + 1
    const cellWidth = Math.max(1, x(currentHourStart + 60 * 60 * 1000) - x(currentHourStart) - 2)
    rows.forEach((row, rowIndex) => {
      chart.append(svgElement('rect', {
        x: cellX,
        y: rowIndex * rowHeight + 3,
        width: cellWidth,
        height: rowHeight - 6,
        rx: 2,
        class: 'night-current-hour',
      }))
    })
  }

  const defs = svgElement('defs')
  const dayGradient = svgElement('linearGradient', { id: 'day-cloud-scale', x1: '0%', x2: '100%', y1: '0%', y2: '0%' })
  dayGradient.append(
    svgElement('stop', { offset: '0%', 'stop-color': cloudColor(0, true) }),
    svgElement('stop', { offset: '100%', 'stop-color': cloudColor(100, true) }),
  )
  const nightGradient = svgElement('linearGradient', { id: 'night-cloud-scale', x1: '0%', x2: '100%', y1: '0%', y2: '0%' })
  ;[0, 10, 30, 50, 75, 100].forEach((value) => {
    nightGradient.append(svgElement('stop', { offset: `${value}%`, 'stop-color': cloudColor(value, false) }))
  })
  defs.append(dayGradient, nightGradient)
  chart.append(defs)

  const legendY = top + rows.length * rowHeight + 60
  const rampX = 102
  const rampWidth = 247
  chart.append(
    svgElement('text', { x: left, y: legendY - 10, class: 'night-legend-title' }, 'Cloud cover'),
    svgElement('text', { x: left, y: legendY + 12, class: 'night-time-label' }, 'Day'),
    svgElement('text', { x: left, y: legendY + 36, class: 'night-time-label' }, 'Night'),
    svgElement('text', { x: 95, y: legendY + 12, class: 'night-time-label', 'text-anchor': 'end' }, '0%'),
    svgElement('rect', { x: rampX, y: legendY, width: rampWidth, height: 12, rx: 2, fill: 'url(#day-cloud-scale)' }),
    svgElement('text', { x: 355, y: legendY + 12, class: 'night-time-label' }, '100%'),
    svgElement('text', { x: 95, y: legendY + 36, class: 'night-time-label', 'text-anchor': 'end' }, '0%'),
    svgElement('rect', { x: rampX, y: legendY + 24, width: rampWidth, height: 12, rx: 2, fill: 'url(#night-cloud-scale)' }),
    svgElement('text', { x: 355, y: legendY + 36, class: 'night-time-label' }, '100%'),
  )

  return chart
}

function renderNightSkyChart(hours = []) {
  const validHours = hours
    .filter((hour) => Number.isFinite(Date.parse(hour.time)))
    .sort((first, second) => Date.parse(first.time) - Date.parse(second.time))
  if (validHours.length === 0) return h('p', { class: 'muted' }, 'No hourly forecast available.')

  const windowSize = 24
  const hourMs = 60 * 60 * 1000
  const currentHourIndex = validHours.findIndex((hour) => Date.parse(hour.time) >= Date.now() - hourMs)
  let windowStart = currentHourIndex < 0 ? 0 : currentHourIndex
  const previous = h('button', {
    class: 'night-chart-nav',
    type: 'button',
    title: 'Previous 24 hours',
    'aria-label': 'Previous 24 hours',
  }, '‹')
  const next = h('button', {
    class: 'night-chart-nav',
    type: 'button',
    title: 'Next 24 hours',
    'aria-label': 'Next 24 hours',
  }, '›')
  const range = h('span', { class: 'night-chart-range', 'aria-live': 'polite' })
  const chartHost = h('div', { class: 'night-chart-host' })
  const controls = h('div', { class: 'night-chart-controls' }, previous, range, next)

  const formatUtc = formatEasternNavigation

  function updateWindow() {
    const windowHours = validHours.slice(windowStart, windowStart + windowSize)
    const windowStartTime = Date.parse(windowHours[0].time)
    const windowEndTime = Math.min(windowStartTime + windowSize * hourMs, Date.parse(windowHours.at(-1).time) + hourMs)
    previous.disabled = windowStart === 0
    next.disabled = windowStart + windowSize >= validHours.length
    range.textContent = `${formatUtc(windowStartTime)} - ${formatUtc(windowEndTime)}`
    chartHost.replaceChildren(renderNightSkyWindow(windowHours, windowStartTime))
  }

  previous.addEventListener('click', () => {
    windowStart = Math.max(0, windowStart - windowSize)
    updateWindow()
  })
  next.addEventListener('click', () => {
    if (windowStart + windowSize >= validHours.length) return
    windowStart += windowSize
    updateWindow()
  })
  updateWindow()

  return h('div', { class: 'night-chart-wrap' }, controls, chartHost)
}

function transparencyNumeric(rating) {
  const values = [0.2, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.1]
  return values[Math.max(1, Math.min(8, Number(rating))) - 1]
}

function transparencyColorForValue(value) {
  if (!Number.isFinite(value)) return '#343b50'
  const navy = [6, 22, 70]
  const gray = [170, 170, 170]
  const amount = Math.max(0, Math.min(1, value))
  return `rgb(${navy.map((channel, i) => Math.round(channel + (gray[i] - channel) * amount)).join(', ')})`
}

function dewSpreadColor(fahrenheit) {
  if (!Number.isFinite(fahrenheit)) return '#343b50'
  if (fahrenheit > 12) return '#061160'
  if (fahrenheit >= 8) return '#4369a5'
  if (fahrenheit >= 5) return '#78a9c8'
  if (fahrenheit >= 2) return '#e6a04a'
  return '#d66b63'
}

function windSpeedColor(mph) {
  if (!Number.isFinite(mph)) return '#343b50'
  if (mph <= 5) return '#061160'
  if (mph <= 8) return '#4369a5'
  if (mph <= 11) return '#78a9c8'
  if (mph <= 14) return '#e6a04a'
  return '#d66b63'
}

function renderStandaloneMetricWindow(hours, start, metric) {
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

  const currentHourStart = Math.floor(Date.now() / (60 * 60 * 1000)) * (60 * 60 * 1000)
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
      width: Math.max(1, ((60 * 60 * 1000) / (24 * 60 * 60 * 1000)) * (right - left) - 2),
      height: bottom - currentBarY,
      rx: 2,
      class: 'night-current-hour',
    }))
  }

  for (let i = 0; i < hours.length; i += 4) {
    const hourStart = Date.parse(hours[i].time)
    const date = new Date(hourStart)
    chart.append(
      svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: bottom, class: 'night-grid night-grid-vertical' }),
      svgElement('text', { x: x(hourStart), y: bottom + 18, class: 'night-time-label', 'text-anchor': 'middle' }, formatEasternClock(hourStart)),
    )
  }

  const defs = svgElement('defs')
  const gradient = svgElement('linearGradient', { id: `${metric.type}-metric-gradient`, x1: '0%', x2: '100%' })
  metric.gradient.forEach((stop) => gradient.append(svgElement('stop', { offset: stop.offset, 'stop-color': stop.color })))
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

function renderStandaloneMetric(hours = [], metric) {
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
  const formatUtc = formatEasternNavigation

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
    range.textContent = `${formatUtc(windowStartTime)} - ${formatUtc(windowEndTime)}`
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

function azimuthToCompass(azimuth) {
  const directions = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
  ];
  // Normalize negative angles just in case, add 11.25° offset, and divide by 22.5°
  const index = Math.floor((((azimuth % 360) + 360) % 360 + 11.25) / 22.5) % 16;
  return directions[index];
}


/*********************** */
/* ACTUAL SECTIONS BEGIN */
/*********************** */


// One renderer per data source (keyed by source name). Each receives the `data` field of the JSON file.
export const renderers = {
  'space-weather': (data) => {
    const latest = data.latest
    return h(
      'div',
      {},
      h('span', { class: 'big big-after', style: latest ? `color: ${kpColor(latest.kp)}` : undefined }, latest ? `Kp ${latest.kp}` : 'No Kp reading'),
      latest && h('span', { class: 'night-chart-range kp-as-of' }, `as of ${formatEasternNavigation(latest.time)}`),
      renderKpChart(data.kp),
      h('div', { class: 'meta' }, 'Planetary K-index readings over the last 72 hours.'),
      h('div', { class: 'meta' }, 'The vertical line marks now; times are UTC.'),
    )
  },

  launches: (data) =>
    h(
      'ul',
      {},
      data.launches.map((l) =>
        h(
          'li',
          {},
          h('strong', {}, l.name),
          h('br'),
          h('span', { class: 'muted' }, formatLocationNavigation(l.net)),
          l.status &&
            h(
              'span',
              {
                style: launchStatusStyle(l.status),
                class: l.status === 'Success' ? 'launch-status launch-status-bold' : 'launch-status',
              },
              ` · ${formatLaunchStatus(l.status)}`,
            ),
          l.location &&
            h('span', { class: 'muted launch-location' }, h('br'), l.location),
        ),
      ),
    ),

  'night-forecast': (data) =>
    h(
      'div',
      {},
      renderNightSkyChart(data.forecastHours ?? data.nightHours),
    ),

  'atmosphere-transparency': (data) =>
    renderStandaloneMetric(data.forecast ?? [], {
      type: 'transparency',
      title: 'Atmosphere Transparency',
      yLabel: 'Extinction (mag / air mass)',
      min: 0.2,
      max: 1.2,
      ticks: [
        { value: 0.2, label: '0.2' }, 
        { value: 0.4, label: '0.4' }, 
        { value: 0.6, label: '0.6' }, 
        { value: 0.8, label: '0.8' }, 
        { value: 1, label: '1.0' }, 
        { value: 1.2, label: '1.2+' }
      ],
      legendTitle: 'Transparency',
      legendLeft: 'Exceptional (< 0.3)',
      legendRight: 'Very poor (> 1.0)',
      gradient: [
        { offset: '0%', color: '#061160' },
        { offset: '100%', color: '#aaaaaa' },
      ],
    }),

  'dew-point-spread': (data) =>
    renderStandaloneMetric(data.forecast ?? [], {
      type: 'dew',
      title: 'Dew Point Spread',
      yLabel: 'Dew Point Spread',
      max: 18,
      ticks: [{ value: 0, label: '≤ 1°F' }, { value: 5, label: '5°F' }, { value: 11, label: '11°F' }, { value: 18, label: '> 18°F' }],
      legendTitle: 'Dew point spread',
      legendLeft: 'Very Dry (> 18°F)',
      legendRight: 'Fog / Condensation (≤ 1°F)',
      gradient: [
        { offset: '0%', color: '#061160' },
        { offset: '25%', color: '#4369a5' },
        { offset: '50%', color: '#78a9c8' },
        { offset: '75%', color: '#e6a04a' },
        { offset: '100%', color: '#d66b63' },
      ],
    }),

  'wind': (data) =>
    renderStandaloneMetric(data.forecast ?? [], {
      type: 'wind',
      title: 'Wind',
      yLabel: 'Wind Speed (mph)',
      max: 20,
      ticks: [{ value: 0, label: '0' }, { value: 5, label: '5' }, { value: 10, label: '10' }, { value: 15, label: '15' }, { value: 20, label: '20+' }],
      legendTitle: 'Wind',
      legendLeft: 'Calm (≤ 5 mph)',
      legendRight: 'Strong (≥ 18 mph)',
      gradient: [
        { offset: '0%', color: '#061160' },
        { offset: '25%', color: '#4369a5' },
        { offset: '50%', color: '#78a9c8' },
        { offset: '75%', color: '#e6a04a' },
        { offset: '100%', color: '#d66b63' },
      ],
    }),

  'moon-timeline': (data) => {
    const moon = data.moon ?? {}
    return h(
      'div',
      {},
      h(
        'div',
        { class: 'moon-summary mt-1' },
        h('span', { class: 'moon-glyph', role: 'img', 'aria-label': moon.name }, moon.glyph ?? '◐'),
        h('div', {},
          h('strong', { class: 'moon-name' }, moon.name ?? 'Moon phase'),
          h('div', { class: 'muted moon-illumination' }, `${moon.illumination ?? '—'}% illuminated`),
        ),
      ),
      h('div', { class: 'meta mt-1' }, `Altitude `, h('strong', { class: 'moon-altitude' }, `${Number.isFinite(moon.altitude) ? `${moon.altitude.toFixed(1)}°` : '—'}`)),
      h('div', { class: 'meta' }, `Azimuth `, h('strong', { class: 'moon-azimuth' }, `${Number.isFinite(moon.azimuth) ? `${moon.azimuth.toFixed(1)}° (${azimuthToCompass(moon.azimuth)})` : '—'}`)),
      h('div', { class: 'meta mt-1' }, `Moonrise `, h('strong', {}, `${formatTime(data.moonrise)}`)),
      h('div', { class: 'meta' }, `Moonset `, h('strong', {}, `${formatTime(data.moonset)}`)),
      h('div', { class: 'meta mt-1' }, `Last phase `, h('strong', {}, `${moon.previousPhase?.name ?? '—'} · ${moon.previousPhase?.time ? formatEasternNavigation(moon.previousPhase.time) : '—'}`)),
      h('div', { class: 'meta' }, `Next phase `, h('strong', {}, `${moon.nextPhase?.name ?? '—'} · ${moon.nextPhase?.time ? formatEasternNavigation(moon.nextPhase.time) : '—'}`)),
      h('div', { class: 'meta mt-1' }, `Apparent magnitude `, h('strong', {}, `${Number.isFinite(moon.apparentMag) ? moon.apparentMag.toFixed(2) : '—'}`)),
      h('div', { class: 'meta' }, `Background sky glow `, h('strong', {}, `${Number.isFinite(moon.zenithSkySqm) ? `${moon.zenithSkySqm.toFixed(2)} mag/arcsec²` : '—'}`)),
    )
  },

  'visible-planets': (data) =>
    h(
      'div',
      { class: 'dense-card-content' },
      h(
        'table',
        { class: 'planet-table' },
        h('thead', {},
          h('tr', {},
            h('th', { scope: 'col' }, ' '),
            h('th', { scope: 'col' }, 'Rise / Set'),
            h('th', { scope: 'col' }, [h('em', {}, 'm'), ' / Max']),
            h('th', { scope: 'col' }, 'Where'),
          ),
        ),
        h('tbody', {},
          (data.planets ?? []).map((planet) =>
            h('tr', { class: planet.aboveHorizon ? undefined : 'planet-row-muted' },
              h('td', {}, h('span', { class: 'planet-icon', role: 'img', 'aria-label': planet.name }, planet.icon)),
              h('td', {}, `${formatTime(planet.rise)} / ${formatTime(planet.set)}`),
              h(
                'td',
                {},
                planet.apparentMagnitude == null
                  ? h('strong', {}, '—')
                  : h('strong', {}, Number.isFinite(planet.apparentMagnitude) ? planet.apparentMagnitude.toFixed(1) : '—'),
                ' / ',
                planet.maximumElevationTime ? formatTime(planet.maximumElevationTime) : '—',
              ),
              h('td', {}, planet.constellation ?? '—'),
            ),
          ),
        ),
      ),
    ),

  'celestial-events': (data) =>
    h(
      'div',
      { class: 'dense-card-content' },
      h('div', { class: 'muted' }, data.verdict ?? 'Active meteor shower forecast'),
      h(
        'ul',
        { class: 'compact-list custom-bullet-list' },
        (data.showers ?? []).map((shower) =>
          h('li', { class: 'custom-bullet meteor-bullet' },
            h('span', { class: 'bullet-glyph', 'aria-hidden': 'true' }, '✨'),
            h('div', { class: 'meteor-row-content' },
              h('strong', {}, shower.name),
              h('div', { class: 'muted' }, [
                'Peak ZHR: ',
                h('strong', {}, h('em', {}, Number.isFinite(shower.zhr) ? String(Math.round(shower.zhr)) : '—')),
                shower.peakUtc ? ` (${formatEasternNavigation(shower.peakUtc)})` : '',
              ]),
              h('div', { class: 'zhr-meter' },
                h('span', { style: `width: ${Math.max(2, Math.min(100, Number(shower.zhr) / 1.5))}%` }),
              ),
            ),
          ),
        ),
      ),
      h('strong', {}, 'Bright comets'),
      (data.comets ?? []).length
        ? h(
            'ul',
            { class: 'compact-list custom-bullet-list' },
            data.comets.map((comet) =>
              h('li', { class: 'custom-bullet comet-bullet' },
                h('span', { class: 'bullet-glyph comet-glyph', 'aria-hidden': 'true' }, '☄︎'),
                h('strong', {}, comet.name),
                ` — magnitude ${Number.isFinite(comet.magnitude) ? comet.magnitude.toFixed(1) : '—'}`,
              ),
            ),
          )
        : h('p', { class: 'muted' }, 'No binocular-visible comets currently reported.'),
    ),

  'neo-close-approaches': (data) =>
    h(
      'div',
      { class: 'dense-card-content' },
      h(
        'ul',
        { class: 'compact-list custom-bullet-list' },
        (data.approaches ?? []).map((object) =>
          h('li', {
            class: object.missDistanceLd < 1
              ? 'neo-approach neo-approach-critical'
              : object.missDistanceLd < 5
                ? 'neo-approach neo-approach-close'
                : 'neo-approach',
            style: `--rock-rotation: ${(typeof object.name === 'string' && object.name.length >= 2
              ? ((object.name.charCodeAt(object.name.length - 2) * 7) + (object.name.charCodeAt(object.name.length - 1) * 11)) % 360
              : 0)}deg`,
          },
            h('span', { class: 'bullet-glyph asteroid-glyph', 'aria-hidden': 'true' }, '🪨'),
            h('strong', {},
              h('a', {
                href: object.sbdbUrl,
                target: '_blank',
                rel: 'noopener noreferrer',
              }, object.name),
              h('span', { class: 'muted' }, ` · ${formatCneosDate(object.date)}`),
            ),
            h('div', { class: 'neo-details muted' },
              h('span', {}, object.estimatedDiameterKm == null
                ? '—'
                : Number.isFinite(object.estimatedDiameterKm)
                  ? `${Math.round(object.estimatedDiameterKm * 1000).toLocaleString()} m Ø`
                  : '—'),
              h('span', {}, Number.isFinite(object.relativeVelocityKph)
                ? `${(object.relativeVelocityKph / 3600).toFixed(1)} km/s`
                : '—'),
              h('span', {}, Number.isFinite(object.missDistanceLd)
                ? `${object.missDistanceLd.toFixed(1)} LD`
                : '—'),
            ),
          ),
        ),
      ),
      (data.approaches ?? []).length === 0 &&
        h('p', { class: 'muted' }, 'No close approaches reported for the next 30 days.'),
    ),

  satellites: (data) =>
    h(
      'ul',
      { class: 'satellite-list' },
      [...(data.satellites ?? [])]
        .sort((a, b) => {
          const aTime = a.nextPass ? Date.parse(a.nextPass.time) : Number.POSITIVE_INFINITY
          const bTime = b.nextPass ? Date.parse(b.nextPass.time) : Number.POSITIVE_INFINITY
          if (Number.isNaN(aTime)) return 1
          if (Number.isNaN(bTime)) return -1
          return aTime - bTime
        })
        .map((s) =>
        h(
          'li',
          { class: `satellite-item${s.nextPass.maxAltitude < 30 ? ' satellite-row-muted' : ''}` },
          h('strong', {}, `${typeof s.name === 'string' ? s.name : 'Unknown'}${typeof s.name === 'string' && /^((CSS|ISS)(?:\s|$))/i.test(s.name) ? ' ⭐ ' : ''}`),
          s.nextPass &&
            h('span', { class: 'satellite-details' }, `Next pass: ${formatLocationNavigation(s.nextPass.time)} · ${Number.isFinite(s.nextPass.maxAltitude) ? s.nextPass.maxAltitude.toFixed(0) : '—'}° · ${typeof s.nextPass.direction === 'string' ? s.nextPass.direction : '—'}`),
        ),
        ),
    ),

  news: (data) =>
    h(
      'ul',
      {},
      data.articles.map((a) =>
        h(
          'li',
          {},
          h('a', { href: a.url, target: '_blank', rel: 'noopener noreferrer' }, a.title),
          h('br'),
          h('span', { class: 'muted' }, `${a.site} · ${formatTime(a.publishedAt)}`),
        ),
      ),
    ),
}

export function renderSection(source) {
  const render = renderers[source.name]
  let body
  if (source.data == null) {
    body = h('p', { class: 'muted' }, 'Data not available yet.')
  } else if (!render) {
    body = h('pre', {}, JSON.stringify(source.data, null, 2))
  } else {
    try {
      body = render(source.data)
    } catch (err) {
      console.error(`Failed to render ${source.name}`, err)
      body = h('p', { class: 'muted' }, 'Could not display this data.')
    }
  }

  const attribution = source.attribution
  const sourceLinks = []
  if (Array.isArray(attribution)) {
    attribution.forEach((item, index) => {
      if (index > 0) sourceLinks.push(' · ')
      sourceLinks.push(h('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer' }, item.label))
    })
  } else if (attribution) {
    sourceLinks.push(h('a', { href: attribution.url, target: '_blank', rel: 'noopener noreferrer' }, attribution.label))
  }
  return h(
    'section',
    { class: 'card', id: source.name },
    h('h2', {}, source.title ?? source.name),
    h('div', { class: 'card-body' }, body),
    h(
      'p',
      { class: 'meta' },
      `Updated: ${formatLocationNavigation(source.updatedAt)}`,
      sourceLinks && [' · Source: ', ...sourceLinks],
    ),
  )
}
