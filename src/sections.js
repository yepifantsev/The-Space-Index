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
  const height = 316
  const left = 46
  const right = 748
  const top = 20
  const bottom = 252
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
    svgElement('text', { x: (left + right) / 2, y: 302, class: 'kp-axis-label', 'text-anchor': 'middle' }, 'Universal Time (UTC)'),
  )

  return chart
}

function cloudColor(value) {
  if (!Number.isFinite(value)) return '#343b50'
  if (value <= 10) return '#087a62'
  if (value <= 30) return '#32836d'
  if (value <= 50) return '#829887'
  if (value <= 75) return '#b5b9b7'
  return '#e5e8e7'
}

function renderNightSkyChart(hours = []) {
  const rows = [
    { label: 'Total cloud', key: 'cloudCover' },
    { label: 'High cloud', key: 'cloudCoverHigh' },
    { label: 'Mid cloud', key: 'cloudCoverMid' },
    { label: 'Low cloud', key: 'cloudCoverLow' },
  ]
  const validHours = hours.filter((hour) => Number.isFinite(Date.parse(hour.time)))
  if (validHours.length === 0) return h('p', { class: 'muted' }, 'No nighttime forecast available.')

  const width = 400
  const height = 254
  const left = 80
  const right = 396
  const top = 30
  const rowHeight = 36
  const plotWidth = right - left
  const start = Date.parse(validHours[0].time)
  const end = Date.parse(validHours.at(-1).time) + 60 * 60 * 1000
  const x = (time) => left + ((time - start) / (end - start)) * plotWidth
  const chart = svgElement('svg', {
    class: 'night-chart',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': `Hourly cloud cover forecast for ${validHours.length} hours of night. Rows show total, high, middle, and low clouds. Times are UTC.`,
  })
  chart.append(svgElement('title', {}, 'Night sky cloud-cover heatmap'))

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
        fill: cloudColor(value),
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

  const legendY = top + rows.length * rowHeight + 43
  chart.append(svgElement('text', { x: left, y: legendY + 10, class: 'night-legend-title' }, 'Cloud cover'))
  const legend = [
    { label: '0%', value: 0 },
    { label: '25%', value: 25 },
    { label: '50%', value: 50 },
    { label: '75%', value: 75 },
    { label: '100%', value: 100 },
  ]
  legend.forEach((entry, index) => {
    const legendX = left + 90 + index * 44
    chart.append(
      svgElement('rect', { x: legendX, y: legendY, width: 14, height: 12, rx: 2, fill: cloudColor(entry.value) }),
      svgElement('text', { x: legendX + 19, y: legendY + 10, class: 'night-time-label' }, entry.label),
    )
  })

  return h('div', { class: 'night-chart-wrap' }, chart)
}

// One renderer per data source (keyed by source name). Each receives the `data` field of the JSON file.
export const renderers = {
  'space-weather': (data) => {
    const latest = data.latest
    return h(
      'div',
      {},
      h('p', { class: 'big' }, latest ? `Kp ${latest.kp}` : 'No Kp reading'),
      latest && h('p', { class: 'muted' }, `as of ${formatDate(latest.time)}`),
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
      h('p', { class: 'muted' }, `${data.location.name} · sunset ${formatDate(data.sunset)}`),
      renderNightSkyChart(data.nightHours),
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
