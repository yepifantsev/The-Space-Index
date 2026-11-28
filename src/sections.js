import { h } from './h.js'
import { formatLocationNavigation } from './section-helpers.js'

export const renderers = {}

export function renderSection(source) {
  const body = source.data == null
    ? h('p', { class: 'muted' }, 'Data not available yet.')
    : h('pre', {}, JSON.stringify(source.data, null, 2))

  const sourceLinks = []
  if (Array.isArray(source.attribution)) {
    source.attribution.forEach((item, index) => {
      if (index > 0) sourceLinks.push(' · ')
      sourceLinks.push(h('a', { href: item.url, target: '_blank', rel: 'noopener noreferrer' }, item.label))
    })
  } else if (source.attribution) {
    sourceLinks.push(h('a', { href: source.attribution.url, target: '_blank', rel: 'noopener noreferrer' }, source.attribution.label))
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
      sourceLinks.length > 0 && [' · Source: ', ...sourceLinks],
    ),
  )
}
