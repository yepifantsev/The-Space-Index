import { readdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import defaultSources from './fetchers/index.js'

export async function cleanGeneratedData({
  dataDir = fileURLToPath(new URL('../data/', import.meta.url)),
  sources = defaultSources,
} = {}) {
  const names = new Set(sources.map((source) => source.name))
  const removed = []

  for (const relativeDir of ['', 'raw']) {
    const dir = path.join(dataDir, relativeDir)
    let files
    try {
      files = await readdir(dir)
    } catch (error) {
      if (error?.code === 'ENOENT') continue
      throw error
    }

    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const name = file.slice(0, -'.json'.length)
      if (names.has(name)) continue
      await unlink(path.join(dir, file))
      removed.push(path.join(relativeDir, file))
    }
  }

  return removed
}

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isMain) {
  const removed = await cleanGeneratedData()
  for (const file of removed) console.log(`Removed stale data: ${file}`)
}
