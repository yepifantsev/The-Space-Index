import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchJson, fetchText } from '../scripts/lib/http.js'

test('fetchJson returns a successful JSON response', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({ value: 42 }),
  })
  try {
    await assert.doesNotReject(() => fetchJson('https://example.test/data.json'))
    assert.deepEqual(await fetchJson('https://example.test/data.json'), { value: 42 })
  } finally {
    globalThis.fetch = original
  }
})

test('fetchJson retries retryable HTTP failures', async () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    if (calls === 1) {
      return { ok: false, status: 503, statusText: 'Unavailable', json: async () => ({}) }
    }
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ recovered: true }),
    }
  }
  try {
    const result = await fetchJson('https://example.test/retry.json', { retryDelayMs: 0 })
    assert.deepEqual(result, { recovered: true })
    assert.equal(calls, 2)
  } finally {
    globalThis.fetch = original
  }
})

test('fetchText returns text and reports final network failure', async () => {
  const original = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    throw new TypeError('network down')
  }
  try {
    await assert.rejects(
      () => fetchText('https://example.test/data.txt', { retryCount: 2, retryDelayMs: 0 }),
      /Request failed/,
    )
    assert.equal(calls, 3)
  } finally {
    globalThis.fetch = original
  }
})
