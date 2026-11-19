const USER_AGENT =
  'The-Space-Index/0.0 (+https://github.com/yepifantsev/The-Space-Index)'

/**
 * Fetch a URL and parse it as JSON, with a timeout and a descriptive error.
 */
export async function fetchJson(url, { timeoutMs = 20000, headers = {} } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
  }
  return res.json()
}

export async function fetchText(url, { timeoutMs = 20000, headers = {} } = {}) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/html', ...headers },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
  }
  return res.text()
}
