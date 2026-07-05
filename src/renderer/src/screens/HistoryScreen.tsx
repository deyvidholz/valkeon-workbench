import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import type { HistoryEntry, HistoryKind } from '../types'

const FILTERS: { id: 'all' | HistoryKind; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'session', label: 'Sessions' },
  { id: 'terminal', label: 'Terminals' },
  { id: 'card', label: 'Board' }
]

function rel(
  ts: number,
  t: (key: string, def: string, opts?: Record<string, unknown>) => string
): string {
  const s = Math.floor((Date.now() - ts) / 1000)
  if (s < 60) return t('history.now', 'now')
  if (s < 3600) return t('history.minutesShort', '{{count}}m', { count: Math.floor(s / 60) })
  if (s < 86400) return t('history.hoursShort', '{{count}}h', { count: Math.floor(s / 3600) })
  return t('history.daysShort', '{{count}}d', { count: Math.floor(s / 86400) })
}

export function HistoryScreen() {
  const history = useStore((s) => s.history)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const project = useStore((s) => s.project)
  const sessions = useStore((s) => s.sessions)
  const boards = useStore((s) => s.boards)
  const openSession = useStore((s) => s.openSession)
  const selectBoard = useStore((s) => s.selectBoard)
  const openCard = useStore((s) => s.openCard)
  const go = useStore((s) => s.go)
  const { t } = useTranslation()
  const [filter, setFilter] = useState<'all' | HistoryKind>('all')

  const items = useMemo(
    () => history.filter((h) => h.wsId === wsId && (filter === 'all' || h.kind === filter || (filter === 'card' && (h.kind === 'card' || h.kind === 'board' || h.kind === 'label')))),
    [history, wsId, filter]
  )

  const open = (h: HistoryEntry): void => {
    if (!h.target) return
    if (h.target.kind === 'session' && sessions.some((s) => s.id === h.target!.id)) openSession(h.target.id)
    else if (h.target.kind === 'board' && boards.some((b) => b.id === h.target!.id)) {
      selectBoard(h.target.id)
      go('board')
    } else if (h.target.kind === 'card' && h.target.boardId) {
      selectBoard(h.target.boardId)
      go('board')
      openCard(h.target.id)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '20px 24px 13px', borderBottom: '1px solid var(--line)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('history.title', 'History')}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3 }}>{t('history.subtitle', 'Everything you do in {{name}}', { name: project?.name ?? t('history.thisProject', 'this project') })}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 15 }}>
          {FILTERS.map((f) => {
            const on = filter === f.id
            return (
              <Hover key={f.id} as="span" onClick={() => setFilter(f.id)} style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: on ? 'var(--text)' : 'var(--text-dim)', background: on ? 'var(--surface)' : 'transparent', border: on ? '1px solid var(--line-2)' : '1px solid transparent' }} hover={on ? undefined : { background: 'var(--surface)' }}>
                {t(`history.filter_${f.id}`, f.label)}
              </Hover>
            )
          })}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px 28px', minHeight: 0 }}>
        {items.length === 0 ? (
          <div style={{ minHeight: '60%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="history" size={24} color="var(--text-faint)" />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-dim)' }}>{t('history.empty', 'No activity yet. Sessions, terminals, and board changes show up here.')}</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)', padding: '4px 12px 4px' }}>{t('history.recentActivity', 'RECENT ACTIVITY')}</div>
            {items.map((h) => (
              <Hover key={h.id} onClick={() => open(h)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 12, borderRadius: 9, cursor: h.target ? 'pointer' : 'default' }} hover={{ background: 'var(--surface)' }}>
                <span style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={h.icon} size={16} color={h.color ?? 'var(--text-dim)'} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.label}</div>
                  {h.detail && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace", marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.detail}</div>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace", flexShrink: 0 }}>{rel(h.ts, t)}</span>
              </Hover>
            ))}
          </>
        )}
      </div>
    </div>
  )
}
