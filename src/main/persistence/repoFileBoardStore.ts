import { promises as fs } from 'node:fs'
import { basename, join } from 'node:path'
import type { BoardStorageMode, BoardStore } from '@shared/persistence/boardStore'
import type { Board, BoardCard, ProjectData, WorkspaceRecord } from '@shared/persistence/types'
import { ensureValkeonScaffold, VALKEON_DIR } from './scaffold'
import { parseCardFile, serializeCard } from './frontmatter'
import { assertInside, safeSegment } from './paths'

const slugify = (s: string): string =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'card'

/** Board definition without its cards (cards live as individual files). */
type BoardMeta = Omit<Board, 'cards'>

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T
  } catch {
    return null
  }
}

async function writeJson(file: string, data: unknown): Promise<void> {
  await fs.mkdir(join(file, '..'), { recursive: true })
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
}

/**
 * Stores board content as human-readable files under `<repo>/.valkeon/`:
 *
 *   .valkeon/workspaces.json
 *   .valkeon/boards/<boardId>/board.json        (columns, labels, scope, base)
 *   .valkeon/boards/<boardId>/cards/<code>-<slug>.md   (frontmatter + markdown)
 *
 * Writes touch the working tree only — Valkeon never commits. Renderer-supplied
 * ids are validated as single path segments before they reach the filesystem.
 */
export class RepoFileBoardStore implements BoardStore {
  readonly mode: BoardStorageMode = 'repo'
  private readonly dir: string

  constructor(private readonly repoPath: string) {
    this.dir = join(repoPath, VALKEON_DIR)
  }

  private boardsDir(): string {
    return join(this.dir, 'boards')
  }
  private boardDir(boardId: string): string {
    return join(this.boardsDir(), boardId)
  }
  private cardsDir(boardId: string): string {
    return join(this.boardDir(boardId), 'cards')
  }

  async load(): Promise<ProjectData> {
    const workspaces = (await readJson<WorkspaceRecord[]>(join(this.dir, 'workspaces.json'))) ?? []

    let boardIds: string[] = []
    try {
      boardIds = (await fs.readdir(this.boardsDir(), { withFileTypes: true }))
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    } catch {
      boardIds = []
    }

    const boards: Board[] = []
    for (const boardId of boardIds) {
      const meta = await readJson<BoardMeta>(join(this.boardDir(boardId), 'board.json'))
      if (!meta) continue

      const cards: BoardCard[] = []
      let files: string[] = []
      try {
        files = (await fs.readdir(this.cardsDir(boardId))).filter((f) => f.endsWith('.md'))
      } catch {
        files = []
      }
      for (const file of files) {
        const raw = await fs.readFile(join(this.cardsDir(boardId), file), 'utf8')
        cards.push(parseCardFile(this.fallbackId(file), raw))
      }
      cards.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0))
      boards.push({ ...meta, cards })
    }

    return { workspaces, boards }
  }

  async saveWorkspaces(workspaces: WorkspaceRecord[]): Promise<void> {
    await ensureValkeonScaffold(this.repoPath)
    await writeJson(join(this.dir, 'workspaces.json'), workspaces)
  }

  async saveBoard(board: Board): Promise<void> {
    const id = safeSegment('board.id', board.id)
    await ensureValkeonScaffold(this.repoPath)
    // Allowlist the durable fields — never spread-through arbitrary/ephemeral
    // properties into the committed repo tier.
    const meta: BoardMeta = {
      id: board.id,
      name: board.name,
      scope: board.scope,
      baseBranch: board.baseBranch,
      columns: board.columns,
      labels: board.labels
    }
    const file = assertInside(this.boardsDir(), join(this.boardDir(id), 'board.json'))
    await writeJson(file, meta)
  }

  async saveCard(boardId: string, card: BoardCard): Promise<void> {
    const id = safeSegment('boardId', boardId)
    if (!Number.isInteger(card.code)) throw new Error(`card.code must be an integer: ${card.code}`)
    // Match the local store: don't create cards for a board that doesn't exist.
    if (!(await readJson<BoardMeta>(join(this.boardDir(id), 'board.json')))) return

    const dir = this.cardsDir(id)
    await fs.mkdir(dir, { recursive: true })
    const file = assertInside(dir, join(dir, `${card.code}-${slugify(card.title)}.md`))
    // Write the new file BEFORE removing stale ones, so an interrupted save can
    // never leave the card gone.
    await fs.writeFile(file, serializeCard(card), 'utf8')
    await this.removeCardFiles(id, card.code, basename(file))
  }

  async deleteCard(boardId: string, cardId: string): Promise<void> {
    const id = safeSegment('boardId', boardId)
    const dir = this.cardsDir(id)
    let files: string[] = []
    try {
      files = (await fs.readdir(dir)).filter((f) => f.endsWith('.md'))
    } catch {
      return
    }
    for (const file of files) {
      const raw = await fs.readFile(join(dir, file), 'utf8')
      if (parseCardFile(this.fallbackId(file), raw).id === cardId) {
        await fs.rm(join(dir, file), { force: true })
        return
      }
    }
  }

  /** Card id derived from the filename, used only as a fallback if frontmatter lacks one. */
  private fallbackId(file: string): string {
    const code = parseInt(file.split('-')[0], 10)
    return Number.isFinite(code) ? `c${code}` : file.replace(/\.md$/, '')
  }

  private async removeCardFiles(boardId: string, code: number, except?: string): Promise<void> {
    const dir = this.cardsDir(boardId)
    let files: string[] = []
    try {
      files = await fs.readdir(dir)
    } catch {
      return
    }
    await Promise.all(
      files
        .filter((f) => f !== except && (f === `${code}.md` || f.startsWith(`${code}-`)))
        .map((f) => fs.rm(join(dir, f), { force: true }))
    )
  }
}
