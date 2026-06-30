import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Toggle } from '../ui/Toggle'
import { DialogActions, DialogHeader, eyebrow, inputStyle } from './parts'

export function NewWorkspaceDialog() {
  const open = useStore((s) => s.newWsOpen)
  const form = useStore((s) => s.newWs)
  const setForm = useStore((s) => s.setNewWs)
  const create = useStore((s) => s.createWorkspace)
  const close = useStore((s) => s.closeNewWs)
  if (!open) return null

  return (
    <Modal onClose={close} width={480} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="workspaces" title="New workspace" subtitle="A workspace groups its own sessions, terminals, boards, and worktrees." />
      <div style={eyebrow}>NAME</div>
      <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. Search revamp" style={{ ...inputStyle, marginBottom: 18 }} autoFocus />
      <div onClick={() => setForm({ useWorktree: !form.useWorktree })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: '#0e0e12', border: '1px solid #1c1c22', cursor: 'pointer', marginBottom: 20 }}>
        <Icon name="account_tree" size={19} color="#b89cf0" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Use worktrees by default</div>
          <div style={{ fontSize: 11, color: '#6b6b74', marginTop: 2 }}>New sessions here pre-select an isolated worktree</div>
        </div>
        <Toggle on={form.useWorktree} onClick={() => setForm({ useWorktree: !form.useWorktree })} />
      </div>
      <DialogActions onCancel={close} onConfirm={create} confirmLabel="Create workspace" confirmIcon="add" />
    </Modal>
  )
}
