import { promises as fs } from 'node:fs'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import type { BoardStorageMode, BoardStore } from '@shared/persistence/boardStore'
import type { Board, BoardCard, ProjectData, WorkspaceRecord } from '@shared/persistence/types'

/**
 * Escape-hatch adapter for users who don't want board files in their repo.
 * Stores the whole {@link ProjectData} as one JSON blob in the app-data dir,
 * keyed (by the factory) to the project path. Never touches the repo.
 *
 * All operations are serialized through an in-process queue so concurrent
 * read-modify-write calls can't clobber each other (last-writer-wins).
 */
export class LocalBoardStore implements BoardStore {
  readonly mode: BoardStorageMode = 'local'
  private chain: Promise<unknown> = Promise.resolve()

  constructor(private readonly file: string) {}

  private enqueue<T>(op: () => Promise<T>): Promise<T> {
    const run = this.chain.then(op, op)
    this.chain = run.then(
      () => undefined,
      () => undefined
    )
    return run
  }

  private async read(): Promise<ProjectData> {
    try {
      return JSON.parse(await fs.readFile(this.file, 'utf8')) as ProjectData
    } catch {
      return { workspaces: [], boards: [] }
    }
  }

  private async write(data: ProjectData): Promise<void> {
    await fs.mkdir(join(this.file, '..'), { recursive: true })
    const tmp = `${this.file}.${randomUUID()}.tmp`
    await fs.writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, 'utf8')
    await fs.rename(tmp, this.file)
  }

  load(): Promise<ProjectData> {
    return this.enqueue(() => this.read())
  }

  saveWorkspaces(workspaces: WorkspaceRecord[]): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read()
      data.workspaces = workspaces
      await this.write(data)
    })
  }

  saveBoard(board: Board): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read()
      const i = data.boards.findIndex((b) => b.id === board.id)
      // Definition-only, mirroring RepoFileBoardStore: cards never come from the
      // incoming board (empty on insert, preserved on update).
      const existingCards = i >= 0 ? data.boards[i].cards : []
      const meta: Board = { ...board, cards: existingCards }
      if (i >= 0) data.boards[i] = meta
      else data.boards.push(meta)
      await this.write(data)
    })
  }

  saveCard(boardId: string, card: BoardCard): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read()
      const board = data.boards.find((b) => b.id === boardId)
      if (!board) return
      const i = board.cards.findIndex((c) => c.id === card.id)
      if (i >= 0) board.cards[i] = card
      else board.cards.push(card)
      await this.write(data)
    })
  }

  deleteCard(boardId: string, cardId: string): Promise<void> {
    return this.enqueue(async () => {
      const data = await this.read()
      const board = data.boards.find((b) => b.id === boardId)
      if (!board) return
      board.cards = board.cards.filter((c) => c.id !== cardId)
      await this.write(data)
    })
  }
}
