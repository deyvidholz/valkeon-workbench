import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

interface AgentComposerProps {
  sessionId: string
  placeholder: string
  /** When this number changes, focus the input (⌘L). */
  focusToken?: number
}

/** Composer beneath a structured session: sends a user turn to the agent on Enter. */
export function AgentComposer({ sessionId, placeholder, focusToken }: AgentComposerProps) {
  const send = useStore((s) => s.sendToAgent)
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (focusToken) ref.current?.focus()
  }, [focusToken])

  const grow = (el: HTMLTextAreaElement | null): void => {
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
  }

  const submit = (): void => {
    const text = value.trim()
    if (!text) return
    send(sessionId, text)
    setValue('')
    if (ref.current) ref.current.style.height = 'auto'
  }

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid #16161a', background: '#0c0c0f', padding: '8px 12px 10px', display: 'flex', alignItems: 'flex-end', gap: 9 }}>
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
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, resize: 'none', background: 'transparent', border: 'none', color: '#e4e4ea', fontSize: 13, lineHeight: '22px', fontFamily: "'Geist Mono', monospace", maxHeight: 140 }}
      />
      <Hover as="span" onClick={submit} title="Send (Enter)" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} hover={{ background: 'var(--accent)', color: '#0a1018' }}>
        <Icon name="arrow_upward" size={16} />
      </Hover>
    </div>
  )
}
