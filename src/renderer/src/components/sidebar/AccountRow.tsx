import { useTranslation } from 'react-i18next'
import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'

const initials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase()
}

export function AccountRow() {
  const { t } = useTranslation()
  const go = useStore((s) => s.go)
  const userName = useStore((s) => s.userName)
  const openNameDialog = useStore((s) => s.openNameDialog)
  const openNotifications = useStore((s) => s.openNotifications)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const unviewed = useStore((s) => s.notifications.filter((n) => !n.viewed && (n.wsId === null || n.wsId === wsId)).length)
  const badge = unviewed > 9 ? '9+' : String(unviewed)

  return (
    <div style={{ display: 'flex', alignItems: 'center', borderTop: '1px solid var(--line)' }}>
      <Hover
        onClick={openNameDialog}
        title={t('accountRow.editName', 'Edit your name')}
        style={{ flex: 1, minWidth: 0, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        hover={{ background: 'var(--surface)' }}
      >
        <div style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text-2)', flexShrink: 0 }}>
          {initials(userName)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: userName ? 'var(--text-2)' : 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {userName || t('accountRow.setName', 'Set your name')}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>v{__APP_VERSION__}</div>
        </div>
      </Hover>
      <Hover as="span" onClick={openNotifications} title={t('accountRow.notifications', 'Notifications')} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 46, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>
        <Icon name="notifications" size={17} />
        {unviewed > 0 && (
          <span style={{ position: 'absolute', top: 9, right: 5, minWidth: 15, height: 15, padding: '0 4px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{badge}</span>
        )}
      </Hover>
      <Hover as="span" onClick={() => go('settings')} title={t('accountRow.settings', 'Settings')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 46, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ color: 'var(--text-2)' }}>
        <Icon name="settings" size={17} />
      </Hover>
    </div>
  )
}
