import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { StatusDot } from '../ui/StatusDot'
import { Pager } from '../ui/Pager'
import { SessionCard } from '../components/SessionCard'
import type { LayoutMode } from '../types'

const LAYOUTS: { id: LayoutMode; icon: string; label: string }[] = [
  { id: 'grid', icon: 'grid_view', label: 'Grid' },
  { id: 'tabs', icon: 'tab', label: 'Tabs' },
  { id: 'split', icon: 'splitscreen', label: 'Split' }
]

export function WorkspaceScreen() {
  const wsId = useStore((s) => s.activeWorkspaceId)
  const workspaces = useStore((s) => s.workspaces)
  const sessions = useStore((s) => s.sessions)
  const layout = useStore((s) => s.layout)
  const setLayout = useStore((s) => s.setLayout)
  const go = useStore((s) => s.go)
  const openNewSession = useStore((s) => s.openNewSession)
  const activeSessionId = useStore((s) => s.activeSessionId)
  const reorderSessions = useStore((s) => s.reorderSessions)
  const setActiveSession = useStore((s) => s.setActiveSession)
  const [dragId, setDragId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  const ws = workspaces.find((w) => w.id === wsId)
  const scoped = useMemo(() => sessions.filter((s) => s.wsId === wsId), [sessions, wsId])
  const activeCount = scoped.filter((s) => s.live && s.status !== 'done').length
  const worktreesInUse = scoped.filter((s) => s.worktree).length

  const [leftPct, setLeftPct] = useState(55)
  const [dragging, setDragging] = useState(false)
  const splitRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent): void => {
      const el = splitRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setLeftPct(Math.min(72, Math.max(28, pct)))
    }
    const onUp = (): void => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])
  const startDrag = (): void => setDragging(true)

  const active = scoped.find((s) => s.id === activeSessionId) ?? scoped[0]
  const splitRight = scoped.find((s) => s.id !== active?.id)

  const PER = 4
  const pageCount = Math.max(1, Math.ceil(scoped.length / PER))
  const clampedPage = Math.min(page, pageCount - 1)
  const pageItems = scoped.slice(clampedPage * PER, clampedPage * PER + PER)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          height: 53,
          flexShrink: 0,
          borderBottom: '1px solid #16161a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: '#ededf0' }}>{ws?.name}</span>
          <span style={{ fontSize: 12, color: '#6b6b74' }}>{activeCount} sessions active</span>
          {worktreesInUse > 0 && (
            <Hover
              as="span"
              onClick={() => go('worktrees')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 9px',
                borderRadius: 7,
                background: 'rgba(184,156,240,0.1)',
                border: '1px solid rgba(184,156,240,0.22)',
                color: '#b89cf0',
                fontSize: 11,
                fontFamily: "'Geist Mono', monospace",
                cursor: 'pointer'
              }}
              hover={{ background: 'rgba(184,156,240,0.18)' }}
            >
              <Icon name="account_tree" size={13} />
              {worktreesInUse} worktrees
            </Hover>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: '#0e0e12', border: '1px solid #1c1c22', borderRadius: 9, padding: 3, gap: 2 }}>
            {LAYOUTS.map((o) => {
              const on = layout === o.id
              return (
                <Hover
                  key={o.id}
                  as="span"
                  title={o.label}
                  onClick={() => setLayout(o.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 11px',
                    borderRadius: 7,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 500,
                    color: on ? '#0a1018' : '#8a8a93',
                    background: on ? 'var(--accent)' : 'transparent'
                  }}
                  hover={on ? undefined : { color: '#cfcfd6' }}
                >
                  <Icon name={o.icon} size={16} />
                  {o.label}
                </Hover>
              )
            })}
          </div>
          <Hover
            as="span"
            onClick={openNewSession}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 13px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#0a1018',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            <Icon name="add" size={16} />
            New session
          </Hover>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 16, position: 'relative' }}>
        {scoped.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              textAlign: 'center'
            }}
          >
            <div style={{ width: 46, height: 46, borderRadius: 12, background: '#101015', border: '1px solid #1d1d23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="grid_view" size={24} color="#56565e" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#cbcbd2' }}>No sessions in {ws?.name}</div>
              <div style={{ fontSize: 12, color: '#6b6b74', marginTop: 4 }}>Start a session to begin working in this workspace.</div>
            </div>
            <Hover
              as="span"
              onClick={openNewSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              hover={{ filter: 'brightness(1.08)' }}
            >
              <Icon name="add" size={16} />
              New session
            </Hover>
          </div>
        ) : layout === 'grid' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 10 }}>
            <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: pageItems.length < 2 ? '1fr' : '1fr 1fr', gridTemplateRows: pageItems.length > 2 ? '1fr 1fr' : '1fr', gap: 14 }}>
              {pageItems.map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onReorderStart={() => setDragId(s.id)}
                  onReorderDrop={() => {
                    if (dragId && dragId !== s.id) reorderSessions(dragId, s.id)
                    setDragId(null)
                  }}
                />
              ))}
            </div>
            <Pager page={clampedPage} pageCount={pageCount} setPage={setPage} />
          </div>
        ) : layout === 'split' ? (
          <div ref={splitRef} style={{ display: 'flex', height: '100%', minHeight: 0 }}>
            <div style={{ width: `${leftPct}%`, height: '100%', minWidth: 0 }}>
              {active && <SessionCard session={active} />}
            </div>
            <div onMouseDown={startDrag} style={{ width: 10, flexShrink: 0, cursor: 'col-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ width: 3, height: 34, borderRadius: 3, background: '#26262e' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
              {splitRight ? (
                <SessionCard session={splitRight} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0c0c0f', border: '1px solid #1b1b21', borderRadius: 12, color: '#56565e', fontSize: 12.5, textAlign: 'center', padding: 20 }}>
                  Add another session to use Split.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 10 }}>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, overflowX: 'auto' }}>
              {scoped.map((s) => {
                const on = s.id === active?.id
                return (
                  <span
                    key={s.id}
                    onClick={() => setActiveSession(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '6px 11px',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 500,
                      whiteSpace: 'nowrap',
                      color: on ? '#ededf0' : '#9a9aa3',
                      background: on ? '#15151b' : 'transparent',
                      border: on ? '1px solid #24242c' : '1px solid transparent'
                    }}
                  >
                    <StatusDot status={s.status} />
                    {s.name}
                  </span>
                )
              })}
              <Hover as="span" onClick={openNewSession} title="New session" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: 'var(--accent-hi)', cursor: 'pointer', flexShrink: 0 }} hover={{ background: '#15151b' }}>
                <Icon name="add" size={17} />
              </Hover>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>{active && <SessionCard session={active} />}</div>
          </div>
        )}
      </div>
    </div>
  )
}
