import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Markdown } from '../components/Markdown'

const TEMPLATES: { label: string; src: string }[] = [
  { label: 'Flowchart', src: 'flowchart TD\n  A[Start] --> B{Decision}\n  B -->|Yes| C[Do it]\n  B -->|No| D[Skip]' },
  { label: 'Sequence', src: 'sequenceDiagram\n  Client->>Server: Request\n  Server-->>Client: Response' },
  { label: 'Class', src: 'classDiagram\n  Animal <|-- Dog\n  Animal : +String name\n  Dog : +bark()' },
  { label: 'Mindmap', src: 'mindmap\n  root((Idea))\n    Research\n    Build\n    Ship' }
]

export function DiagramBuilder() {
  const open = useStore((s) => s.diagOpen)
  const diagText = useStore((s) => s.diagText)
  const setDiagText = useStore((s) => s.setDiagText)
  const insert = useStore((s) => s.insertDiagram)
  const close = useStore((s) => s.closeDiag)
  if (!open) return null

  return (
    <Modal onClose={close} width={760} zIndex={64} panelStyle={{ maxHeight: '86%' }}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="schema" size={19} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Diagram builder</span>
        </div>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          <Icon name="close" size={19} />
        </Hover>
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, padding: '11px 18px', borderBottom: '1px solid var(--line)' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginRight: 2 }}>Templates:</span>
        {TEMPLATES.map((t) => (
          <Hover key={t.label} as="span" onClick={() => setDiagText(t.src)} style={{ padding: '5px 11px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 11.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', border: '1px solid var(--line-2)' }}>
            {t.label}
          </Hover>
        ))}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', height: 380 }}>
        <div style={{ width: 300, flexShrink: 0, borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '9px 14px', fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>MERMAID SOURCE</div>
          <textarea value={diagText} onChange={(e) => setDiagText(e.target.value)} style={{ flex: 1, minHeight: 0, resize: 'none', background: 'var(--bg)', border: 'none', padding: 13, color: 'var(--text-2)', fontSize: 12, lineHeight: 1.6, fontFamily: "'Geist Mono', monospace" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
          <div style={{ padding: '9px 14px', fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', borderBottom: '1px solid var(--line)' }}>PREVIEW</div>
          <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: 16 }}>
            <Markdown source={'```mermaid\n' + diagText + '\n```'} />
          </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
        <Hover as="span" onClick={close} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>Cancel</Hover>
        <Hover as="span" onClick={insert} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="check" size={16} />Insert diagram
        </Hover>
      </div>
    </Modal>
  )
}
