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
