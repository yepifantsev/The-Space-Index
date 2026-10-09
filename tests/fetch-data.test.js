import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { runSources } from '../scripts/fetch-data.js'
import sources from '../scripts/sources/index.js'

const fixedNow = () => new Date('2026-01-01T00:00:00Z')

async function tempDir() {
  return mkdtemp(path.join(tmpdir(), 'space-index-'))
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

test('every source has a unique name, title and fetch function', () => {
  const names = sources.map((s) => s.name)
  assert.equal(new Set(names).size, names.length)
  for (const s of sources) {
    assert.match(s.name, /^[a-z0-9-]+$/)
    assert.equal(typeof s.title, 'string')
    assert.equal(typeof s.fetch, 'function')
  }
})

test('writes fetched data to <name>.json', async () => {
  const outDir = await tempDir()
  const results = await runSources(
    [{ name: 'demo', title: 'Demo', fetch: async () => ({ value: 42 }) }],
    { outDir, now: fixedNow },
  )
  assert.deepEqual(results, [{ name: 'demo', ok: true }])
  const json = await readJson(path.join(outDir, 'demo.json'))
  assert.equal(json.updatedAt, '2026-01-01T00:00:00.000Z')
  assert.equal(json.error, null)
  assert.deepEqual(json.data, { value: 42 })
})

test('keeps previous data when a source fails', async () => {
  const outDir = await tempDir()
  const previous = { name: 'demo', title: 'Demo', updatedAt: 'x', error: null, data: { value: 1 } }
  await writeFile(path.join(outDir, 'demo.json'), JSON.stringify(previous))
  const [result] = await runSources(
    [{ name: 'demo', title: 'Demo', fetch: async () => { throw new Error('boom') } }],
    { outDir, now: fixedNow },
  )
  assert.equal(result.ok, false)
  assert.equal(result.keptPrevious, true)
  assert.deepEqual(await readJson(path.join(outDir, 'demo.json')), previous)
})

test('writes a placeholder when a source fails with no previous data', async () => {
  const outDir = await tempDir()
  const [result] = await runSources(
    [{ name: 'demo', title: 'Demo', fetch: async () => { throw new Error('boom') } }],
    { outDir, now: fixedNow },
  )
  assert.equal(result.keptPrevious, false)
  const json = await readJson(path.join(outDir, 'demo.json'))
  assert.equal(json.data, null)
  assert.equal(json.updatedAt, null)
  assert.equal(json.error, 'boom')
})
