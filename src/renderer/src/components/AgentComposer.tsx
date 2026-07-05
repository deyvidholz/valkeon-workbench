import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

interface AgentComposerProps {
  sessionId: string
  placeholder: string
  /** When this number changes, focus the input (⌘L). */
  focusToken?: number
}

interface Cmd {
  cmd: string
  hint: string
  /** i18n key for the hint text. */
  hintKey: string
  /** Needs an argument → completing it leaves a trailing space, not a send. */
  arg?: boolean
}

const COMMANDS: Cmd[] = [
  { cmd: '/model', hint: 'switch model (keeps context)', hintKey: 'agentComposer.modelSwitch', arg: true },
  { cmd: '/model opus', hint: 'switch to Opus', hintKey: 'agentComposer.modelOpus' },
  { cmd: '/model sonnet', hint: 'switch to Sonnet', hintKey: 'agentComposer.modelSonnet' },
  { cmd: '/model haiku', hint: 'switch to Haiku', hintKey: 'agentComposer.modelHaiku' },
  { cmd: '/clear', hint: 'clear context — fresh agent', hintKey: 'agentComposer.clear' }
]

/** Composer beneath a structured session: sends a turn on Enter, with slash-command autocomplete. */
export function AgentComposer({ sessionId, placeholder, focusToken }: AgentComposerProps) {
  const { t } = useTranslation()
  const send = useStore((s) => s.submitToAgent)
  const [value, setValue] = useState('')
  const [sel, setSel] = useState(0)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (focusToken) ref.current?.focus()
  }, [focusToken])

  const suggestions = useMemo(() => {
    const v = value.trimStart()
    if (!v.startsWith('/') || v.includes('\n')) return []
    const q = v.toLowerCase()
    return COMMANDS.filter((c) => c.cmd.startsWith(q) && c.cmd !== v).slice(0, 6)
  }, [value])
  const showSug = suggestions.length > 0

  useEffect(() => {
    setSel(0)
  }, [value])

  const grow = (el: HTMLTextAreaElement | null): void => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const complete = (c: Cmd): void => {
    setValue(c.arg ? `${c.cmd} ` : c.cmd)
    ref.current?.focus()
  }

  const submit = (): void => {
    const text = value.trim()
    if (!text) return
    send(sessionId, text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {showSug && (
        <div style={{ position: 'absolute', bottom: '100%', left: 12, right: 12, marginBottom: 4, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 10, padding: 5, boxShadow: '0 -12px 40px var(--shadow)', zIndex: 5 }}>
          {suggestions.map((c, i) => (
            <div
              key={c.cmd}
              onMouseEnter={() => setSel(i)}
              onMouseDown={(e) => {
                e.preventDefault()
                complete(c)
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', background: i === sel ? 'var(--surface-2)' : 'transparent' }}
            >
              <Icon name="bolt" size={14} color="var(--accent-hi)" />
              <span style={{ fontSize: 12.5, color: 'var(--text)', fontFamily: "'Geist Mono', monospace" }}>{c.cmd}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t(c.hintKey, c.hint)}</span>
            </div>
          ))}
        </div>
      )}
      <div style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '8px 12px 10px', display: 'flex', alignItems: 'flex-end', gap: 9 }}>
        <span style={{ color: 'var(--accent)', fontFamily: "'Geist Mono', monospace", fontSize: 14, fontWeight: 600, lineHeight: '22px' }}>›</span>
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            grow(e.target)
          }}
          onKeyDown={(e) => {
            if (showSug && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
              e.preventDefault()
              setSel((s) => (e.key === 'ArrowDown' ? (s + 1) % suggestions.length : (s - 1 + suggestions.length) % suggestions.length))
              return
            }
            if (showSug && (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey))) {
              e.preventDefault()
              complete(suggestions[sel])
              return
            }
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1, minWidth: 0, resize: 'none', background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 13, lineHeight: '22px', fontFamily: "'Geist Mono', monospace", maxHeight: 140 }}
        />
        <Hover as="span" onClick={submit} title={t('agentComposer.send', 'Send (Enter)')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} hover={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
          <Icon name="arrow_upward" size={16} />
        </Hover>
      </div>
    </div>
  )
}
