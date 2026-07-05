import { promises as fs } from 'node:fs'
import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { app } from 'electron'
import type { NotificationRecord } from '@shared/notifications'

// Notifications are machine-local (they reference session/run ids), so they live
// in the app-data dir keyed by project path — never in the repo. Newest first.
const fileFor = (repoPath: string): string =>
  join(app.getPath('userData'), 'projects', createHash('sha256').update(repoPath).digest('hex').slice(0, 16), 'notifications.json')

const MAX = 500

export async function loadNotifications(repoPath: string): Promise<NotificationRecord[]> {
  try {
    const parsed = JSON.parse(await fs.readFile(fileFor(repoPath), 'utf8'))
    return Array.isArray(parsed) ? (parsed as NotificationRecord[]) : []
  } catch {
    return []
  }
}

async function write(repoPath: string, records: NotificationRecord[]): Promise<NotificationRecord[]> {
  const file = fileFor(repoPath)
  const capped = records.slice(0, MAX)
  await fs.mkdir(join(file, '..'), { recursive: true })
  await fs.writeFile(file, JSON.stringify(capped), 'utf8')
  return capped
}

/** Prepend a new notification and return the full (capped) list. */
export async function addNotification(repoPath: string, record: NotificationRecord): Promise<NotificationRecord[]> {
  const existing = await loadNotifications(repoPath)
  return write(repoPath, [record, ...existing])
}

/** Replace the whole list (used for mark-viewed / mark-all / clear). */
export async function saveNotifications(repoPath: string, records: NotificationRecord[]): Promise<NotificationRecord[]> {
  return write(repoPath, records)
}
