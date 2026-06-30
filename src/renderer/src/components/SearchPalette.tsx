import { useMemo } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

interface Result {
  id: string
  icon: string
  color: string
  title: string
  sub: string
  onOpen: () => void
}

export function SearchPalette() {
  const open = useStore((s) => s.paletteOpen)
  const query = useStore((s) => s.paletteQuery)
  const setQuery = useStore((s) => s.setPaletteQuery)
  const close = useStore((s) => s.closePalette)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const sessions = useStore((s) => s.sessions)
  const terminals = useStore((s) => s.terminals)
  const boards = useStore((s) => s.boards)
  const openSession = useStore((s) => s.openSession)
  const go = useStore((s) => s.go)
  const selectBoard = useStore((s) => s.selectBoard)
  const openCard = useStore((s) => s.openCard)

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const has = (s: string): boolean => !q || s.toLowerCase().includes(q)
    const out: Result[] = []

    sessions
      .filter((s) => s.wsId === wsId)
      .forEach((s) => {
        if (has(s.name) || has(s.branch))
          out.push({ id: `s${s.id}`, icon: 'grid_view', color: '#7cb3e6', title: s.name, sub: `Session · ${s.branch}`, onOpen: () => { openSession(s.id); close() } })
      })
    terminals
      .filter((t) => t.wsId === wsId)
      .forEach((t) => {
        if (has(t.name) || has(t.cwd))
          out.push({ id: `t${t.id}`, icon: 'terminal', color: '#5cc98a', title: t.name, sub: `Terminal · ${t.cwd}`, onOpen: () => { go('terminals'); close() } })
      })
    boards
      .filter((b) => b.wsId === wsId)
      .forEach((b) => {
        if (has(b.name))
          out.push({ id: `b${b.id}`, icon: 'view_kanban', color: '#b89cf0', title: b.name, sub: `Board · ${b.scope}`, onOpen: () => { selectBoard(b.id); go('board'); close() } })
        b.cards.forEach((c) => {
          if (has(c.title) || has(`#${c.code}`) || has(c.body))
            out.push({ id: `c${c.id}`, icon: 'sticky_note_2', color: '#e0b15e', title: c.title, sub: `Card #${c.code} · in board ${b.name}`, onOpen: () => { selectBoard(b.id); go('board'); openCard(c.id); close() } })
        })
      })
    return out.slice(0, 40)
  }, [query, sessions, terminals, boards, wsId, openSession, go, selectBoard, openCard, close])

  if (!open) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 65, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(4,4,6,0.55)', paddingTop: '12vh' }}>
      <div onClick={close} style={{ position: 'absolute', inset: 0 }} />
      <div style={{ position: 'relative', width: 560, maxHeight: '70%', background: '#0d0d11', border: '1px solid #25252d', borderRadius: 13, boxShadow: '0 30px 80px rgba(0,0,0,0.6)', animation: 'fadein .15s ease', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 15px', borderBottom: '1px solid #16161a' }}>
          <Icon name="search" size={17} color="#5f5f68" />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search sessions, terminals, boards, cards…" style={{ flex: 1, background: 'transparent', border: 'none', color: '#e8e8ee', fontSize: 14 }} />
          <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 10.5, color: '#56565e', background: '#16161c', padding: '1px 5px', borderRadius: 4 }}>ESC</span>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 6 }}>
          {results.length === 0 ? (
            <div style={{ padding: '24px 14px', textAlign: 'center', fontSize: 13, color: '#56565e' }}>No matches{query ? ` for “${query}”` : ''}.</div>
          ) : (
            results.map((r) => (
              <Hover key={r.id} onClick={r.onOpen} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 10px', borderRadius: 8, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
                <span style={{ width: 26, height: 26, borderRadius: 7, background: '#15151b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={r.icon} size={15} color={r.color} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                  <div style={{ fontSize: 11, color: '#6b6b74', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.sub}</div>
                </div>
                <Icon name="north_east" size={15} color="#4d4d55" />
              </Hover>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
