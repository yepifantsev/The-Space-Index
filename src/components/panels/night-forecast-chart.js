import { h } from '../../h.js'
import { formatEasternClock, formatEasternNavigation } from './panel-helpers.js'

const SVG_NS = 'http://www.w3.org/2000/svg'

function svgElement(tag, attrs = {}, text) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value))
  if (text != null) element.textContent = text
  return element
}

export function cloudColor(value, isDay) {
  if (!Number.isFinite(value)) return '#343b50'
  if (isDay) {
    const amount = Math.max(0, Math.min(100, value)) / 100
    const clear = [255, 242, 0]
    const overcast = [119, 117, 94]
    const channels = clear.map((channel, index) =>
      Math.round(channel + (overcast[index] - channel) * amount),
    )
    return `rgb(${channels.join(', ')})`
  }
  if (value <= 10) return '#061160'
  if (value <= 30) return '#2a288b'
  if (value <= 50) return '#49418c'
  if (value <= 75) return '#717199'
  return '#9595a7'
}

export function renderNightSkyWindow(validHours, start) {
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
        chart.append(
          svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: top + rows.length * rowHeight, class: 'night-grid night-grid-vertical' }),
          svgElement('text', { x: x(hourStart), y: top + rows.length * rowHeight + 17, class: 'night-time-label', 'text-anchor': 'middle' }, formatEasternClock(hourStart)),
        )
      }
    })
  })

  const currentHourStart = Math.floor(Date.now() / (60 * 60 * 1000)) * 60 * 60 * 1000
  if (validHours.some((hour) => Date.parse(hour.time) === currentHourStart)) {
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
  chart.append(
    svgElement('text', { x: left, y: legendY - 10, class: 'night-legend-title' }, 'Cloud cover'),
    svgElement('text', { x: left, y: legendY + 12, class: 'night-time-label' }, 'Day'),
    svgElement('text', { x: left, y: legendY + 36, class: 'night-time-label' }, 'Night'),
    svgElement('text', { x: 95, y: legendY + 12, class: 'night-time-label', 'text-anchor': 'end' }, '0%'),
    svgElement('rect', { x: 102, y: legendY, width: 247, height: 12, rx: 2, fill: 'url(#day-cloud-scale)' }),
    svgElement('text', { x: 355, y: legendY + 12, class: 'night-time-label' }, '100%'),
    svgElement('text', { x: 95, y: legendY + 36, class: 'night-time-label', 'text-anchor': 'end' }, '0%'),
    svgElement('rect', { x: 102, y: legendY + 24, width: 247, height: 12, rx: 2, fill: 'url(#night-cloud-scale)' }),
    svgElement('text', { x: 355, y: legendY + 36, class: 'night-time-label' }, '100%'),
  )
  return chart
}

export function renderNightSkyChart(hours = []) {
  const validHours = hours
    .filter((hour) => Number.isFinite(Date.parse(hour.time)))
    .sort((first, second) => Date.parse(first.time) - Date.parse(second.time))
  if (validHours.length === 0) return h('p', { class: 'muted' }, 'No hourly forecast available.')

  const windowSize = 24
  const hourMs = 60 * 60 * 1000
  const currentHourIndex = validHours.findIndex((hour) => Date.parse(hour.time) >= Date.now() - hourMs)
  let windowStart = currentHourIndex < 0 ? 0 : currentHourIndex
  const previous = h('button', { class: 'night-chart-nav', type: 'button', title: 'Previous 24 hours', 'aria-label': 'Previous 24 hours' }, '‹')
  const next = h('button', { class: 'night-chart-nav', type: 'button', title: 'Next 24 hours', 'aria-label': 'Next 24 hours' }, '›')
  const range = h('span', { class: 'night-chart-range', 'aria-live': 'polite' })
  const chartHost = h('div', { class: 'night-chart-host' })
  const controls = h('div', { class: 'night-chart-controls' }, previous, range, next)

  function updateWindow() {
    const windowHours = validHours.slice(windowStart, windowStart + windowSize)
    const windowStartTime = Date.parse(windowHours[0].time)
    const windowEndTime = Math.min(windowStartTime + windowSize * hourMs, Date.parse(windowHours.at(-1).time) + hourMs)
    previous.disabled = windowStart === 0
    next.disabled = windowStart + windowSize >= validHours.length
    range.textContent = `${formatEasternNavigation(windowStartTime)} - ${formatEasternNavigation(windowEndTime)}`
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
