import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getModelMeta } from '@shared/agents/providers'
import { useStore } from '../../store/useStore'
import { Icon } from '../../ui/Icon'
import { Hover } from '../../ui/Hover'
import { StatusDot, STATUS_LABEL } from '../../ui/StatusDot'
import { ModelChip } from '../../ui/ModelChip'

const fmtElapsed = (ms: number): string => {
  const s = Math.max(0, Math.floor(ms / 1000))
  if (s < 60) return `${s}s`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  return `${Math.floor(m / 60)}h ${m % 60}m`
}

const addBtn = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 20,
  height: 20,
  borderRadius: 6,
  color: 'var(--text-muted)',
  cursor: 'pointer'
} as const

export function SessionList() {
  const { t } = useTranslation()
  const sessions = useStore((s) => s.sessions)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const activeSessionId = useStore((s) => s.activeSessionId)
  const openSession = useStore((s) => s.openSession)
  const openNewSession = useStore((s) => s.openNewSession)
  const endSession = useStore((s) => s.endSession)
  const closeAllSessions = useStore((s) => s.closeAllSessions)
  const askConfirm = useStore((s) => s.askConfirm)
  const openContextMenu = useStore((s) => s.openContextMenu)
  const scoped = useMemo(() => sessions.filter((s) => s.wsId === wsId), [sessions, wsId])
  // Re-render once a second so the elapsed time stays live.
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!scoped.length) return
    const t = setInterval(() => setTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [scoped.length])

  return (
    <>
      <div
        style={{
          padding: '11px 16px 7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
          {t('sessionList.activeSessions', 'ACTIVE SESSIONS')}
        </span>
        <Hover as="span" title={t('sessionList.newSession', 'New session')} onClick={openNewSession} style={addBtn} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          <Icon name="add" size={16} />
        </Hover>
      </div>
      <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {scoped.map((s) => (
          <Hover
            key={s.id}
            onClick={() => openSession(s.id)}
            onContextMenu={(e) => {
              e.preventDefault()
              openContextMenu(e.clientX, e.clientY, [
                { label: t('sessionList.openSession', 'Open session'), icon: 'open_in_full', onClick: () => openSession(s.id) },
                { label: t('sessionList.closeSession', 'Close session'), icon: 'close', danger: true, onClick: () => askConfirm({ title: t('sessionList.closeSession', 'Close session'), message: t('sessionList.closeSessionQ', 'Close “{{name}}”? The agent process is terminated.', { name: s.name }), confirmLabel: t('sessionList.closeSession', 'Close session'), onConfirm: () => endSession(s.id) }) },
                { label: t('sessionList.closeAllSessions', 'Close all sessions'), icon: 'layers_clear', danger: true, onClick: closeAllSessions }
              ])
            }}
            style={{
              display: 'flex',
              gap: 9,
              padding: 9,
              borderRadius: 8,
              cursor: 'pointer',
              alignItems: 'flex-start',
              background: s.id === activeSessionId ? 'var(--surface)' : 'transparent'
            }}
            hover={{ background: 'var(--surface)' }}
          >
            <StatusDot status={s.status} style={{ marginTop: 5 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--text-2)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {s.name}
                </span>
                <ModelChip label={getModelMeta(s.providerId, s.modelId)?.short ?? s.modelId} />
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  marginTop: 2
                }}
              >
                {STATUS_LABEL[s.status]}
              </div>
            </div>
            <span
              style={{
                fontSize: 10.5,
                color: 'var(--text-faint)',
                fontFamily: "'Geist Mono', monospace",
                marginTop: 2,
                flexShrink: 0
              }}
            >
              {fmtElapsed(Date.now() - s.startedAt)}
            </span>
          </Hover>
        ))}
      </div>
    </>
  )
}
