import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import type { ProjectConfig } from '@shared/project'
import { DEFAULT_PROJECT_CONFIG } from '@shared/project'

// Project settings live in the repo so they're shareable/committable.
const configFile = (repoPath: string): string => join(repoPath, '.valkeon', 'config.json')

export async function loadProjectConfig(repoPath: string): Promise<ProjectConfig> {
  try {
    const raw = JSON.parse(await fs.readFile(configFile(repoPath), 'utf8')) as Partial<ProjectConfig>
    return {
      baseBranch: typeof raw.baseBranch === 'string' && raw.baseBranch ? raw.baseBranch : DEFAULT_PROJECT_CONFIG.baseBranch,
      taskStrategy: raw.taskStrategy === 'worktree' || raw.taskStrategy === 'current' ? raw.taskStrategy : DEFAULT_PROJECT_CONFIG.taskStrategy
    }
  } catch {
    return { ...DEFAULT_PROJECT_CONFIG }
  }
}

export async function saveProjectConfig(repoPath: string, config: ProjectConfig): Promise<void> {
  const dir = join(repoPath, '.valkeon')
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(configFile(repoPath), `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}
