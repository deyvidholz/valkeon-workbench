import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Toggle } from '../ui/Toggle'
import { DialogActions, DialogHeader, eyebrow, inputStyle } from './parts'

export function NewWorkspaceDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.newWsOpen)
  const form = useStore((s) => s.newWs)
  const setForm = useStore((s) => s.setNewWs)
  const create = useStore((s) => s.createWorkspace)
  const close = useStore((s) => s.closeNewWs)
  if (!open) return null

  return (
    <Modal onClose={close} width={480} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="workspaces" title={t('newWorkspace.title', 'New workspace')} subtitle={t('newWorkspace.subtitle', 'A workspace groups its own sessions, terminals, boards, and worktrees.')} />
      <div style={eyebrow}>{t('newWorkspace.name', 'NAME')}</div>
      <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder={t('newWorkspace.namePlaceholder', 'e.g. Search revamp')} style={{ ...inputStyle, marginBottom: 18 }} autoFocus />
      <div onClick={() => setForm({ useWorktree: !form.useWorktree })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--line)', cursor: 'pointer', marginBottom: 20 }}>
        <Icon name="account_tree" size={19} color="var(--ai)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('newWorkspace.useWorktrees', 'Use worktrees by default')}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{t('newWorkspace.useWorktreesHint', 'New sessions here pre-select an isolated worktree')}</div>
        </div>
        <Toggle on={form.useWorktree} onClick={() => setForm({ useWorktree: !form.useWorktree })} />
      </div>
      <DialogActions onCancel={close} onConfirm={create} confirmLabel={t('newWorkspace.create', 'Create workspace')} confirmIcon="add" />
    </Modal>
  )
}
