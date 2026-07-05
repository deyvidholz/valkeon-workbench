import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogActions, DialogHeader } from './parts'

export function GenerateCardsDialog() {
  const open = useStore((s) => s.genOpen)
  const genText = useStore((s) => s.genText)
  const setGenText = useStore((s) => s.setGenText)
  const generate = useStore((s) => s.generateCards)
  const close = useStore((s) => s.closeGen)
  const boards = useStore((s) => s.boards)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const wsId = useStore((s) => s.activeWorkspaceId)
  if (!open) return null

  const board = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => b.wsId === wsId)

  return (
    <Modal onClose={close} width={520} zIndex={50} panelStyle={{ padding: 20 }}>
      <DialogHeader
        icon="auto_awesome"
        title="Generate cards with AI"
        subtitle={<>Describe a feature or paste a spec. Tasks are drafted into <span style={{ color: 'var(--text-dim)' }}>{board?.name}</span> · Backlog.</>}
      />
      <textarea
        value={genText}
        onChange={(e) => setGenText(e.target.value)}
        placeholder="e.g. Add SSO with Google and Okta, including session handling and an admin toggle…"
        autoFocus
        style={{ width: '100%', minHeight: 108, resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: 13, color: 'var(--text)', fontSize: 13, lineHeight: 1.55, fontFamily: "'Geist', sans-serif", marginBottom: 14 }}
      />
      <DialogActions onCancel={close} onConfirm={generate} confirmLabel="Generate cards" confirmIcon="auto_awesome" />
    </Modal>
  )
}
