/**
 * The ContextProvider seam: provider-neutral context assembly. Before a turn,
 * the app can prepend a "context pack" built from toggleable sources (board card,
 * linked files, worktree facts). Each source is opt-in so autonomy scales with
 * intent and token cost stays controllable — and because structured sessions
 * report real usage back, every injected pack can be measured.
 *
 * NOTE: `CLAUDE.md` / repo conventions are intentionally NOT a source — the agent
 * CLI already loads them, so re-injecting would just waste tokens.
 */
export type ContextSourceId = 'card' | 'linkedFiles' | 'worktree'

export interface ContextSourceMeta {
  id: ContextSourceId
  label: string
  icon: string
  hint: string
}

export const CONTEXT_SOURCES: readonly ContextSourceMeta[] = [
  { id: 'card', label: 'Board card', icon: 'sticky_note_2', hint: 'The linked card’s title + description' },
  { id: 'linkedFiles', label: 'Linked files', icon: 'description', hint: 'Files referenced by the card' },
  { id: 'worktree', label: 'Worktree facts', icon: 'account_tree', hint: 'Branch + worktree this session runs in' }
]

/** What the renderer asks main to assemble. All fields untrusted at the boundary. */
export interface ContextBuildRequest {
  repoPath: string
  sources: ContextSourceId[]
  boardId?: string
  cardId?: string
  branch?: string
  worktree?: string | null
}

export interface ContextPart {
  id: ContextSourceId
  label: string
  /** Rough token estimate (chars/4) for this part. */
  estTokens: number
}

export interface ContextBuildResult {
  /** The assembled preamble to prepend to the first turn (empty if nothing). */
  preamble: string
  estTokens: number
  parts: ContextPart[]
}
