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

function transparencyDetails(rating) {
  const value = Number(rating)
  if (value === 1) return { extinction: '< 0.30', description: 'Exceptional (crystal clear, dry air)' }
  if (value === 2) return { extinction: '0.30 – 0.40', description: 'Very good' }
  if (value === 3) return { extinction: '0.40 – 0.50', description: 'Good' }
  if (value === 4) return { extinction: '0.50 – 0.60', description: 'Above average' }
  if (value === 5) return { extinction: '0.60 – 0.70', description: 'Average' }
  if (value === 6) return { extinction: '0.70 – 0.85', description: 'Below average (noticeable haze)' }
  if (value === 7) return { extinction: '0.85 – 1.00', description: 'Poor (heavy moisture/haze)' }
  if (value === 8) return { extinction: '> 1.00', description: 'Very poor (murky/opaque air)' }
  return { extinction: 'Unknown', description: 'No transparency forecast' }
}

function transparencyColor(rating) {
  if (!Number.isFinite(rating)) return '#343b50'
  const clamped = Math.max(1, Math.min(8, rating))
  const navy = [6, 22, 70]
  const gray = [170, 170, 170]
  const amount = (clamped - 1) / 7
  const channels = navy.map((channel, i) => Math.round(channel + (gray[i] - channel) * amount))
  return `rgb(${channels.join(', ')})`
}

function dewDetails(spread) {
  if (!Number.isFinite(spread)) return { text: 'No data', color: '#343b50', fahrenheit: null }
  if (spread > 10) return { text: 'Bone dry', color: '#061160', fahrenheit: spread * 9 / 5 }
  if (spread >= 6) return { text: 'Safe', color: '#4369a5', fahrenheit: spread * 9 / 5 }
  if (spread >= 3) return { text: 'Dew warning', color: '#78a9c8', fahrenheit: spread * 9 / 5 }
  if (spread >= 1) return { text: 'Heavy dew & mist', color: '#e6a04a', fahrenheit: spread * 9 / 5 }
  return { text: 'Saturation / Fog', color: '#d66b63', fahrenheit: spread * 9 / 5 }
}

function windColor(speed) {
  if (!Number.isFinite(speed)) return '#343b50'
  if (speed <= 5) return '#061160'
  if (speed <= 11) return '#4369a5'
  if (speed <= 17) return '#78a9c8'
  return '#d66b63'
}

function renderObservingConditionsWindow(hours, start) {
  const rows = [
    { label: 'Transparency', key: 'transparency' },
    { label: 'Dew spread', key: 'dewSpread' },
    { label: 'Wind', key: 'windSpeed' },
  ]
  const width = 400
  const height = 244
  const left = 70
  const right = 396
  const top = 0
  const rowHeight = 46
  const end = start + 24 * 60 * 60 * 1000
  const x = (time) => left + ((time - start) / (end - start)) * (right - left)
  const chart = svgElement('svg', {
    class: 'night-chart',
    viewBox: `0 0 ${width} ${height}`,
    role: 'img',
    'aria-label': 'Hourly transparency, dew point spread, and wind forecast.',
  })
  chart.append(svgElement('title', {}, '24-hour transparency, dew, and wind heatmap'))

  rows.forEach((row, rowIndex) => {
    const rowY = top + rowIndex * rowHeight
    chart.append(
      svgElement('text', { x: left - 10, y: rowY + 22, class: 'night-row-label', 'text-anchor': 'end' }, row.label),
      svgElement('line', { x1: left, x2: right, y1: rowY + rowHeight, y2: rowY + rowHeight, class: 'night-grid' }),
    )

    hours.forEach((hour) => {
      const hourStart = Date.parse(hour.time)
      const hourEnd = Math.min(hourStart + 60 * 60 * 1000, end)
      let fill = '#343b50'
      let tooltip

      if (row.key === 'transparency') {
        const rating = Number(hour.transparency)
        fill = transparencyColor(rating)
        const details = transparencyDetails(rating)
        tooltip = Number.isFinite(rating)
          ? `Transparency rating ${rating}/8 · Extinction ${details.extinction} mag/air mass · ${details.description}`
          : 'Transparency: No data'
      } else if (row.key === 'dewSpread') {
        const spread = Number(hour.dewSpread)
        const details = dewDetails(spread)
        fill = details.color
        tooltip = Number.isFinite(spread)
          ? `Dew point spread ${spread.toFixed(1)}°C / ${(spread * 9 / 5).toFixed(1)}°F · ${details.text}`
          : 'Dew point spread: No data'
      } else {
        const speed = Number(hour.windSpeed)
        fill = windColor(speed)
        tooltip = Number.isFinite(speed)
          ? `Wind ${speed.toFixed(1)} mph${Number.isFinite(hour.windGust) ? ` · Gust ${Number(hour.windGust).toFixed(1)} mph` : ''}`
          : 'Wind: No data'
      }

      const cell = svgElement('rect', {
        x: x(hourStart) + 1,
        y: rowY + 3,
        width: Math.max(1, x(hourEnd) - x(hourStart) - 2),
        height: rowHeight - 6,
        rx: 2,
        fill,
        class: 'night-cell',
      })
      cell.append(svgElement('title', {}, `${hour.time} UTC · ${tooltip}`))
      chart.append(cell)
    })

    for (let i = 0; i < hours.length; i += 2) {
      const hourStart = Date.parse(hours[i].time)
      if (rowIndex === 0) {
        const date = new Date(hourStart)
        chart.append(
          svgElement('line', { x1: x(hourStart), x2: x(hourStart), y1: top, y2: top + rows.length * rowHeight, class: 'night-grid night-grid-vertical' }),
          svgElement('text', { x: x(hourStart), y: top + rows.length * rowHeight + 17, class: 'night-time-label', 'text-anchor': 'middle' }, `${String(date.getUTCHours()).padStart(2, '0')}Z`),
        )
      }
    }
  })

  return chart
}

function renderObservingConditionsChart(hours = []) {
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

  const formatUtc = (value) => {
    const date = new Date(value)
    return `${String(date.getUTCMonth() + 1).padStart(2, '0')}/${String(date.getUTCDate()).padStart(2, '0')} ${String(date.getUTCHours()).padStart(2, '0')}Z`
  }

  function updateWindow() {
    const windowHours = validHours.slice(windowStart, windowStart + windowSize)
    if (windowHours.length === 0) return
    const windowStartTime = Date.parse(windowHours[0].time)
    const windowEndTime = Math.min(windowStartTime + windowSize * hourMs, Date.parse(windowHours.at(-1).time) + hourMs)
    previous.disabled = windowStart === 0
    next.disabled = windowStart + windowSize >= validHours.length
    range.textContent = `${formatUtc(windowStartTime)} - ${formatUtc(windowEndTime)}`
    chartHost.replaceChildren(renderObservingConditionsWindow(windowHours, windowStartTime))
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
      renderNightSkyChart(data.forecastHours ?? data.nightHours),
    ),

  'observing-conditions': (data) =>
    h('div', {}, renderObservingConditionsChart(data.forecast ?? [])),

  'moon-timeline': (data) => {
    const moon = data.moon ?? {}
    return h(
      'div',
      {},
      h(
        'div',
        { class: 'moon-summary' },
        h('span', { class: 'moon-glyph', role: 'img', 'aria-label': moon.name }, moon.glyph ?? '◐'),
        h('div', {},
          h('strong', {}, moon.name ?? 'Moon phase'),
          h('div', { class: 'muted' }, `${moon.illumination ?? '—'}% illuminated`),
        ),
      ),
      h('div', { class: 'muted' }, `Sunrise ${formatDate(data.sunrise)} · Sunset ${formatDate(data.sunset)}`),
      h('div', { class: 'muted' }, `Moonrise ${formatDate(data.moonrise)} · Moonset ${formatDate(data.moonset)}`),
    )
  },


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
  const sourceLinks = Array.isArray(attribution)
    ? attribution.map((item, index) => [
        index > 0 ? ' · ' : null,
        h('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer' }, item.label),
      ])
    : attribution && [
        h('a', { href: attribution.url, target: '_blank', rel: 'noopener noreferrer' }, attribution.label),
      ]
  return h(
    'section',
    { class: 'card', id: source.name },
    h('h2', {}, source.title ?? source.name),
    body,
    h(
      'p',
      { class: 'meta' },
      `Updated: ${formatDate(source.updatedAt)}`,
      sourceLinks && [' · Source: ', ...sourceLinks],
    ),
  )
}
