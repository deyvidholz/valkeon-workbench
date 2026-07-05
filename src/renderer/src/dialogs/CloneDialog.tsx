import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { DialogHeader, eyebrow, inputStyle } from './parts'

export function CloneDialog() {
  const open = useStore((s) => s.cloneOpen)
  const url = useStore((s) => s.cloneUrl)
  const setUrl = useStore((s) => s.setCloneUrl)
  const cloning = useStore((s) => s.cloning)
  const error = useStore((s) => s.cloneError)
  const close = useStore((s) => s.closeClone)
  const doClone = useStore((s) => s.doClone)
  if (!open) return null

  return (
    <Modal onClose={cloning ? () => {} : close} width={520} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="cloud_download" title="Clone from Git" subtitle="Paste a repository URL — you'll choose where to clone it." />
      <div style={eyebrow}>REPOSITORY URL</div>
      <input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !cloning) doClone()
        }}
        placeholder="https://github.com/acme/app.git"
        style={{ ...inputStyle, marginBottom: error ? 8 : 18 }}
        autoFocus
        disabled={cloning}
      />
      {error && <div style={{ fontSize: 11.5, color: 'var(--danger)', marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
        <Hover as="span" onClick={cloning ? undefined : close} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: cloning ? 'default' : 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
          Cancel
        </Hover>
        <Hover as="span" onClick={cloning ? undefined : doClone} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: cloning ? 'default' : 'pointer', opacity: cloning ? 0.7 : 1 }} hover={cloning ? undefined : { filter: 'brightness(1.08)' }}>
          <Icon name={cloning ? 'hourglass_top' : 'cloud_download'} size={16} />
          {cloning ? 'Cloning…' : 'Clone'}
        </Hover>
      </div>
    </Modal>
  )
}
