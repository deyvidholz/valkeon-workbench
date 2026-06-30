import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogActions, DialogHeader, eyebrow, inputStyle, segStyle } from './parts'
import type { BoardScope } from '../types'

const SCOPES: BoardScope[] = ['feature', 'epic', 'release', 'chore']

export function NewBoardDialog() {
  const open = useStore((s) => s.newBoardOpen)
  const form = useStore((s) => s.newBoard)
  const setForm = useStore((s) => s.setNewBoard)
  const create = useStore((s) => s.createBoard)
  const close = useStore((s) => s.closeNewBoard)
  if (!open) return null

  return (
    <Modal onClose={close} width={460} zIndex={55} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="view_kanban" title="New board" subtitle="A board scopes a Kanban to a project, feature, or release." />
      <div style={eyebrow}>NAME</div>
      <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. Notifications revamp" style={{ ...inputStyle, marginBottom: 16 }} autoFocus />
      <div style={eyebrow}>SCOPE</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {SCOPES.map((s) => (
          <span key={s} onClick={() => setForm({ scope: s })} style={{ ...segStyle(form.scope === s), textTransform: 'capitalize' }}>
            {s}
          </span>
        ))}
      </div>
      <DialogActions onCancel={close} onConfirm={create} confirmLabel="Create board" confirmIcon="add" />
    </Modal>
  )
}
