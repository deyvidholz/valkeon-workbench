import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { LabelChip } from '../ui/LabelChip'
import { StatusDot, STATUS_LABEL, STATUS_COLOR } from '../ui/StatusDot'
import type { Card, ColumnId } from '../types'

/** A short, clickable session reference, e.g. #a1b2c3. */
const shortId = (id: string): string => `#${id.slice(-6)}`

const COL_DOT: Record<ColumnId, string> = {
  backlog: '#6b6b74',
  todo: '#8a8a93',
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
  const startTask = useStore((s) => s.startTask)
  const openSession = useStore((s) => s.openSession)
  const sessions = useStore((s) => s.sessions)
  const moveCardTo = useStore((s) => s.moveCardTo)
  const reorderColumns = useStore((s) => s.reorderColumns)
  const [drag, setDrag] = useState<{ kind: 'card' | 'column'; id: string } | null>(null)

  const wsBoards = useMemo(() => boards.filter((b) => b.wsId === wsId), [boards, wsId])
  const board = boards.find((b) => b.id === activeBoardId) ?? wsBoards[0]

  if (!board) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, textAlign: 'center' }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#101015', border: '1px solid #1d1d23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="view_kanban" size={24} color="#56565e" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#cbcbd2' }}>No boards yet</div>
          <div style={{ fontSize: 12, color: '#6b6b74', marginTop: 4 }}>Create a board to plan work in this workspace.</div>
        </div>
        <Hover as="span" onClick={openNewBoard} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="add" size={16} />New board
        </Hover>
      </div>
    )
  }

  const labelOf = (id: string) => board.labels.find((l) => l.id === id)

  const cardAction = (card: Card): { label: string; icon: string; accent?: boolean; onClick: () => void } | null => {
    if (card.column === 'backlog' || card.column === 'todo')
      return { label: 'Start task', icon: 'rocket_launch', accent: true, onClick: () => startTask(card.id) }
    if (card.column === 'in-progress' && card.sessionId)
      return { label: 'Open session', icon: 'open_in_full', onClick: () => card.sessionId && openSession(card.sessionId) }
    if (card.column === 'in-review') return { label: 'Review diff', icon: 'difference', onClick: () => openCard(card.id) }
    return null
  }

  const headerBtn = (icon: string, label: string, onClick: () => void): React.ReactNode => (
    <Hover as="span" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 8, background: '#121216', border: '1px solid #232329', color: '#cbcbd2', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
      <Icon name={icon} size={16} />{label}
    </Hover>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ flexShrink: 0, borderBottom: '1px solid #16161a', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, position: 'relative' }}>
          <Hover as="span" onClick={() => toggleBoardMenu()} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', padding: '6px 11px', borderRadius: 9, background: '#0e0e12', border: '1px solid #1c1c22' }} hover={{ border: '1px solid #27272f' }}>
            <Icon name="view_kanban" size={18} color="var(--accent)" />
            <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0' }}>{board.name}</span>
            <span style={{ fontSize: 10, color: '#6b6b74', fontFamily: "'Geist Mono', monospace", background: '#141419', border: '1px solid #222229', padding: '1px 6px', borderRadius: 5, textTransform: 'capitalize' }}>{board.scope}</span>
            <Icon name="expand_more" size={18} color="#56565e" />
          </Hover>
          {boardMenuOpen && (
            <>
              <div onClick={() => toggleBoardMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 29 }} />
              <div style={{ position: 'absolute', top: 48, left: 0, zIndex: 30, width: 288, background: '#101014', border: '1px solid #25252d', borderRadius: 11, padding: 6, boxShadow: '0 20px 54px rgba(0,0,0,0.55)' }}>
                {wsBoards.map((b) => {
                  const on = b.id === board.id
                  return (
                    <Hover key={b.id} onClick={() => selectBoard(b.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', background: on ? '#15151b' : 'transparent' }} hover={{ background: '#17171c' }}>
                      <Icon name="view_kanban" size={17} color={on ? 'var(--accent)' : '#74747d'} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>{b.name}</div>
                        <div style={{ fontSize: 10.5, color: '#6b6b74' }}>{b.cards.length} cards · {b.scope}</div>
                      </div>
                      {on && <Icon name="check" size={16} color="var(--accent)" />}
                    </Hover>
                  )
                })}
                <div style={{ height: 1, background: '#1d1d23', margin: '5px 8px' }} />
                <Hover onClick={openNewBoard} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 10px', borderRadius: 8, cursor: 'pointer', color: '#9a9aa3', fontSize: 13 }} hover={{ background: '#17171c' }}>
                  <Icon name="add" size={17} />New board
                </Hover>
              </div>
            </>
          )}
          <span style={{ fontSize: 12, color: '#6b6b74' }}>
            {board.cards.length} cards · base <span style={{ fontFamily: "'Geist Mono', monospace", color: '#8a8a93' }}>{board.baseBranch}</span>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {headerBtn('label', 'Labels', openLabelMgr)}
          <Hover as="span" onClick={openGen} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent-hi)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ background: 'var(--accent)', color: '#0a1018' }}>
            <Icon name="auto_awesome" size={16} />Generate cards
          </Hover>
          {headerBtn('add', 'New card', () => addCardTo('backlog'))}
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
                style={{ width: 264, flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0a0a0d', border: '1px solid #15151a', borderRadius: 12 }}
              >
                <div
                  draggable
                  onDragStart={() => setDrag({ kind: 'column', id: col.id })}
                  style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 13px 10px', cursor: 'grab' }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: COL_DOT[col.id], display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#cbcbd2' }}>{col.name}</span>
                  <span style={{ fontSize: 11, color: '#62626b', fontFamily: "'Geist Mono', monospace" }}>{cards.length}</span>
                  <div style={{ flex: 1 }} />
                  <Hover as="span" onClick={() => addCardTo(col.id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 16, color: '#56565e', cursor: 'pointer' }} hover={{ color: '#cfcfd6' }}>add</Hover>
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
                        style={{ background: '#0e0e13', border: '1px solid #1d1d23', borderRadius: 10, padding: '11px 12px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 8, animation: 'fadein .25s ease' }}
                        hover={{ border: '1px solid #2c2c35' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {card.labels.map((id) => {
                            const l = labelOf(id)
                            return l ? <LabelChip key={id} name={l.name} color={l.color} /> : null
                          })}
                          <div style={{ flex: 1 }} />
                          {card.attachments.length > 0 && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, color: '#6b6b74', fontFamily: "'Geist Mono', monospace" }}>
                              <Icon name="attach_file" size={13} />{card.attachments.length}
                            </span>
                          )}
                          <span style={{ fontSize: 10, color: '#56565e', fontFamily: "'Geist Mono', monospace" }}>#{card.code}</span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e4e4ea', lineHeight: 1.35 }}>{card.title}</div>
                        {ex && <div style={{ fontSize: 11.5, color: '#73737c', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ex}</div>}
                        {(card.link.branch || card.link.worktree) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {card.link.branch && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Geist Mono', monospace", fontSize: 10, color: '#8a8a93', background: '#141419', border: '1px solid #222229', padding: '2px 6px', borderRadius: 5 }}>
                                <Icon name="fork_right" size={12} />{card.link.branch}
                              </span>
                            )}
                            {card.link.worktree && (
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: "'Geist Mono', monospace", fontSize: 10, color: '#b89cf0', background: 'rgba(184,156,240,0.1)', border: '1px solid rgba(184,156,240,0.22)', padding: '2px 6px', borderRadius: 5 }}>
                                <Icon name="account_tree" size={12} />worktree
                              </span>
                            )}
                          </div>
                        )}
                        {card.agent && card.sessionId && (() => {
                          const sess = sessions.find((s) => s.id === card.sessionId)
                          const status = sess?.status
                          return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: status ? STATUS_COLOR[status] : '#73737c' }}>
                              {status ? <StatusDot status={status} size={6} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3a3a42', flexShrink: 0 }} />}
                              {status ? STATUS_LABEL[status] : 'Session ended'}
                              <span
                                onClick={(e) => { e.stopPropagation(); openSession(card.sessionId as string) }}
                                title="Open session"
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
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px', borderRadius: 7, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', background: action.accent ? 'var(--accent)' : '#15151b', color: action.accent ? '#0a1018' : '#cbcbd2', border: action.accent ? 'none' : '1px solid #232329' }}
                            hover={action.accent ? { filter: 'brightness(1.08)' } : { background: '#1c1c24' }}
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
                    <div style={{ fontSize: 11.5, color: '#3f3f47', textAlign: 'center', padding: '16px 0', border: '1px dashed #1c1c22', borderRadius: 9 }}>No cards</div>
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
