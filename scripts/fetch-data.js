// Pulls data from every configured source and writes one JSON file per source
// into data/. Runs at build time only (locally or from the scheduled CI job);
// site visitors never trigger these requests.
//
// If a source fails, its previous JSON file is kept so the site can still be
// built with the last known good data.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defaultSources from './fetchers/index.js'

export const DATA_DIR = fileURLToPath(new URL('../data/', import.meta.url))

async function readExisting(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}

export async function runSources(sources = defaultSources, { outDir = DATA_DIR, now = () => new Date() } = {}) {
  await mkdir(outDir, { recursive: true })
  await mkdir(path.join(outDir, 'raw'), { recursive: true })

  const results = await Promise.all(
    sources.map(async (source) => {
      const file = path.join(outDir, `${source.name}.json`)
      const meta = { name: source.name, title: source.title, attribution: source.attribution ?? null }
      try {
        let data
        if (typeof source.fetchRaw === 'function' && typeof source.formatRaw === 'function') {
          const raw = await source.fetchRaw()
          const rawFile = path.join(outDir, 'raw', `${source.name}.json`)
          await writeFile(rawFile, JSON.stringify(raw, null, 2) + '\n')
          data = source.formatRaw(raw, { now: now() })
        } else {
          data = await source.fetch()
        }
        const payload = { ...meta, updatedAt: now().toISOString(), error: null, data }
        await writeFile(file, JSON.stringify(payload, null, 2) + '\n')
        return { name: source.name, ok: true }
      } catch (err) {
        const message = err?.message ?? String(err)
        const existing = await readExisting(file)
        if (!existing) {
          // No previous data: write a placeholder so the site can show the section as unavailable.
          const payload = { ...meta, updatedAt: null, error: message, data: null }
          await writeFile(file, JSON.stringify(payload, null, 2) + '\n')
        }
        return { name: source.name, ok: false, error: message, keptPrevious: Boolean(existing) }
      }
    }),
  )
  return results
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const only = process.argv.slice(2)
  const selected = only.length ? defaultSources.filter((s) => only.includes(s.name)) : defaultSources
  const results = await runSources(selected)
  for (const r of results) {
    if (r.ok) console.log(`✔ ${r.name}`)
    else console.warn(`✘ ${r.name}: ${r.error}${r.keptPrevious ? ' (kept previous data)' : ''}`)
  }
  if (results.length && results.every((r) => !r.ok)) {
    console.warn('All sources failed; the site will be built with existing/placeholder data.')
  }
}
