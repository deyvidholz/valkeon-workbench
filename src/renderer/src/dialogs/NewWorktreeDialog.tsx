import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogActions, DialogHeader, eyebrow, inputStyle } from './parts'

export function NewWorktreeDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.newWorktreeOpen)
  const name = useStore((s) => s.newWorktreeName)
  const setName = useStore((s) => s.setNewWorktreeName)
  const create = useStore((s) => s.createWorktree)
  const close = useStore((s) => s.closeNewWorktree)
  if (!open) return null

  return (
    <Modal onClose={close} width={460} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="account_tree" title={t('newWorktree.title', 'New worktree')} subtitle={t('newWorktree.subtitle', 'An isolated checkout on its own branch, so sessions can work in parallel.')} />
      <div style={eyebrow}>{t('newWorktree.branchName', 'BRANCH / NAME')}</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) create(name)
        }}
        placeholder={t('newWorktree.namePlaceholder', 'feature/search')}
        style={{ ...inputStyle, marginBottom: 18 }}
        autoFocus
      />
      <DialogActions onCancel={close} onConfirm={() => create(name)} confirmLabel={t('newWorktree.create', 'Create worktree')} confirmIcon="add" />
    </Modal>
  )
}
