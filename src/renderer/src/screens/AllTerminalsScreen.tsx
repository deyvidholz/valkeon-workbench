import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { VirtualList } from '../ui/VirtualList'

export function AllTerminalsScreen() {
  const { t } = useTranslation()
  const terminals = useStore((s) => s.terminals)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const go = useStore((s) => s.go)
  const closeTerminal = useStore((s) => s.closeTerminal)
  const renameTerminal = useStore((s) => s.renameTerminal)
  const reorderTerminals = useStore((s) => s.reorderTerminals)
  const askConfirm = useStore((s) => s.askConfirm)
  const scoped = useMemo(() => terminals.filter((tm) => tm.wsId === wsId), [terminals, wsId])
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  const startEdit = (id: string, name: string): void => { setEditId(id); setEditName(name) }
  const commitEdit = (): void => { if (editId) renameTerminal(editId, editName); setEditId(null) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Hover as="span" onClick={() => go('terminals')} title={t('allItems.back', 'Back')} style={{ display: 'flex', width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface)', color: 'var(--text-2)' }}>
          <Icon name="arrow_back" size={18} />
        </Hover>
        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('allTerminals.title', 'All terminals')}</div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{scoped.length}</span>
      </div>
      {scoped.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 13 }}>{t('allTerminals.empty', 'No terminals.')}</div>
      ) : (
        <VirtualList
          items={scoped}
          rowHeight={54}
          itemKey={(tm) => tm.id}
          style={{ flex: 1, padding: '8px 16px 24px' }}
          renderRow={(tm, i) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px', borderRadius: 9, borderBottom: '1px solid var(--line)' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Hover as="span" onClick={() => i > 0 && reorderTerminals(tm.id, scoped[i - 1].id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 15, lineHeight: 1, color: i > 0 ? 'var(--text-muted)' : 'var(--text-faint)', cursor: i > 0 ? 'pointer' : 'default' }} hover={i > 0 ? { color: 'var(--text-2)' } : {}}>keyboard_arrow_up</Hover>
                <Hover as="span" onClick={() => i < scoped.length - 1 && reorderTerminals(tm.id, scoped[i + 1].id)} style={{ fontFamily: "'Material Symbols Rounded'", fontSize: 15, lineHeight: 1, color: i < scoped.length - 1 ? 'var(--text-muted)' : 'var(--text-faint)', cursor: i < scoped.length - 1 ? 'pointer' : 'default' }} hover={i < scoped.length - 1 ? { color: 'var(--text-2)' } : {}}>keyboard_arrow_down</Hover>
              </div>
              <Icon name="terminal" size={16} color="var(--text-muted)" />
              <div style={{ flex: 1, minWidth: 0 }}>
                {editId === tm.id ? (
                  <input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={commitEdit} onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditId(null) }} style={{ width: '70%', background: 'var(--bg)', border: '1px solid var(--accent-line)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 12.5 }} />
                ) : (
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tm.name}</span>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2, fontFamily: "'Geist Mono', monospace", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tm.cwd}</div>
              </div>
              <Hover as="span" onClick={() => startEdit(tm.id, tm.name)} title={t('allItems.rename', 'Rename')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}><Icon name="edit" size={15} /></Hover>
              <Hover as="span" onClick={() => go('terminals')} title={t('allItems.open', 'Open')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--accent-hi)' }}><Icon name="open_in_full" size={15} /></Hover>
              <Hover as="span" onClick={() => askConfirm({ title: t('allItems.close', 'Close'), message: t('allTerminals.closeQ', 'Close “{{name}}”?', { name: tm.name }), confirmLabel: t('allItems.close', 'Close'), onConfirm: () => closeTerminal(tm.id) })} title={t('allItems.close', 'Close')} style={{ display: 'flex', width: 28, height: 28, borderRadius: 7, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--danger)' }}><Icon name="close" size={15} /></Hover>
            </div>
          )}
        />
      )}
    </div>
  )
}
