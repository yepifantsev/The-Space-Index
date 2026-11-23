const USER_AGENT =
  'The-Space-Index/0.0 (+https://github.com/yepifantsev/The-Space-Index)'

const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

async function wait(milliseconds) {
  if (milliseconds > 0) await new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function fetchWithRetry(url, { timeoutMs = 20000, headers = {}, accept = 'application/json', retryCount = 2, retryDelayMs = 250 } = {}, parseResponse) {
  let lastError
  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: accept, ...headers },
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) {
        const error = new Error(`HTTP ${res.status} ${res.statusText} for ${url}`)
        if (RETRYABLE_STATUS_CODES.has(res.status) && attempt < retryCount) {
          lastError = error
          await wait(retryDelayMs * (2 ** attempt))
          continue
        }
        throw error
      }
      return await parseResponse(res)
    } catch (error) {
      lastError = error
      if (attempt < retryCount) {
        await wait(retryDelayMs * (2 ** attempt))
        continue
      }
    }
  }
  throw new Error(`Request failed for ${url}: ${lastError?.message ?? String(lastError)}`, { cause: lastError })
}

/**
 * Fetch a URL and parse it as JSON, with a timeout and a descriptive error.
 */
export async function fetchJson(url, { timeoutMs = 20000, headers = {}, retryCount = 2, retryDelayMs = 250 } = {}) {
  return fetchWithRetry(url, { timeoutMs, headers, accept: 'application/json', retryCount, retryDelayMs }, (res) => res.json())
}

export async function fetchText(url, { timeoutMs = 20000, headers = {}, retryCount = 2, retryDelayMs = 250 } = {}) {
  return fetchWithRetry(url, { timeoutMs, headers, accept: 'text/html', retryCount, retryDelayMs }, (res) => res.text())
}
