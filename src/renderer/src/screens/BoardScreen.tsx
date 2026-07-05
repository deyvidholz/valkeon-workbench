import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { LabelChip } from '../ui/LabelChip'
import { StatusDot, STATUS_LABEL, STATUS_COLOR } from '../ui/StatusDot'
import type { Card, ColumnId, ContextMenuItem } from '../types'

/** A short, clickable session reference, e.g. #a1b2c3. */
const shortId = (id: string): string => `#${id.slice(-6)}`

const COL_DOT: Record<ColumnId, string> = {
  backlog: '#6b6b74',
  todo: 'var(--text-dim)',
  'in-progress': '#5cc98a',
  'in-review': '#e0b15e',
  done: '#5b9dd9'
}

const excerpt = (body: string): string =>
  body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#>*`|_-]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
    .slice(0, 140)

export function BoardScreen() {
  const { t } = useTranslation()
  const boards = useStore((s) => s.boards)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const boardMenuOpen = useStore((s) => s.boardMenuOpen)
  const toggleBoardMenu = useStore((s) => s.toggleBoardMenu)
  const selectBoard = useStore((s) => s.selectBoard)
  const openNewBoard = useStore((s) => s.openNewBoard)
  const openLabelMgr = useStore((s) => s.openLabelMgr)
  const openGen = useStore((s) => s.openGen)
  const addCardTo = useStore((s) => s.addCardTo)
  const openCard = useStore((s) => s.openCard)
  const openReview = useStore((s) => s.openReview)
  const startTask = useStore((s) => s.startTask)
  const openSession = useStore((s) => s.openSession)
  const sessions = useStore((s) => s.sessions)
  const moveCardTo = useStore((s) => s.moveCardTo)
  const moveCard = useStore((s) => s.moveCard)
  const reorderColumns = useStore((s) => s.reorderColumns)
  const deleteCard = useStore((s) => s.deleteCard)
  const duplicateCard = useStore((s) => s.duplicateCard)
  const openContextMenu = useStore((s) => s.openContextMenu)
  const [drag, setDrag] = useState<{ kind: 'card' | 'column'; id: string } | null>(null)

  const wsBoards = useMemo(() => boards.filter((b) => b.wsId === wsId), [boards, wsId])
  const board = boards.find((b) => b.id === activeBoardId) ?? wsBoards[0]

  if (!board) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="view_kanban" size={24} color="var(--text-faint)" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{t('board.noBoards', 'No boards yet')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t('board.createBoardHint', 'Create a board to plan work in this workspace.')}</div>
        </div>
        <Hover as="span" onClick={openNewBoard} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="add" size={16} />{t('board.newBoard', 'New board')}
        </Hover>
      </div>
    )
  }

  const labelOf = (id: string) => board.labels.find((l) => l.id === id)

  const cardAction = (card: Card): { label: string; icon: string; accent?: boolean; onClick: () => void } | null => {
    if (card.column === 'backlog' || card.column === 'todo')
      return { label: t('board.startTask', 'Start task'), icon: 'rocket_launch', accent: true, onClick: () => startTask(card.id) }
    if (card.column === 'in-progress' && card.sessionId)
      return { label: t('board.openSession', 'Open session'), icon: 'open_in_full', onClick: () => card.sessionId && openSession(card.sessionId) }
    if (card.column === 'in-review') return { label: t('board.reviewDiff', 'Review diff'), icon: 'difference', onClick: () => openReview(card.id) }
    return null
  }

  const openCardMenu = (e: React.MouseEvent, card: Card): void => {
    e.preventDefault()
    e.stopPropagation()
    const action = cardAction(card)
    const items: ContextMenuItem[] = [
      { label: t('cardMenu.open', 'Open card'), icon: 'open_in_new', onClick: () => openCard(card.id) },
      ...(action ? [{ label: action.label, icon: action.icon, onClick: action.onClick }] : []),
      {
        label: t('cardMenu.moveTo', 'Move to'),
        icon: 'moving',
        submenu: board.columns.map((c) => ({
          label: c.name,
          icon: card.column === c.id ? 'check' : 'chevron_right',
          disabled: card.column === c.id,
          onClick: () => moveCard(card.id, c.id)
        }))
      },
      { label: t('cardMenu.duplicate', 'Duplicate card'), icon: 'content_copy', onClick: () => duplicateCard(card.id) },
      { divider: true, label: '', icon: '' },
      { label: t('cardMenu.delete', 'Delete card'), icon: 'delete', danger: true, onClick: () => deleteCard(card.id) }
    ]
    openContextMenu(e.clientX, e.clientY, items)
  }

  const headerBtn = (icon: string, label: string, onClick: () => void): React.ReactNode => (
    <Hover as="span" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
      <Icon name={icon} size={16} />{label}
    </Hover>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, borderBottom: '1px solid #16161a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <Hover as="span" onClick={() => toggleBoardMenu()} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '6px 11px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)' }} hover={{ border: '1px solid var(--line-2)' }}>
            <Icon name="view_kanban" size={18} color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{board.name}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '1px 6px', borderRadius: 5, textTransform: 'capitalize' }}>{board.scope}</span>
            <Icon name="expand_more" size={18} color="var(--text-faint)" />
          </Hover>
          {boardMenuOpen && (
            <>
              <div onClick={() => toggleBoardMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
              <div style={{ position: 'absolute', top: 48, left: 0, zIndex: 30, width: 288, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 11, padding: 6, boxShadow: '0 20px 54px var(--shadow)' }}>
                {wsBoards.map((b) => {
                  const on = b.id === board.id
                  return (
                    <Hover key={b.id} onClick={() => selectBoard(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: on ? 'var(--surface)' : 'transparent' }} hover={{ background: 'var(--surface-2)' }}>
                      <Icon name="view_kanban" size={17} color={on ? 'var(--accent)' : 'var(--text-muted)'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{t('board.nCards', '{{count}} cards', { count: b.cards.length })} · {b.scope}</div>
                      </div>
                      {on && <Icon name="check" size={16} color="var(--accent)" />}
                    </Hover>
                  )
                })}
                <div style={{ height: 1, background: 'var(--line)', margin: '5px 8px' }} />
                <Hover onClick={openNewBoard} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', color: 'var(--text-dim)', fontSize: 13 }} hover={{ background: 'var(--surface-2)' }}>
                  <Icon name="add" size={17} />{t('board.newBoard', 'New board')}
                </Hover>
              </div>
            </>
          )}
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {t('board.nCards', '{{count}} cards', { count: board.cards.length })} · {t('board.base', 'base')} <span style={{ fontFamily: "'Geist Mono', monospace", color: 'var(--text-dim)' }}>{board.baseBranch}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {headerBtn('label', t('board.labels', 'Labels'), openLabelMgr)}
          <Hover as="span" onClick={openGen} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent-hi)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
            <Icon name="auto_awesome" size={16} />{t('board.generateCards', 'Generate cards')}
          </Hover>
          {headerBtn('add', t('board.newCard', 'New card'), () => addCardTo('backlog'))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'hidden', padding: 16 }}>
        <div style={{ display: 'flex', gap: 14, height: '100%', alignItems: 'stretch' }}>
          {board.columns.map((col) => {
            const cards = board.cards.filter((c) => c.column === col.id).sort((a, b) => (a.order < b.order ? -1 : 1))
            return (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (drag?.kind === 'column' && drag.id !== col.id) reorderColumns(drag.id, col.id)
                  setDrag(null)
                }}
                style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12 }}
              >
                <div
                  draggable
                  onDragStart={() => setDrag({ kind: 'column', id: col.id })}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 13px 10px', cursor: 'grab' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: COL_DOT[col.id], display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)' }}>{col.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>{cards.length}</span>
                  <div style={{ flex: 1 }} />
                  <Hover as="span" onClick={() => addCardTo(col.id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 16, color: 'var(--text-faint)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>add</Hover>
                </div>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.stopPropagation()
                    if (drag?.kind === 'card') moveCardTo(drag.id, col.id, null)
                    setDrag(null)
                  }}
                  style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '2px 10px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}
                >
                  {cards.map((card) => {
                    const action = cardAction(card)
                    const ex = excerpt(card.body)
                    return (
                      <Hover
                        key={card.id}
                        onClick={() => openCard(card.id)}
                        onContextMenu={(e) => openCardMenu(e, card)}
                        draggable
                        onDragStart={(e) => {
                          e.stopPropagation()
                          setDrag({ kind: 'card', id: card.id })
                        }}
                        onDragOver={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                        onDrop={(e) => {
                          e.stopPropagation()
                          if (drag?.kind === 'card' && drag.id !== card.id) moveCardTo(drag.id, card.column, card.id)
                          setDrag(null)
                        }}
                        style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 10, padding: '11px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadein .25s ease' }}
                        hover={{ border: '1px solid var(--line-2)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {card.labels.map((id) => {
                            const l = labelOf(id)
                            return l ? <LabelChip key={id} name={l.name} color={l.color} /> : null
                          })}
                          <div style={{ flex: 1 }} />
                          {card.attachments.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>
                              <Icon name="attach_file" size={13} />{card.attachments.length}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>#{card.code}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', lineHeight: 1.35 }}>{card.title}</div>
                        {ex && <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex}</div>}
                        {(card.link.branch || card.link.worktree) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {card.link.branch && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Geist Mono', monospace", fontSize: 10, color: 'var(--text-dim)', background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '2px 6px', borderRadius: 5 }}>
                                <Icon name="fork_right" size={12} />{card.link.branch}
                              </span>
                            )}
                            {card.link.worktree && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Geist Mono', monospace", fontSize: 10, color: 'var(--ai)', background: 'color-mix(in srgb, var(--ai) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--ai) 22%, transparent)', padding: '2px 6px', borderRadius: 5 }}>
                                <Icon name="account_tree" size={12} />{t('board.worktree', 'worktree')}
                              </span>
                            )}
                          </div>
                        )}
                        {card.agent && card.sessionId && (() => {
                          const sess = sessions.find((s) => s.id === card.sessionId)
                          const status = sess?.status
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: status ? STATUS_COLOR[status] : 'var(--text-muted)' }}>
                              {status ? <StatusDot status={status} size={6} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--surface-4)', flexShrink: 0 }} />}
                              {status ? STATUS_LABEL[status] : t('board.sessionEnded', 'Session ended')}
                              <span
                                onClick={(e) => { e.stopPropagation(); openSession(card.sessionId as string) }}
                                title={t('board.openSession', 'Open session')}
                                style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10, color: 'var(--accent-hi)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 2 }}
                              >
                                {shortId(card.sessionId)}
                              </span>
                            </div>
                          )
                        })()}
                        {action && (
                          <Hover
                            as="span"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: action.accent ? 'var(--accent)' : 'var(--surface)', color: action.accent ? 'var(--on-accent)' : 'var(--text-2)', border: action.accent ? 'none' : '1px solid var(--line-2)' }}
                            hover={action.accent ? { filter: 'brightness(1.08)' } : { background: 'var(--surface-3)' }}
                          >
                            <span
                              onClick={(e) => {
                                e.stopPropagation()
                                action.onClick()
                              }}
                              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                            >
                              <Icon name={action.icon} size={14} />
                              {action.label}
                            </span>
                          </Hover>
                        )}
                      </Hover>
                    )
                  })}
                  {cards.length === 0 && (
                    <div style={{ fontSize: 11.5, color: '#3f3f47', textAlign: 'center', padding: '16px 0', border: '1px dashed var(--line)', borderRadius: 9 }}>{t('board.noCards', 'No cards')}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
