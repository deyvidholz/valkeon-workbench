import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function AccountRow() {
  const go = useStore((s) => s.go)
  const userName = useStore((s) => s.userName)
  const openNameDialog = useStore((s) => s.openNameDialog)

  return (
    <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--line)' }}>
      <Hover
        onClick={openNameDialog}
        title="Edit your name"
        style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        hover={{ background: 'var(--surface)' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', flexShrink: 0 }}>
          {initials(userName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: userName ? 'var(--text-2)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName || 'Set your name'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>v{__APP_VERSION__}</div>
        </div>
      </Hover>
      <Hover as="span" onClick={() => go('settings')} title="Settings" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 46, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>
        <Icon name="settings" size={17} />
      </Hover>
    </div>
  )
}
