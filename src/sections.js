import { h, formatDate } from './h.js'

const SVG_NS = 'http://www.w3.org/2000/svg'
const KP_INTERVAL_MS = 3 * 60 * 60 * 1000
const KP_WINDOW_MS = 24 * KP_INTERVAL_MS

function svgElement(tag, attrs = {}, text) {
  const element = document.createElementNS(SVG_NS, tag)
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, String(value))
  if (text != null) element.textContent = text
  return element
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
  chart.append(svgElement('title', {}, 'Planetary K-index, last 72 hours'))

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

  const tickInterval = 12 * 60 * 60 * 1000
  for (let tick = Math.ceil(start / tickInterval) * tickInterval; tick <= now; tick += tickInterval) {
    const tickX = x(tick)
    const date = new Date(tick)
    const label = `${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}Z`
    chart.append(
      svgElement('line', { x1: tickX, x2: tickX, y1: top, y2: bottom, class: 'kp-grid kp-grid-vertical' }),
      svgElement('text', { x: tickX, y: bottom + 18, class: 'kp-tick', 'text-anchor': 'middle' }, label),
    )
  }

  const validReadings = readings
    .map((reading) => ({ time: Date.parse(reading.time), kp: Number(reading.kp) }))
    .filter((reading) => Number.isFinite(reading.time) && Number.isFinite(reading.kp) && reading.kp >= 0 && reading.kp <= 9)

  for (const reading of validReadings) {
    const slotStart = Math.max(start, reading.time)
    const slotEnd = Math.min(now, reading.time + KP_INTERVAL_MS)
    if (slotEnd <= slotStart) continue

    const barTop = y(reading.kp)
    const barWidth = Math.max(0, (x(slotEnd) - x(slotStart)) * 0.84)
    const colors = reading.kp >= 7 ? '#f06b64' : reading.kp >= 5 ? '#f2a65a' : reading.kp >= 3 ? '#e5c95f' : '#67c9a2'
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
    svgElement('text', { x: (left + right) / 2, y: 402, class: 'kp-axis-label', 'text-anchor': 'middle' }, 'Universal Time (UTC)'),
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
  const height = 244
  const left = 40
  const right = 396
  const top = 0
  const rowHeight = 46
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

      if (rowIndex === 0 && hourIndex % 2 === 0) {
        const date = new Date(hourStart)
        chart.append(
          svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: top + rows.length * rowHeight, class: 'night-grid night-grid-vertical' }),
          svgElement('text', { x: x(hourStart), y: top + rows.length * rowHeight + 17, class: 'night-time-label', 'text-anchor': 'middle' }, `${String(date.getUTCHours()).padStart(2, '0')}Z`),
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

  const legendY = top + rows.length * rowHeight + 53
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

  const formatUtc = (value) => {
    const date = new Date(value)
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    const hour = String(date.getUTCHours()).padStart(2, '0')
    return `${month}/${day} ${hour}Z`
  }

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

// One renderer per data source (keyed by source name). Each receives the `data` field of the JSON file.
export const renderers = {
  'space-weather': (data) => {
    const latest = data.latest
    return h(
      'div',
      {},
      h('span', { class: 'big big-after' }, latest ? `Kp ${latest.kp}` : 'No Kp reading'),
      latest && h('span', { class: 'muted' }, `as of ${formatDate(latest.time)}`),
      renderKpChart(data.kp),
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
          h('span', { class: 'muted' }, [formatDate(l.net), l.status, l.location].filter(Boolean).join(' · ')),
        ),
      ),
    ),

  'night-forecast': (data) =>
    h(
      'div',
      {},
      h('div', { class: 'muted' }, `Sunrise ${formatDate(data.sunrise)} · Sunset ${formatDate(data.sunset)}`),
      (data.moonrise || data.moonset) &&
        h('div', { class: 'muted' }, `Moonrise ${formatDate(data.moonrise)} · Moonset ${formatDate(data.moonset)}`),
      renderNightSkyChart(data.forecastHours ?? data.nightHours),
    ),

  satellites: (data) =>
    h(
      'ul',
      {},
      data.satellites.map((s) =>
        h('li', {}, h('strong', {}, s.name), ` (NORAD ${s.noradId}) — epoch ${formatDate(s.epoch)}`),
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
          h('span', { class: 'muted' }, `${a.site} · ${formatDate(a.publishedAt)}`),
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
  return h(
    'section',
    { class: 'card', id: source.name },
    h('h2', {}, source.title ?? source.name),
    body,
    h(
      'p',
      { class: 'meta' },
      `Updated: ${formatDate(source.updatedAt)}`,
      attribution && [' · Source: ', h('a', { href: attribution.url, target: '_blank', rel: 'noopener noreferrer' }, attribution.label)],
    ),
  )
}
