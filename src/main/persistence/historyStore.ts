import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'

// History is machine-local activity (it references session ids etc.), so it
// lives in the app-data dir keyed by project path — not in the repo.
const fileFor = (repoPath: string): string =>
  join(app.getPath('userData'), 'projects', createHash('sha256').update(repoPath).digest('hex').slice(0, 16), 'history.json')

export async function loadHistory(repoPath: string): Promise<unknown[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(fileFor(repoPath), 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveHistory(repoPath: string, entries: unknown[]): Promise<void> {
  const file = fileFor(repoPath)
  await fs.mkdir(join(file, '..'), { recursive: true })
  await fs.writeFile(file, JSON.stringify(entries.slice(0, 300)), 'utf8')
}
