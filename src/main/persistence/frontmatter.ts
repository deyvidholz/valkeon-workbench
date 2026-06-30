import yaml from 'js-yaml'
import type { BoardCard, CardAttachment, CardLink, ColumnId } from '@shared/persistence/types'

interface CardFrontmatter {
  id?: string
  code?: number
  column?: ColumnId
  order?: string
  labels?: string[]
  branch?: string | null
  worktree?: string | null
  attachments?: CardAttachment[]
}

/**
 * Serialize a card to a human-readable markdown file: YAML frontmatter for the
 * structured fields, an H1 for the title, and the markdown body below — so the
 * file is diffable, reviewable, and editable outside Valkeon (or by Claude
 * itself, with its normal file tools). The card `id` is stored in frontmatter so
 * identity round-trips identically to the local store.
 */
export function serializeCard(card: BoardCard): string {
  const front: Record<string, unknown> = {
    id: card.id,
    code: card.code,
    column: card.column,
    order: card.order,
    labels: card.labels,
    branch: card.link.branch,
    worktree: card.link.worktree
  }
  if (card.attachments.length) front.attachments = card.attachments

  const yamlText = yaml.dump(front, { lineWidth: 100, noRefs: true }).trimEnd()
  const title = card.title.trim()
  const body = card.body.trim()

  const sections: string[] = []
  if (title) sections.push(`# ${title}`)
  if (body) sections.push(body)
  return `---\n${yamlText}\n---\n\n${sections.join('\n\n')}${sections.length ? '\n' : ''}`
}

/**
 * Parse a card markdown file back into a {@link BoardCard}. Tolerant of hand
 * edits and CRLF line endings (these files are meant to be edited outside the
 * app and may be checked out with `core.autocrlf`).
 */
export function parseCardFile(fallbackId: string, raw: string): BoardCard {
  const text = raw.replace(/\r\n/g, '\n')

  let fm: CardFrontmatter = {}
  let rest = text
  const match = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(text)
  if (match) {
    fm = (yaml.load(match[1]) as CardFrontmatter) ?? {}
    rest = match[2]
  }

  // Title = a leading H1 (on one line); everything after is the body. An empty
  // title must NOT swallow the first body word, so the heading match stays on
  // its own line.
  let title = ''
  let body = rest.replace(/^\s+/, '')
  const h1 = /^#[ \t]+(.+?)[ \t]*(?:\n|$)/.exec(body)
  if (h1) {
    title = h1[1].trim()
    body = body.slice(h1[0].length).replace(/^\s+/, '')
  }

  const link: CardLink = { branch: fm.branch ?? null, worktree: fm.worktree ?? null }
  return {
    id: fm.id ?? fallbackId,
    code: typeof fm.code === 'number' ? fm.code : 0,
    column: fm.column ?? 'backlog',
    order: fm.order ?? 'a0',
    title,
    body: body.trimEnd(),
    labels: fm.labels ?? [],
    link,
    attachments: fm.attachments ?? []
  }
}
