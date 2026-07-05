import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
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
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 18px',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{ws?.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('workspace.sessionsActive', '{{count}} sessions active', { count: activeCount })}</span>
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
                background: 'color-mix(in srgb, var(--ai) 10%, transparent)',
                border: '1px solid color-mix(in srgb, var(--ai) 22%, transparent)',
                color: 'var(--ai)',
                fontSize: 11,
                fontFamily: "'Geist Mono', monospace",
                cursor: 'pointer'
              }}
              hover={{ background: 'color-mix(in srgb, var(--ai) 18%, transparent)' }}
            >
              <Icon name="account_tree" size={13} />
              {t('workspace.worktreesCount', '{{count}} worktrees', { count: worktreesInUse })}
            </Hover>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
            {LAYOUTS.map((o) => {
              const on = layout === o.id
              return (
                <Hover
                  key={o.id}
                  as="span"
                  title={t(`workspace.layout_${o.id}`, o.label)}
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
                    color: on ? 'var(--on-accent)' : 'var(--text-dim)',
                    background: on ? 'var(--accent)' : 'transparent'
                  }}
                  hover={on ? undefined : { color: 'var(--text-2)' }}
                >
                  <Icon name={o.icon} size={16} />
                  {t(`workspace.layout_${o.id}`, o.label)}
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
              color: 'var(--on-accent)',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            hover={{ filter: 'brightness(1.08)' }}
          >
            <Icon name="add" size={16} />
            {t('workspace.newSession', 'New session')}
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
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="grid_view" size={24} color="var(--text-faint)" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{t('workspace.noSessionsIn', 'No sessions in {{name}}', { name: ws?.name })}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t('workspace.emptyHint', 'Start a session to begin working in this workspace.')}</div>
            </div>
            <Hover
              as="span"
              onClick={openNewSession}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}
              hover={{ filter: 'brightness(1.08)' }}
            >
              <Icon name="add" size={16} />
              {t('workspace.newSession', 'New session')}
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
              <span style={{ width: 3, height: 34, borderRadius: 3, background: 'var(--surface-3)' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
              {splitRight ? (
                <SessionCard session={splitRight} />
              ) : (
                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, color: 'var(--text-faint)', fontSize: 12.5, textAlign: 'center', padding: 20 }}>
                  {t('workspace.splitHint', 'Add another session to use Split.')}
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
                      color: on ? 'var(--text)' : 'var(--text-dim)',
                      background: on ? 'var(--surface)' : 'transparent',
                      border: on ? '1px solid var(--line-2)' : '1px solid transparent'
                    }}
                  >
                    <StatusDot status={s.status} />
                    {s.name}
                  </span>
                )
              })}
              <Hover as="span" onClick={openNewSession} title={t('workspace.newSession', 'New session')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, color: 'var(--accent-hi)', cursor: 'pointer', flexShrink: 0 }} hover={{ background: 'var(--surface)' }}>
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
