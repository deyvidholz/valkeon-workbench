import { resolve } from 'node:path'
import { promises as fs } from 'node:fs'
import type { ContextBuildRequest, ContextBuildResult, ContextPart, ContextSourceId } from '@shared/context'
import type { Board, BoardCard } from '@shared/persistence/types'
import { assertInside } from '../persistence/paths'

const estTokens = (s: string): number => Math.ceil(s.length / 4)
const FILE_CAP = 2048
const FILES_TOTAL_CAP = 6144

/** Pull backticked path-like tokens out of a card body (e.g. `src/foo.ts`). */
function referencedPaths(body: string): string[] {
  const out = new Set<string>()
  for (const m of body.matchAll(/`([^`\n]+)`/g)) {
    const token = m[1].trim()
    if (/[/\\]/.test(token) || /\.[A-Za-z0-9]{1,6}$/.test(token)) {
      if (token.length <= 200 && !token.includes(' ')) out.add(token)
    }
  }
  return [...out].slice(0, 12)
}

/**
 * Assemble the {@link ContextBuildResult} from the enabled sources. Pure given
 * the already-loaded card/board; reads referenced files from disk (guarded to
 * stay inside the repo). Token estimates are chars/4 so the UI can show cost.
 */
export async function buildContext(
  repoPath: string,
  req: ContextBuildRequest,
  card: BoardCard | undefined,
  board: Board | undefined
): Promise<ContextBuildResult> {
  const enabled = new Set<ContextSourceId>(req.sources)
  const parts: ContextPart[] = []
  const chunks: string[] = []

  const add = (id: ContextSourceId, label: string, text: string): void => {
    const trimmed = text.trim()
    if (!trimmed) return
    parts.push({ id, label, estTokens: estTokens(trimmed) })
    chunks.push(trimmed)
  }

  if (enabled.has('card') && card) {
    const labelNames = card.labels
      .map((lid) => board?.labels.find((l) => l.id === lid)?.name)
      .filter(Boolean)
    const lines = [`## Task #${card.code}: ${card.title}`]
    if (card.body.trim()) lines.push('', card.body.trim())
    if (labelNames.length) lines.push('', `Labels: ${labelNames.join(', ')}`)
    add('card', 'Board card', lines.join('\n'))
  }

  if (enabled.has('worktree') && (req.branch || req.worktree)) {
    const where = req.worktree
      ? `You are working in the git worktree \`${req.worktree}\` on branch \`${req.branch ?? ''}\`. Stay on this branch — do not switch.`
      : `You are working on branch \`${req.branch}\`. Stay on this branch — do not switch.`
    add('worktree', 'Worktree facts', where)
  }

  if (enabled.has('linkedFiles') && card) {
    const paths = referencedPaths(card.body)
    const blocks: string[] = []
    let total = 0
    for (const rel of paths) {
      if (total >= FILES_TOTAL_CAP) break
      let abs: string
      try {
        // Lexical guard first, then canonicalize and re-check so an in-repo
        // symlink can't point the read outside the repo (assertInside alone is
        // purely string-based and follows no links).
        abs = assertInside(repoPath, resolve(repoPath, rel))
        abs = assertInside(repoPath, await fs.realpath(abs))
      } catch {
        continue
      }
      try {
        const stat = await fs.stat(abs)
        // Skip non-files and anything too large to be useful context — read the
        // whole file only after the size is known so a huge file can't OOM us.
        if (!stat.isFile() || stat.size > 64 * 1024) continue
        let content = await fs.readFile(abs, 'utf8')
        // utf8 decoding never throws on binary; detect it and skip (NUL byte or a
        // run of replacement chars) so we don't inject garbage tokens.
        if (content.includes('\u0000') || /\uFFFD{3}/.test(content)) continue
        if (content.length > FILE_CAP) content = `${content.slice(0, FILE_CAP)}\n… (truncated)`
        const block = `\`${rel}\`:\n\`\`\`\n${content}\n\`\`\``
        total += block.length
        blocks.push(block)
      } catch {
        // unreadable / missing — skip
      }
    }
    if (blocks.length) add('linkedFiles', 'Linked files', `### Referenced files\n\n${blocks.join('\n\n')}`)
  }

  const preamble = chunks.length ? `[Context provided by Valkeon Workbench]\n\n${chunks.join('\n\n')}` : ''
  return { preamble, estTokens: estTokens(preamble), parts }
}
