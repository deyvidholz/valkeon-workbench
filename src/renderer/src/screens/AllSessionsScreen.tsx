import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getModelMeta } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { VirtualList } from '../ui/VirtualList'
import { StatusDot, STATUS_LABEL } from '../ui/StatusDot'
import { ModelChip } from '../ui/ModelChip'

export function AllSessionsScreen() {
  const { t } = useTranslation()
  const sessions = useStore((s) => s.sessions)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const openSession = useStore((s) => s.openSession)
  const endSession = useStore((s) => s.endSession)
  const renameSession = useStore((s) => s.renameSession)
  const reorderSessions = useStore((s) => s.reorderSessions)
  const askConfirm = useStore((s) => s.askConfirm)
  const go = useStore((s) => s.go)
  const scoped = useMemo(() => sessions.filter((s) => s.wsId === wsId), [sessions, wsId])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (id: string, name: string): void => { setEditId(id); setEditName(name) }
  const commitEdit = (): void => { if (editId) renameSession(editId, editName); setEditId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Hover as="span" onClick={() => go('workspace')} title={t('allItems.back', 'Back')} style={{ display: 'flex', width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface)', color: 'var(--text-2)' }}>
          <Icon name="arrow_back" size={18} />
        </Hover>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('allSessions.title', 'All sessions')}</div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scoped.length}</span>
      </div>
      {scoped.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{t('allSessions.empty', 'No sessions.')}</div>
      ) : (
        <VirtualList
          items={scoped}
          rowHeight={54}
          itemKey={(s) => s.id}
          style={{ flex: 1, padding: '8px 16px 24px' }}
          renderRow={(s, i) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 9, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Hover as="span" onClick={() => i > 0 && reorderSessions(s.id, scoped[i - 1].id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 15, lineHeight: 1, color: i > 0 ? 'var(--text-muted)' : 'var(--text-faint)', cursor: i > 0 ? 'pointer' : 'default' }} hover={i > 0 ? { color: 'var(--text-2)' } : {}}>keyboard_arrow_up</Hover>
                <Hover as="span" onClick={() => i < scoped.length - 1 && reorderSessions(s.id, scoped[i + 1].id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 15, lineHeight: 1, color: i < scoped.length - 1 ? 'var(--text-muted)' : 'var(--text-faint)', cursor: i < scoped.length - 1 ? 'pointer' : 'default' }} hover={i < scoped.length - 1 ? { color: 'var(--text-2)' } : {}}>keyboard_arrow_down</Hover>
              </div>
              <StatusDot status={s.status} />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === s.id ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditId(null) }} style={{ width: '70%', background: 'var(--bg)', border: '1px solid var(--accent-line)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 12.5 }} />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                    <ModelChip label={getModelMeta(s.providerId, s.modelId)?.short ?? s.modelId} />
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{STATUS_LABEL[s.status]}</div>
              </div>
              <Hover as="span" onClick={() => startEdit(s.id, s.name)} title={t('allItems.rename', 'Rename')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}><Icon name="edit" size={15} /></Hover>
              <Hover as="span" onClick={() => openSession(s.id)} title={t('allItems.open', 'Open')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--accent-hi)' }}><Icon name="open_in_full" size={15} /></Hover>
              <Hover as="span" onClick={() => askConfirm({ title: t('allItems.stop', 'Stop'), message: t('allSessions.stopQ', 'Stop “{{name}}”? The agent process is terminated.', { name: s.name }), confirmLabel: t('allItems.stop', 'Stop'), onConfirm: () => endSession(s.id) })} title={t('allItems.stop', 'Stop')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--danger)' }}><Icon name="stop_circle" size={15} /></Hover>
            </div>
          )}
        />
      )}
    </div>
  )
}
