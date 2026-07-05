import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import i18next from '../i18n'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { VirtualList } from '../ui/VirtualList'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { relativeTime } from '../lib/time'
import type { NotificationRecord, NotificationKind } from '@shared/notifications'

const KIND_ICON: Record<NotificationKind, string> = {
  session: 'smart_toy',
  'worktree-cleanup': 'account_tree',
  system: 'info'
}

export function NotificationsDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.notificationsOpen)
  const close = useStore((s) => s.closeNotifications)
  const all = useStore((s) => s.notifications)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const markAll = useStore((s) => s.markAllNotificationsViewed)
  const clearAll = useStore((s) => s.clearNotifications)
  const runAction = useStore((s) => s.runNotificationAction)

  // Scope to the active workspace (plus project-wide, wsId === null), newest first.
  const items = useMemo(
    () => all.filter((n) => n.wsId === null || n.wsId === wsId).sort((a, b) => b.createdAt - a.createdAt),
    [all, wsId]
  )
  const anyUnviewed = items.some((n) => !n.viewed)
  if (!open) return null

  const row = (n: NotificationRecord): React.ReactNode => {
    const clickable = n.action.type !== 'none'
    return (
      <Hover
        onClick={() => clickable && runAction(n.id)}
        style={{ display: 'flex', gap: 11, alignItems: 'flex-start', padding: '11px 16px', borderBottom: '1px solid var(--line)', cursor: clickable ? 'pointer' : 'default' }}
        hover={clickable ? { background: 'var(--surface-2)' } : {}}
      >
        <div style={{ position: 'relative', flexShrink: 0, marginTop: 1 }}>
          <Icon name={KIND_ICON[n.kind]} size={17} color={n.viewed ? 'var(--text-muted)' : 'var(--accent-hi)'} />
          {!n.viewed && <span style={{ position: 'absolute', top: -2, right: -3, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: n.viewed ? 500 : 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</div>
          {n.body && <div style={{ fontSize: 11.5, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.body}</div>}
          <div style={{ fontSize: 10.5, color: 'var(--text-faint)', marginTop: 3 }}>{relativeTime(n.createdAt, i18next.language)}</div>
        </div>
      </Hover>
    )
  }

  return (
    <Modal onClose={close} width={440} zIndex={60} panelStyle={{ maxHeight: '76%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: '1px solid var(--line)' }}>
        <Icon name="notifications" size={18} color="var(--text-2)" />
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{t('notifications.title', 'Notifications')}</span>
        <div style={{ flex: 1 }} />
        {anyUnviewed && (
          <Hover as="span" onClick={markAll} style={{ fontSize: 11.5, color: 'var(--accent-hi)', cursor: 'pointer', padding: '4px 8px', borderRadius: 6 }} hover={{ background: 'var(--surface-2)' }}>
            {t('notifications.markAll', 'Mark all as viewed')}
          </Hover>
        )}
        {items.length > 0 && (
          <Hover as="span" title={t('notifications.clear', 'Clear all')} onClick={clearAll} style={{ display: 'flex', width: 26, height: 26, borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
            <Icon name="delete_sweep" size={16} />
          </Hover>
        )}
      </div>
      {items.length === 0 ? (
        <div style={{ padding: '48px 16px', textAlign: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>{t('notifications.empty', 'No notifications yet.')}</div>
      ) : (
        <VirtualList items={items} rowHeight={68} itemKey={(n) => n.id} renderRow={row} style={{ maxHeight: '62vh' }} />
      )}
    </Modal>
  )
}
