import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'
import type { ViewId } from '../../types'

interface NavItem {
  id: ViewId
  icon: string
  label: string
}

const NAV: NavItem[] = [
  { id: 'board', icon: 'view_kanban', label: 'Board' },
  { id: 'workspace', icon: 'grid_view', label: 'Sessions' },
  { id: 'terminals', icon: 'terminal', label: 'Terminals' },
  { id: 'worktrees', icon: 'account_tree', label: 'Worktrees' },
  { id: 'code', icon: 'code', label: 'Explore' },
  { id: 'history', icon: 'history', label: 'History' },
  { id: 'skills', icon: 'auto_awesome', label: 'Skills' },
  { id: 'settings', icon: 'tune', label: 'Settings' }
]

export function NavList() {
  const { t } = useTranslation()
  const view = useStore((s) => s.view)
  const go = useStore((s) => s.go)
  const sessions = useStore((s) => s.sessions)
  const terminals = useStore((s) => s.terminals)
  const boards = useStore((s) => s.boards)
  const wsId = useStore((s) => s.activeWorkspaceId)

  const runningOrWaiting = sessions.filter(
    (s) => s.wsId === wsId && s.live && s.status !== 'done'
  ).length
  const runningTerminals = terminals.filter((t) => t.wsId === wsId && t.running).length
  const wsBoards = boards.filter((b) => b.wsId === wsId)
  const cardCount = wsBoards.reduce((n, b) => n + b.cards.length, 0)

  const badgeFor = (id: ViewId): string | number | null => {
    if (id === 'board') return wsBoards.length ? `${wsBoards.length}/${cardCount}` : null
    if (id === 'workspace') return runningOrWaiting || null
    if (id === 'terminals') return runningTerminals || null
    return null
  }

  return (
    <div style={{ padding: '4px 12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {NAV.map((n) => {
        const active = view === n.id || (n.id === 'workspace' && view === 'session')
        const badge = badgeFor(n.id)
        return (
          <Hover
            key={n.id}
            onClick={() => go(n.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 11,
              padding: '8px 11px',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: active ? 500 : 450,
              color: active ? 'var(--text)' : 'var(--text-dim)',
              background: active ? 'var(--surface)' : 'transparent'
            }}
            hover={active ? undefined : { background: 'var(--surface)' }}
          >
            <Icon name={n.icon} size={19} color={active ? 'var(--accent,#5b9dd9)' : 'var(--text-muted)'} />
            <span style={{ flex: 1 }}>{t(`nav.${n.id}`, n.label)}</span>
            {badge != null && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--text-dim)',
                  background: 'var(--surface-2)',
                  padding: '1px 7px',
                  borderRadius: 9,
                  fontFamily: "'Geist Mono', monospace"
                }}
              >
                {badge}
              </span>
            )}
          </Hover>
        )
      })}
    </div>
  )
}
