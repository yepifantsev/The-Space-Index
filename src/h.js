// Tiny DOM helper. Always uses textContent so third-party data is never parsed as HTML.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    if (key === 'href') {
      if (isSafeUrl(value)) el.setAttribute('href', value)
    } else {
      el.setAttribute(key, value)
    }
  }
  for (const child of children.flat()) {
    if (child == null || child === false) continue
    el.append(child instanceof Node ? child : document.createTextNode(String(child)))
  }
  return el
}

export function isSafeUrl(value) {
  try {
    const url = new URL(value, window.location.href)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}

export function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString()
}
