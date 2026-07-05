import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CLAUDE_PROVIDER } from '@shared/agents/providers'
import { useStore } from '../store/useStore'
import { ACCENTS } from '../theme/accents'
import { Toggle } from '../ui/Toggle'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

const sectionLabel = { fontSize: 11, fontWeight: 600 as const, letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 13 }
const card = { background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, marginBottom: 26 }

export function SettingsScreen() {
  const { t } = useTranslation()
  const accent = useStore((s) => s.accent)
  const setAccent = useStore((s) => s.setAccent)
  const fontSize = useStore((s) => s.fontSize)
  const setFontSize = useStore((s) => s.setFontSize)
  const defaultModelId = useStore((s) => s.defaultModelId)
  const setDefaultModel = useStore((s) => s.setDefaultModel)
  const themePref = useStore((s) => s.themePref)
  const setThemePref = useStore((s) => s.setThemePref)
  const localePref = useStore((s) => s.localePref)
  const setLocalePref = useStore((s) => s.setLocalePref)

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
    { key: 'restore' as const, label: t('settings.restoreLabel', 'Restore sessions on open'), desc: t('settings.restoreDesc', 'Reopen the sessions you had running last time') },
    { key: 'confirmClose' as const, label: t('settings.confirmCloseLabel', 'Confirm before closing a running session'), desc: t('settings.confirmCloseDesc', 'Avoid accidentally killing active work') },
    { key: 'launch' as const, label: t('settings.launchLabel', 'Launch at login'), desc: t('settings.launchDesc', 'Start Valkeon when you log in') }
  ]

  const SHORTCUTS: { label: string; keys: string }[] = [
    { label: t('settings.shortcutNewSession', 'New session'), keys: '⌘N' },
    { label: t('settings.shortcutNewTerminal', 'New terminal'), keys: '⌘T' },
    { label: t('settings.shortcutOpenFolder', 'Open folder'), keys: '⌘O' },
    { label: t('settings.shortcutCommandPalette', 'Command palette'), keys: '⌘K' },
    { label: t('settings.shortcutCycleSessions', 'Cycle sessions'), keys: '⌃⇥' },
    { label: t('settings.shortcutToggleLayout', 'Toggle layout'), keys: '⌘\\' },
    { label: t('settings.shortcutFocusComposer', 'Focus composer'), keys: '⌘L' }
  ]

  const themeLabels: Record<string, string> = {
    system: t('settings.themeSystem', 'System'),
    dark: t('settings.themeDark', 'Dark'),
    light: t('settings.themeLight', 'Light')
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '34px 32px 60px' }}>
        <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 26 }}>{t('settings.title', 'Settings')}</div>

        <div style={sectionLabel}>{t('settings.appearance', 'APPEARANCE')}</div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('settings.theme', 'Theme')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.themeDesc', 'System follows your OS appearance')}</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
              {(['system', 'dark', 'light'] as const).map((t) => {
                const on = t === themePref
                return (
                  <span key={t} onClick={() => setThemePref(t)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, textTransform: 'capitalize', color: on ? 'var(--on-accent)' : 'var(--text-dim)', background: on ? 'var(--accent)' : 'transparent' }}>
                    <Icon name={t === 'system' ? 'brightness_auto' : t === 'dark' ? 'dark_mode' : 'light_mode'} size={15} />
                    {themeLabels[t]}
                  </span>
                )
              })}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '15px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('settings.language', 'Language')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.languageDesc', 'System uses your OS language')}</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
              {([['system', t('settings.langSystem', 'System')], ['en', 'English'], ['pt-BR', 'Português'], ['es-AR', 'Español']] as const).map(([id, label]) => {
                const on = id === localePref
                return (
                  <span key={id} onClick={() => setLocalePref(id)} style={{ padding: '5px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: on ? 'var(--on-accent)' : 'var(--text-dim)', background: on ? 'var(--accent)' : 'transparent' }}>{label}</span>
                )
              })}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '15px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('settings.accentColor', 'Accent color')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.accentDesc', 'Used across highlights and actions')}</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ACCENTS.map((a) => {
                const on = a.value.toLowerCase() === accent.toLowerCase()
                return (
                  <span
                    key={a.id}
                    onClick={() => { setAccent(a.value); setDirty(true) }}
                    title={a.label}
                    style={{ width: 22, height: 22, borderRadius: 7, background: a.value, cursor: 'pointer', boxShadow: on ? '0 0 0 2px var(--bg), 0 0 0 3.5px #fff' : '0 0 0 1px rgba(255,255,255,0.12) inset' }}
                  />
                )
              })}
            </div>
          </div>
          <div style={{ height: 1, background: 'var(--line)', margin: '15px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('settings.terminalFontSize', 'Terminal font size')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.fontSizePx', '{{size}}px', { size: fontSize })}</div>
            </div>
            <input type="range" min={11} max={15} step={1} value={fontSize} onChange={(e) => { setFontSize(Number(e.target.value)); setDirty(true) }} style={{ width: 160, accentColor: 'var(--accent)' }} />
          </div>
        </div>

        <div style={sectionLabel}>{t('settings.general', 'GENERAL')}</div>
        <div style={{ ...card, padding: '4px 18px' }}>
          {generalRows.map((r, i) => (
            <div key={r.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <div>
                <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{r.label}</div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{r.desc}</div>
              </div>
              <Toggle on={toggles[r.key]} onClick={() => setToggle(r.key)} />
            </div>
          ))}
        </div>

        <div style={sectionLabel}>{t('settings.models', 'MODELS')}</div>
        <div style={{ ...card, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{t('settings.defaultModel', 'Default model')}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>{t('settings.defaultModelDesc', 'New sessions start with this')}</div>
            </div>
            <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 9, padding: 3, gap: 2 }}>
              {CLAUDE_PROVIDER.models.map((m) => {
                const on = m.id === defaultModelId
                return (
                  <span key={m.id} onClick={() => { setDefaultModel(m.id); setDirty(true) }} style={{ padding: '5px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: on ? 'var(--on-accent)' : 'var(--text-dim)', background: on ? 'var(--accent)' : 'transparent' }}>{m.short}</span>
                )
              })}
            </div>
          </div>
        </div>

        <div style={sectionLabel}>{t('settings.keyboard', 'KEYBOARD')}</div>
        <div style={{ ...card, padding: '4px 18px', marginBottom: 0 }}>
          {SHORTCUTS.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', borderTop: i ? '1px solid var(--line)' : 'none' }}>
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{s.label}</span>
              <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 11, color: 'var(--text-dim)', background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '3px 8px', borderRadius: 6 }}>{s.keys}</span>
            </div>
          ))}
        </div>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '12px 32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
        <span style={{ fontSize: 12, color: dirty ? 'var(--text-dim)' : 'var(--text-faint)' }}>{dirty ? t('settings.unsavedChanges', 'Unsaved changes') : t('settings.allSaved', 'All changes saved')}</span>
        <Hover
          as="span"
          onClick={() => dirty && save()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: dirty ? 'pointer' : 'not-allowed', opacity: dirty ? 1 : 0.5 }}
          hover={dirty ? { filter: 'brightness(1.08)' } : {}}
        >
          <Icon name="check" size={16} />{t('settings.save', 'Save settings')}
        </Hover>
      </div>
    </div>
  )
}
