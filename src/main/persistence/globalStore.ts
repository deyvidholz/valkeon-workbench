import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { AppSettings, GlobalState, RecentProject, WindowBounds } from '@shared/persistence/global'
import { DEFAULT_SETTINGS } from './defaults'

const MAX_RECENTS = 12

/**
 * Per-user global state (settings, recent projects, window bounds) persisted as
 * a single JSON file in the app's userData dir. Writes are serialized and atomic
 * (unique temp + rename) so overlapping persists can't corrupt the file or race
 * on a shared temp path. Never written into any repo.
 */
export class GlobalStore {
  private state: GlobalState = { settings: { ...DEFAULT_SETTINGS }, recents: [] }
  private chain: Promise<unknown> = Promise.resolve()

  constructor(private readonly file: string) {}

  async init(): Promise<void> {
    try {
      const raw = JSON.parse(await fs.readFile(this.file, 'utf8')) as Partial<GlobalState>
      this.state = {
        settings: { ...DEFAULT_SETTINGS, ...(raw.settings ?? {}) },
        recents: raw.recents ?? [],
        windowBounds: raw.windowBounds,
        skippedUpdateVersion: raw.skippedUpdateVersion
      }
    } catch {
      // First run — keep defaults.
    }
  }

  private persist(): Promise<void> {
    const write = async (): Promise<void> => {
      await fs.mkdir(join(this.file, '..'), { recursive: true })
      const tmp = `${this.file}.${randomUUID()}.tmp`
      await fs.writeFile(tmp, `${JSON.stringify(this.state, null, 2)}\n`, 'utf8')
      await fs.rename(tmp, this.file)
    }
    const run = this.chain.then(write, write)
    this.chain = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }

  getSettings(): AppSettings {
    return this.state.settings
  }

  async setSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
    this.state.settings = { ...this.state.settings, ...patch }
    await this.persist()
    return this.state.settings
  }

  getRecents(): RecentProject[] {
    return this.state.recents
  }

  async addRecent(recent: RecentProject): Promise<RecentProject[]> {
    this.state.recents = [recent, ...this.state.recents.filter((r) => r.path !== recent.path)].slice(
      0,
      MAX_RECENTS
    )
    await this.persist()
    return this.state.recents
  }

  getSkippedUpdateVersion(): string | undefined {
    return this.state.skippedUpdateVersion
  }

  async setSkippedUpdateVersion(version: string | undefined): Promise<void> {
    this.state.skippedUpdateVersion = version
    await this.persist()
  }

  getBounds(): WindowBounds | undefined {
    return this.state.windowBounds
  }

  async setBounds(bounds: WindowBounds): Promise<void> {
    this.state.windowBounds = bounds
    await this.persist()
  }
}
