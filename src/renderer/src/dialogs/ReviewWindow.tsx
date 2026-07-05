import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { DiffViewer } from '../components/DiffViewer'
import type { DiffFile } from '@shared/files'

interface Comment {
  file: string
  line: number
  text: string
}

const STAT_COLOR: Record<DiffFile['status'], string> = { added: '#5cc98a', modified: '#e0b15e', deleted: '#e07a6e' }
const STAT_GLYPH: Record<DiffFile['status'], string> = { added: 'A', modified: 'M', deleted: 'D' }

export function ReviewWindow() {
  const reviewCardId = useStore((s) => s.reviewCardId)
  const boards = useStore((s) => s.boards)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const sessions = useStore((s) => s.sessions)
  const project = useStore((s) => s.project)
  const activeWorktreePath = useStore((s) => s.activeWorktreePath)
  const close = useStore((s) => s.closeReview)
  const approve = useStore((s) => s.reviewApprove)
  const decline = useStore((s) => s.reviewDecline)
  const requestChanges = useStore((s) => s.reviewRequestChanges)
  const aiReview = useStore((s) => s.reviewByAi)

  const board = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => b.wsId === wsId)
  const card = board?.cards.find((c) => c.id === reviewCardId)
  const workSession = card?.sessionId ? sessions.find((s) => s.id === card.sessionId) : undefined
  const cwd = workSession?.cwd ?? card?.link.worktree ?? activeWorktreePath ?? (project?.path?.startsWith('/') ? project.path : null)

  const [files, setFiles] = useState<DiffFile[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [curLine, setCurLine] = useState(1)
  const [comments, setComments] = useState<Comment[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (!reviewCardId || !cwd) return
    setFiles(null)
    setComments([])
    void window.api?.files
      .diff(cwd)
      .then((d) => {
        setFiles(d)
        setSelected(d[0]?.path ?? null)
      })
      .catch(() => setFiles([]))
  }, [reviewCardId, cwd])

  const active = useMemo(() => files?.find((f) => f.path === selected) ?? null, [files, selected])

  if (!reviewCardId || !card) return null

  const addComment = (): void => {
    const text = draft.trim()
    if (!text || !selected) return
    setComments((c) => [...c, { file: selected, line: curLine, text }])
    setDraft('')
  }

  const feedbackText = (): string => {
    const header = 'Please address these review comments and update the code:\n'
    const body = comments.map((c, i) => `${i + 1}. \`${c.file}:${c.line}\` — ${c.text}`).join('\n')
    return `${header}\n${body}`
  }

  const onRequestChanges = (): void => {
    if (!comments.length) return
    requestChanges(feedbackText())
  }

  const actionBtn = (icon: string, label: string, onClick: () => void, opts?: { accent?: string; disabled?: boolean }): React.ReactNode => (
    <Hover
      as="span"
      onClick={() => !opts?.disabled && onClick()}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 12.5, fontWeight: 600, cursor: opts?.disabled ? 'not-allowed' : 'pointer', opacity: opts?.disabled ? 0.45 : 1, background: opts?.accent ?? 'var(--surface)', color: opts?.accent ? 'var(--on-accent)' : 'var(--text-2)', border: opts?.accent ? 'none' : '1px solid var(--line-2)' }}
      hover={opts?.disabled ? {} : opts?.accent ? { filter: 'brightness(1.08)' } : { background: 'var(--surface-2)' }}
    >
      <Icon name={icon} size={16} />
      {label}
    </Hover>
  )

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 62, background: 'var(--bg)', display: 'flex', flexDirection: 'column', animation: 'fadein .18s ease' }}>
      <div style={{ height: 48, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '0 16px', borderBottom: '1px solid var(--line)', background: 'var(--bg)' }}>
        <Icon name="difference" size={18} color="var(--accent-hi)" />
        <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>#{card.code}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{card.title}</span>
        {card.link.branch && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: 'var(--text-muted)', background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '2px 7px', borderRadius: 5 }}>
            <Icon name="fork_right" size={12} />
            {card.link.branch}
          </span>
        )}
        <div style={{ flex: 1 }} />
        <Hover as="span" onClick={close} title="Close review" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: 'var(--text-dim)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text)' }}>
          <Icon name="close" size={19} />
        </Hover>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ width: 230, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--bg)', overflowY: 'auto', padding: '8px 8px 16px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '6px 8px' }}>CHANGED FILES {files ? `· ${files.length}` : ''}</div>
          {files === null && <div style={{ padding: 10, fontSize: 12, color: 'var(--text-faint)' }}>Loading diff…</div>}
          {files?.length === 0 && (
            <div style={{ padding: 10, fontSize: 11.5, color: 'var(--text-faint)', lineHeight: 1.5 }}>
              No uncommitted changes to review in
              <div style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-muted)', marginTop: 4, wordBreak: 'break-all' }}>{cwd ?? '(no working tree)'}</div>
              <div style={{ marginTop: 6 }}>The agent may not have edited files, or the changes are elsewhere.</div>
            </div>
          )}
          {files?.map((f) => {
            const on = f.path === selected
            const cCount = comments.filter((c) => c.file === f.path).length
            return (
              <Hover key={f.path} onClick={() => setSelected(f.path)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: on ? 'var(--surface)' : 'transparent' }} hover={on ? undefined : { background: 'var(--surface)' }}>
                <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, fontWeight: 700, color: STAT_COLOR[f.status], width: 12, flexShrink: 0 }}>{STAT_GLYPH[f.status]}</span>
                <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: on ? 'var(--text)' : 'var(--text-dim)', fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'rtl', textAlign: 'left' }}>{f.path}</span>
                {cCount > 0 && <span style={{ fontSize: 9.5, color: 'var(--accent-hi)', background: 'var(--accent-soft)', borderRadius: 5, padding: '1px 5px' }}>{cCount}</span>}
              </Hover>
            )
          })}
        </div>

        <div style={{ flex: 1, minWidth: 0, background: 'var(--bg)' }}>
          {active ? (
            <DiffViewer key={active.path} path={active.path} original={active.oldContent} modified={active.newContent} onLine={setCurLine} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>
              {files === null ? 'Loading…' : 'No changes to review.'}
            </div>
          )}
        </div>

        <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', padding: '12px 14px 8px' }}>REVIEW COMMENTS</div>
          <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {comments.length === 0 && <div style={{ fontSize: 11.5, color: 'var(--text-faint)', padding: '4px 2px', lineHeight: 1.5 }}>Click a line in the diff, write a note, and add it. On “Request changes” they’re sent to the agent.</div>}
            {comments.map((c, i) => (
              <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, color: 'var(--accent-hi)', fontFamily: "'Geist Mono', monospace", flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.file.split('/').pop()}:{c.line}</span>
                  <Hover as="span" onClick={() => setComments((cs) => cs.filter((_, j) => j !== i))} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 15, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--danger)' }}>close</Hover>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.45 }}>{c.text}</div>
              </div>
            ))}
          </div>
          <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', padding: 10 }}>
            {selected && <div style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace", marginBottom: 5 }}>on {selected.split('/').pop()}:{curLine}</div>}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); addComment() } }}
              placeholder="Add a review note… (⌘Enter)"
              style={{ width: '100%', minHeight: 52, resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 8, padding: 9, color: 'var(--text-2)', fontSize: 12, lineHeight: 1.5, fontFamily: "'Geist Mono', monospace" }}
            />
            <Hover as="span" onClick={addComment} style={{ display: 'flex', justifyContent: 'center', marginTop: 7, padding: '7px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>Add comment</Hover>
          </div>
        </div>
      </div>

      <div style={{ height: 56, flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px' }}>
        {actionBtn('reviews', 'AI review', aiReview)}
        <div style={{ flex: 1 }} />
        {actionBtn('rate_review', comments.length ? `Request changes (${comments.length})` : 'Request changes', onRequestChanges, { disabled: comments.length === 0 })}
        {actionBtn('close', 'Decline', decline)}
        {actionBtn('check', 'Approve', approve, { accent: 'var(--accent)' })}
      </div>
    </div>
  )
}
