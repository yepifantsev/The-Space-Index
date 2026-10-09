import { h, formatDate } from './h.js'

// One renderer per data source (keyed by source name). Each receives the `data` field of the JSON file.
export const renderers = {
  'space-weather': (data) => {
    const latest = data.latest
    return h(
      'div',
      {},
      h('p', { class: 'big' }, latest ? `Kp ${latest.kp}` : 'No Kp reading'),
      latest && h('p', { class: 'muted' }, `as of ${formatDate(latest.time)}`),
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
      h(
        'ul',
        {},
        data.nightHours.map((x) => h('li', {}, `${formatDate(x.time)} — clouds ${x.cloudCover ?? '?'}%`)),
      ),
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
