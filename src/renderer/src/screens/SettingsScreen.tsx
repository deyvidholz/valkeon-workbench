import { useEffect, useRef, useState } from 'react'
import { CLAUDE_PROVIDER } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { ACCENTS } from '../theme/accents'
import { Toggle } from '../ui/Toggle'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

const SHORTCUTS: { label: string; keys: string }[] = [
  { label: 'New session', keys: '⌘N' },
  { label: 'New terminal', keys: '⌘T' },
  { label: 'Open folder', keys: '⌘O' },
  { label: 'Command palette', keys: '⌘K' },
  { label: 'Cycle sessions', keys: '⌃⇥' },
  { label: 'Toggle layout', keys: '⌘\\' },
  { label: 'Focus composer', keys: '⌘L' }
]

const sectionLabel = { fontSize: 11, fontWeight: 600 as const, letterSpacing: '0.08em', color: '#62626b', marginBottom: 13 }
const card = { background: '#0c0c0f', border: '1px solid #1a1a1f', borderRadius: 12, marginBottom: 26 }

export function SettingsScreen() {
  const accent = useStore((s) => s.accent)
  const setAccent = useStore((s) => s.setAccent)
  const fontSize = useStore((s) => s.fontSize)
  const setFontSize = useStore((s) => s.setFontSize)
  const defaultModelId = useStore((s) => s.defaultModelId)
  const setDefaultModel = useStore((s) => s.setDefaultModel)

  const [toggles, setToggles] = useState({ restore: true, confirmClose: true, launch: false })
  const [dirty, setDirty] = useState(false)
  // Snapshot the saved appearance/model values so leaving without saving reverts
  // the live preview, and the toggles load their persisted state.
  const saved = useRef({ accent, fontSize, defaultModelId })
  const unsavedRef = useRef(false)
  useEffect(() => {
    unsavedRef.current = dirty
  }, [dirty])

  useEffect(() => {
    saved.current = { accent, fontSize, defaultModelId }
    void window.api?.settings
      .get()
      .then((s) => {
        setToggles({ restore: s.restoreSessions ?? true, confirmClose: s.confirmBeforeClosingRunning ?? true, launch: s.launchAtLogin ?? false })
      })
      .catch(() => {})
    return () => {
      // Discard unsaved live preview on the way out.
      if (unsavedRef.current) {
        const { accent: a, fontSize: f, defaultModelId: m } = saved.current
        useStore.setState({ accent: a, fontSize: f, defaultModelId: m })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setToggle = (key: keyof typeof toggles): void => {
    setToggles((t) => ({ ...t, [key]: !t[key] }))
    setDirty(true)
  }

  const save = (): void => {
    void window.api?.settings
      .set({ accent, terminalFontSize: fontSize, defaultModelId, restoreSessions: toggles.restore, confirmBeforeClosingRunning: toggles.confirmClose, launchAtLogin: toggles.launch } as never)
      .catch(() => {})
    saved.current = { accent, fontSize, defaultModelId }
    setDirty(false)
  }

  const generalRows = [
    { key: 'restore' as const, label: 'Restore sessions on open', desc: 'Reopen the sessions you had running last time' },
    { key: 'confirmClose' as const, label: 'Confirm before closing a running session', desc: 'Avoid accidentally killing active work' },
    { key: 'launch' as const, label: 'Launch at login', desc: 'Start Valkeon when you log in' }
  ]

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '34px 32px 60px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#ededf0', letterSpacing: '-0.01em', marginBottom: 26 }}>Settings</div>

        <div style={sectionLabel}>APPEARANCE</div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Accent color</div>
              <div style={{ fontSize: 11.5, color: '#6b6b74', marginTop: 2 }}>Used across highlights and actions</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCENTS.map((a) => {
                const on = a.value.toLowerCase() === accent.toLowerCase()
                return (
                  <span
                    key={a.id}
                    onClick={() => { setAccent(a.value); setDirty(true) }}
                    title={a.label}
                    style={{ width: 22, height: 22, borderRadius: 7, background: a.value, cursor: 'pointer', boxShadow: on ? '0 0 0 2px #0d0d11, 0 0 0 3.5px #fff' : '0 0 0 1px rgba(255,255,255,0.12) inset' }}
                  />
                )
              })}
            </div>
          </div>
          <div style={{ height: 1, background: '#16161a', margin: '15px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Terminal font size</div>
              <div style={{ fontSize: 11.5, color: '#6b6b74', marginTop: 2 }}>{fontSize}px</div>
            </div>
            <input type="range" min={11} max={15} step={1} value={fontSize} onChange={(e) => { setFontSize(Number(e.target.value)); setDirty(true) }} style={{ width: 160, accentColor: 'var(--accent)' }} />
          </div>
        </div>

        <div style={sectionLabel}>GENERAL</div>
        <div style={{ ...card, padding: '4px 18px' }}>
          {generalRows.map((r, i) => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', borderTop: i ? '1px solid #16161a' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: '#6b6b74', marginTop: 2 }}>{r.desc}</div>
              </div>
              <Toggle on={toggles[r.key]} onClick={() => setToggle(r.key)} />
            </div>
          ))}
        </div>

        <div style={sectionLabel}>MODELS</div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#e4e4ea', fontWeight: 500 }}>Default model</div>
              <div style={{ fontSize: 11.5, color: '#6b6b74', marginTop: 2 }}>New sessions start with this</div>
            </div>
            <div style={{ display: 'flex', background: '#0e0e12', border: '1px solid #1c1c22', borderRadius: 9, padding: 3, gap: 2 }}>
              {CLAUDE_PROVIDER.models.map((m) => {
                const on = m.id === defaultModelId
                return (
                  <span key={m.id} onClick={() => { setDefaultModel(m.id); setDirty(true) }} style={{ padding: '5px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: on ? '#0a1018' : '#8a8a93', background: on ? 'var(--accent)' : 'transparent' }}>{m.short}</span>
                )
              })}
            </div>
          </div>
        </div>

        <div style={sectionLabel}>KEYBOARD</div>
        <div style={{ ...card, padding: '4px 18px', marginBottom: 0 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderTop: i ? '1px solid #16161a' : 'none' }}>
              <span style={{ fontSize: 13, color: '#cbcbd2' }}>{s.label}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: '#9a9aa3', background: '#15151b', border: '1px solid #232330', padding: '3px 8px', borderRadius: 6 }}>{s.keys}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid #16161a', background: '#0b0b0e', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <span style={{ fontSize: 12, color: dirty ? '#9a9aa3' : '#56565e' }}>{dirty ? 'Unsaved changes' : 'All changes saved'}</span>
        <Hover
          as="span"
          onClick={() => dirty && save()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5 }}
          hover={dirty ? { filter: 'brightness(1.08)' } : {}}
        >
          <Icon name="check" size={16} />Save settings
        </Hover>
      </div>
    </div>
  )
}
