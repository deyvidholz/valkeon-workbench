import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { LabelChip } from '../ui/LabelChip'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { rgba } from '../lib/color'
import type { Card, ColumnId } from '../types'

const COL_COLOR: Record<ColumnId, string> = {
  backlog: '#6b6b74',
  todo: '#5b9dd9',
  'in-progress': '#5cc98a',
  'in-review': '#e0b15e',
  done: '#b89cf0'
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function CardDrawer() {
  const drawerCardId = useStore((s) => s.drawerCardId)
  const boards = useStore((s) => s.boards)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const sessions = useStore((s) => s.sessions)
  const labelMenuOpen = useStore((s) => s.labelMenuOpen)
  const toggleLabelMenu = useStore((s) => s.toggleLabelMenu)
  const toggleCardLabel = useStore((s) => s.toggleCardLabel)
  const openLabelMgr = useStore((s) => s.openLabelMgr)
  const updateCard = useStore((s) => s.updateCard)
  const deleteCard = useStore((s) => s.deleteCard)
  const moveCard = useStore((s) => s.moveCard)
  const startTask = useStore((s) => s.startTask)
  const openSession = useStore((s) => s.openSession)
  const closeDrawer = useStore((s) => s.closeDrawer)
  const askConfirm = useStore((s) => s.askConfirm)

  const board = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => b.wsId === wsId)
  const card: Card | undefined = board?.cards.find((c) => c.id === drawerCardId)

  // Title/body are edited as a local draft and only written on Save (no autosave).
  const [dTitle, setDTitle] = useState('')
  const [dBody, setDBody] = useState('')
  useEffect(() => {
    if (card) {
      setDTitle(card.title)
      setDBody(card.body)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerCardId])

  if (!drawerCardId || !board || !card) return null

  const dirty = dTitle !== card.title || dBody !== card.body
  const titleOk = dTitle.trim() !== '' && dTitle.trim() !== 'New card'
  const saved = titleOk && !dirty
  const save = (): void => {
    if (!titleOk) return
    updateCard(card.id, { title: dTitle.trim(), body: dBody })
  }

  const colColor = COL_COLOR[card.column]
  const colName = board.columns.find((c) => c.id === card.column)?.name ?? card.column
  const session = card.sessionId ? sessions.find((s) => s.id === card.sessionId) : undefined
  const labelOf = (id: string) => board.labels.find((l) => l.id === id)

  const onAttach = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    updateCard(card.id, { attachments: [...card.attachments, ...files.map((f) => ({ name: f.name, size: f.size }))] })
    e.target.value = ''
  }
  const removeAttachment = (name: string): void => {
    askConfirm({
      title: 'Remove attachment',
      message: `Remove “${name}” from this card?`,
      confirmLabel: 'Remove',
      onConfirm: () => updateCard(card.id, { attachments: card.attachments.filter((a) => a.name !== name) })
    })
  }

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--scrim)', padding: 32 }}>
      <div onClick={closeDrawer} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', width: 720, maxHeight: '90%', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 14, display: 'flex', flexDirection: 'column', animation: 'fadein .2s ease', boxShadow: '0 30px 90px var(--shadow)', overflow: 'hidden' }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderBottom: '1px solid var(--line)' }}>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>#{card.code}</span>
          <span style={{ fontSize: 10.5, fontWeight: 600, color: colColor, background: rgba(colColor, 0.13), border: `1px solid ${rgba(colColor, 0.3)}`, padding: '2px 8px', borderRadius: 5 }}>{colName}</span>
          <div style={{ flex: 1 }} />
          <Hover as="span" onClick={() => deleteCard(card.id)} title="Delete card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: '#1a1216', color: 'var(--danger)' }}>
            <Icon name="delete_outline" size={18} />
          </Hover>
          <Hover as="span" onClick={closeDrawer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            <Icon name="close" size={19} />
          </Hover>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 18px 26px' }}>
          <input value={dTitle} onChange={(e) => setDTitle(e.target.value)} placeholder="Card title" style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 18, fontWeight: 600, marginBottom: 12 }} />

          <div style={{ position: 'relative', marginBottom: 18 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {card.labels.map((id) => {
                const l = labelOf(id)
                return l ? <LabelChip key={id} name={l.name} color={l.color} onRemove={() => toggleCardLabel(id)} /> : null
              })}
              <span onClick={() => toggleLabelMenu()} style={{ display: 'inline-flex', alignItems: 'center', gap: 3, height: 18, boxSizing: 'border-box', fontSize: 9.5, fontWeight: 600, color: 'var(--text-dim)', background: 'var(--surface)', border: '1px dashed var(--line-2)', padding: '0 7px', borderRadius: 5, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <Icon name="add" size={12} />Label
              </span>
            </div>
            {labelMenuOpen && (
              <>
                <div onClick={() => toggleLabelMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 19 }} />
                <div style={{ position: 'absolute', top: 30, left: 0, zIndex: 20, width: 230, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 6, boxShadow: '0 16px 44px var(--shadow)' }}>
                  {board.labels.map((l) => {
                    const applied = card.labels.includes(l.id)
                    return (
                      <Hover key={l.id} onClick={() => toggleCardLabel(l.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 7, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: l.color, flexShrink: 0 }} />
                        <span style={{ flex: 1, fontSize: 12, color: 'var(--text-2)', textTransform: 'capitalize' }}>{l.name}</span>
                        {applied && <Icon name="check" size={15} color="var(--accent)" />}
                      </Hover>
                    )
                  })}
                  <div style={{ height: 1, background: 'var(--line)', margin: '4px 6px' }} />
                  <Hover onClick={openLabelMgr} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 12 }} hover={{ background: 'var(--surface-2)' }}>
                    <Icon name="settings" size={15} />Manage labels
                  </Hover>
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>COLUMN</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 20 }}>
            {board.columns.map((col) => {
              const on = col.id === card.column
              return (
                <span key={col.id} onClick={() => moveCard(card.id, col.id)} style={{ padding: '5px 11px', borderRadius: 7, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', color: on ? 'var(--on-accent)' : 'var(--text-dim)', background: on ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${on ? 'transparent' : 'var(--line)'}` }}>
                  {col.name}
                </span>
              )
            })}
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>LINKED WORK</div>
          {card.link.branch || card.link.worktree || session ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {card.link.branch && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name="fork_right" size={16} color="var(--text-dim)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70 }}>Branch</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace" }}>{card.link.branch}</span>
                </div>
              )}
              {card.link.worktree && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <Icon name="account_tree" size={16} color="var(--ai)" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70 }}>Worktree</span>
                  <span style={{ fontSize: 11.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace", flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.link.worktree}</span>
                </div>
              )}
              {session && (
                <Hover onClick={() => openSession(session.id)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--ok)', display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 70 }}>Session</span>
                  <span style={{ fontSize: 11.5, color: 'var(--accent-hi)', fontFamily: "'Geist Mono', monospace" }}>{session.name}</span>
                </Hover>
              )}
            </div>
          ) : (
            <div style={{ marginBottom: 20 }}>
              <Hover as="span" onClick={() => saved && startTask(card.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: 10, borderRadius: 9, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 13, fontWeight: 600, cursor: saved ? 'pointer' : 'not-allowed', opacity: saved ? 1 : 0.45 }} hover={saved ? { filter: 'brightness(1.08)' } : {}}>
                <Icon name="rocket_launch" size={17} />Start task
              </Hover>
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 7, textAlign: 'center' }}>
                {saved ? 'Creates a branch + worktree and hands the card to the agent' : 'Save the card first to start a task'}
              </div>
            </div>
          )}

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 8 }}>DESCRIPTION</div>
          <MarkdownEditor
            key={card.id}
            value={dBody}
            onChange={setDBody}
            placeholder="Write the task in markdown…  **bold**  *italic*  - [ ] todo  ```mermaid …"
          />

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '22px 0 9px' }}>ATTACHMENTS</div>
          {card.attachments.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {card.attachments.map((at) => (
                <div key={at.name} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line)' }}>
                  <Icon name="description" size={17} color="var(--text-dim)" />
                  <span style={{ flex: 1, minWidth: 0, fontSize: 12, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{at.name}</span>
                  <span style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>{formatSize(at.size)}</span>
                  <Hover as="span" onClick={() => removeAttachment(at.name)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 16, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--danger)' }}>close</Hover>
                </div>
              ))}
            </div>
          )}
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            <Icon name="attach_file" size={16} />Add attachment
            <input type="file" multiple onChange={onAttach} style={{ display: 'none' }} />
          </label>

          {card.activity.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '22px 0 11px' }}>ACTIVITY</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {card.activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                    <Icon name={a.icon} size={15} color={a.color ?? 'var(--text-dim)'} style={{ marginTop: 1 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.4 }}>{a.text}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 1 }}>{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ fontSize: 11.5, color: dirty ? 'var(--warn)' : 'var(--ok)' }}>
            {dirty ? 'Unsaved changes' : titleOk ? 'Saved' : ''}
          </span>
          <div style={{ flex: 1 }} />
          <Hover as="span" onClick={closeDrawer} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>Close</Hover>
          <Hover as="span" onClick={() => (titleOk && dirty ? save() : undefined)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: titleOk && dirty ? 'pointer' : 'not-allowed', opacity: titleOk && dirty ? 1 : 0.5 }} hover={titleOk && dirty ? { filter: 'brightness(1.08)' } : {}}>
            <Icon name="check" size={16} />Save card
          </Hover>
        </div>
      </div>
    </div>
  )
}
