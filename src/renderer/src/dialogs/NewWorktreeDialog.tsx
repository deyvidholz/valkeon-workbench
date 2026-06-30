import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogActions, DialogHeader, eyebrow, inputStyle } from './parts'

export function NewWorktreeDialog() {
  const open = useStore((s) => s.newWorktreeOpen)
  const name = useStore((s) => s.newWorktreeName)
  const setName = useStore((s) => s.setNewWorktreeName)
  const create = useStore((s) => s.createWorktree)
  const close = useStore((s) => s.closeNewWorktree)
  if (!open) return null

  return (
    <Modal onClose={close} width={460} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="account_tree" title="New worktree" subtitle="An isolated checkout on its own branch, so sessions can work in parallel." />
      <div style={eyebrow}>BRANCH / NAME</div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && name.trim()) create(name)
        }}
        placeholder="feature/search"
        style={{ ...inputStyle, marginBottom: 18 }}
        autoFocus
      />
      <DialogActions onCancel={close} onConfirm={() => create(name)} confirmLabel="Create worktree" confirmIcon="add" />
    </Modal>
  )
}
