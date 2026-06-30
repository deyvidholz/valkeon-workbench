import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'

// The session list (so they can be resumed on reopen) is machine-local and keyed
// by project path — it references local ids/cwds, so it lives in app-data, not
// the repo.
const fileFor = (repoPath: string): string =>
  join(app.getPath('userData'), 'projects', createHash('sha256').update(repoPath).digest('hex').slice(0, 16), 'sessions.json')

export async function loadSessions(repoPath: string): Promise<unknown[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(fileFor(repoPath), 'utf8'))
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export async function saveSessions(repoPath: string, sessions: unknown[]): Promise<void> {
  const file = fileFor(repoPath)
  await fs.mkdir(join(file, '..'), { recursive: true })
  await fs.writeFile(file, JSON.stringify(sessions.slice(0, 40)), 'utf8')
}
