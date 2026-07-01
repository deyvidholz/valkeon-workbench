import { getProviderMeta, PROVIDER_META } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Toggle } from '../ui/Toggle'
import { DialogActions, DialogHeader, eyebrow, inputStyle, segStyle } from './parts'

export function NewSessionDialog() {
  const open = useStore((s) => s.newSessionOpen)
  const form = useStore((s) => s.newSession)
  const setForm = useStore((s) => s.setNewSession)
  const create = useStore((s) => s.createSession)
  const close = useStore((s) => s.closeNewSession)
  const workspaces = useStore((s) => s.workspaces)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const project = useStore((s) => s.project)
  if (!open) return null

  const ws = workspaces.find((w) => w.id === wsId)
  const provider = getProviderMeta(form.providerId)
  const notRepo = project?.isGitRepo === false

  return (
    <Modal onClose={close} width={480} zIndex={56} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="add_circle" title="New session" subtitle={<>Starts a {provider?.name ?? 'agent'} session in <span style={{ color: '#9a9aa3' }}>{ws?.name}</span>.</>} />

      <div style={eyebrow}>NAME</div>
      <input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. refactor-billing" style={{ ...inputStyle, marginBottom: 16 }} autoFocus />

      {PROVIDER_META.length > 1 && (
        <>
          <div style={eyebrow}>PROVIDER</div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            {PROVIDER_META.map((p) => (
              <span key={p.id} onClick={() => setForm({ providerId: p.id, modelId: p.defaultModelId })} style={segStyle(form.providerId === p.id)}>
                {p.name}
              </span>
            ))}
          </div>
        </>
      )}

      <div style={eyebrow}>MODEL</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
        {provider?.models.map((m) => (
          <span key={m.id} onClick={() => setForm({ modelId: m.id })} style={segStyle(form.modelId === m.id)}>
            {m.short}
          </span>
        ))}
      </div>

      <div style={eyebrow}>MODE</div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        <span onClick={() => setForm({ mode: 'interactive' })} style={segStyle(form.mode === 'interactive')}>Interactive</span>
        <span onClick={() => setForm({ mode: 'structured' })} style={segStyle(form.mode === 'structured')}>Structured</span>
      </div>
      <div style={{ fontSize: 11, color: '#6b6b74', lineHeight: 1.5, marginBottom: 18 }}>
        {form.mode === 'structured'
          ? 'Our own transcript + live telemetry (files touched, tokens, status) and opt-in context injection. Same token cost as interactive.'
          : 'The raw agent terminal — full CLI feel, slash commands, the TUI.'}
      </div>

      <div
        onClick={() => !notRepo && setForm({ worktree: !form.worktree })}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: '#0e0e12', border: '1px solid #1c1c22', cursor: notRepo ? 'default' : 'pointer', marginBottom: 20, opacity: notRepo ? 0.55 : 1 }}
      >
        <Icon name="account_tree" size={19} color="#b89cf0" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Use a git worktree</div>
          <div style={{ fontSize: 11, color: '#6b6b74', marginTop: 2 }}>
            {notRepo ? 'Folder isn’t a git repo — initialize it in Worktrees first' : 'Isolated checkout so this session won’t collide with others'}
          </div>
        </div>
        <Toggle on={form.worktree && !notRepo} onClick={() => !notRepo && setForm({ worktree: !form.worktree })} />
      </div>

      <div onClick={() => setForm({ skipPerms: !form.skipPerms })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: '#100c0c', border: '1px solid #2a1a1a', cursor: 'pointer', marginBottom: 12 }}>
        <Icon name="gpp_maybe" size={19} color="#e0a05b" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Skip permission prompts</div>
          <div style={{ fontSize: 11, color: '#8a7a5e', marginTop: 2, fontFamily: "'Geist Mono', monospace" }}>--dangerously-skip-permissions</div>
        </div>
        <Toggle on={form.skipPerms} danger onClick={() => setForm({ skipPerms: !form.skipPerms })} />
      </div>

      <div onClick={() => setForm({ notify: !form.notify })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px', borderRadius: 10, background: '#0e0e12', border: '1px solid #1c1c22', cursor: 'pointer', marginBottom: 20 }}>
        <Icon name="notifications_active" size={19} color="var(--accent-hi)" />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Notify me when it needs me</div>
          <div style={{ fontSize: 11, color: '#6b6b74', marginTop: 2 }}>OS notification when a turn finishes or the agent asks something</div>
        </div>
        <Toggle on={form.notify} onClick={() => setForm({ notify: !form.notify })} />
      </div>

      <DialogActions onCancel={close} onConfirm={create} confirmLabel="Start session" confirmIcon="add" />
    </Modal>
  )
}
