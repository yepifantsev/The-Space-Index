import { h, formatTime } from './h.js'
import {
  altitudeStatus,
  azimuthToCompass,
} from './formatters/moon-timeline.formatter.js'
import {
  formatEasternNavigation,
  formatLocationNavigation,
  formatLaunchStatus,
  launchStatusStyle,
  formatCneosDate,
  renderNightSkyChart,
  renderStandaloneMetric,
} from './section-helpers.js'

// One renderer per data source (keyed by source name). Each receives the `data` field of the JSON file.
export const renderers = {
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
      h(
        'div',
        { class: `moon-info mt-1 ${moon.aboveHorizon === false ? ' muted' : ''}` },
        `Altitude: `,
        h(
          'strong',
          { class: `moon-altitude` },
          `${Number.isFinite(moon.altitude) ? `${moon.altitude.toFixed(1)}° (${altitudeStatus(moon.altitude)})` : '—'}`,
        ),
      ),
      h('div', { class: `moon-info ${moon.aboveHorizon === false ? 'muted' : ''}` }, `Azimuth: `, h('strong', { class: 'moon-azimuth' }, `${Number.isFinite(moon.azimuth) ? `${moon.azimuth.toFixed(1)}° (${azimuthToCompass(moon.azimuth)})` : '—'}`)),
      h('div', { class: `moon-info mt-1 ${moon.aboveHorizon === false ? 'muted' : ''}` }, `Magnitude: `, h('strong', { class: 'moon-apparent-magnitude' }, `${Number.isFinite(moon.apparentMag) ? moon.apparentMag.toFixed(2) : '—'}`)),
      h('div', { class: `moon-info ${moon.aboveHorizon === false ? 'muted' : ''}` }, `Sky glow: `, h('strong', { class: 'moon-sky-glow' }, `${Number.isFinite(moon.zenithSkySqm) ? `${moon.zenithSkySqm.toFixed(2)} mag/arcsec²` : '—'}`)),
      h('div', { class: 'moon-info mt-1' }, `Moonrise: `, h('strong', {}, `${formatTime(data.moonrise)}`)),
      h('div', { class: 'moon-info' }, `Moonset: `, h('strong', {}, `${formatTime(data.moonset)}`)),
      h('div', { class: 'moon-info mt-1' }, `Last phase: `, h('strong', {}, `${moon.previousPhase?.name ?? '—'} · ${moon.previousPhase?.time ? formatEasternNavigation(moon.previousPhase.time) : '—'}`)),
      h('div', { class: 'moon-info' }, `Next phase: `, h('strong', {}, `${moon.nextPhase?.name ?? '—'} · ${moon.nextPhase?.time ? formatEasternNavigation(moon.nextPhase.time) : '—'}`)),
    )
  },

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
