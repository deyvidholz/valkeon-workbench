import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { DialogHeader, eyebrow, inputStyle, segStyle } from './parts'
import type { TaskStrategy } from '@shared/project'

const STRATEGIES: { id: TaskStrategy; label: string; desc: string; icon: string }[] = [
  { id: 'branch', label: 'New branch', desc: 'Create feat/<task> in the main checkout', icon: 'fork_right' },
  { id: 'worktree', label: 'Worktree', desc: 'Isolated checkout on a new branch — parallel-safe', icon: 'account_tree' },
  { id: 'current', label: 'Current branch', desc: 'Work in place, no new branch', icon: 'edit' }
]

export function ProjectSettingsDialog() {
  const open = useStore((s) => s.projectSettingsOpen)
  const close = useStore((s) => s.closeProjectSettings)
  const config = useStore((s) => s.projectConfig)
  const branches = useStore((s) => s.branches)
  const save = useStore((s) => s.saveProjectConfig)
  const project = useStore((s) => s.project)
  if (!open) return null

  return (
    <Modal onClose={close} width={520} zIndex={58} panelStyle={{ padding: 20 }}>
      <DialogHeader icon="tune" title="Project settings" subtitle={<>How Valkeon drives git for <span style={{ color: '#9a9aa3' }}>{project?.name}</span>. Saved to <span style={{ fontFamily: "'Geist Mono', monospace" }}>.valkeon/config.json</span>.</>} />

      <div style={eyebrow}>DEFAULT TASK STRATEGY</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 18 }}>
        {STRATEGIES.map((s) => {
          const on = config.taskStrategy === s.id
          return (
            <Hover key={s.id} onClick={() => save({ taskStrategy: s.id })} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 13px', borderRadius: 10, cursor: 'pointer', background: on ? 'var(--accent-soft)' : '#0e0e12', border: `1px solid ${on ? 'var(--accent-line)' : '#1c1c22'}` }} hover={on ? undefined : { border: '1px solid #2c2c35' }}>
              <Icon name={s.icon} size={19} color={on ? 'var(--accent-hi)' : '#7c9bd0'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: '#6b6b74', marginTop: 2 }}>{s.desc}</div>
              </div>
              <Icon name={on ? 'radio_button_checked' : 'radio_button_unchecked'} size={17} color={on ? 'var(--accent-hi)' : '#3a3a42'} />
            </Hover>
          )
        })}
      </div>

      <div style={eyebrow}>BASE BRANCH</div>
      <div style={{ fontSize: 11, color: '#6b6b74', lineHeight: 1.5, marginBottom: 8 }}>Finished work merges into this branch (from the Worktrees view).</div>
      <input
        list="vw-branch-list"
        value={config.baseBranch}
        onChange={(e) => save({ baseBranch: e.target.value })}
        placeholder="main"
        style={{ ...inputStyle, marginBottom: 8, fontFamily: "'Geist Mono', monospace" }}
      />
      <datalist id="vw-branch-list">
        {branches.map((b) => (
          <option key={b} value={b} />
        ))}
      </datalist>
      {branches.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {branches.slice(0, 8).map((b) => (
            <span key={b} onClick={() => save({ baseBranch: b })} style={segStyle(config.baseBranch === b)}>{b}</span>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="check" size={16} />Done
        </Hover>
      </div>
    </Modal>
  )
}
