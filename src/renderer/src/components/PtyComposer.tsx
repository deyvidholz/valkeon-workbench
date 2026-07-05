import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

interface PtyComposerProps {
  ptyId: string
  prompt: string
  promptColor: string
  placeholder: string
  /** When this number changes, focus the input (⌘L). */
  focusToken?: number
}

/** Inline composer beneath a terminal/session: sends a line to the PTY on Enter. */
export function PtyComposer({ ptyId, prompt, promptColor, placeholder, focusToken }: PtyComposerProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (focusToken) inputRef.current?.focus()
  }, [focusToken])

  const send = (): void => {
    window.api?.pty.write(ptyId, `${value}\r`)
    setValue('')
  }

  return (
    <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ color: promptColor, fontFamily: "'Geist Mono', monospace", fontSize: 13, fontWeight: 600 }}>{prompt}</span>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            send()
          }
        }}
        placeholder={placeholder}
        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', color: 'var(--text)', fontSize: 12.5, fontFamily: "'Geist Mono', monospace" }}
      />
      <Hover as="span" onClick={send} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 7, background: 'var(--accent-soft)', color: 'var(--accent)', cursor: 'pointer' }} hover={{ background: 'var(--accent)', color: 'var(--on-accent)' }}>
        <Icon name="arrow_upward" size={16} />
      </Hover>
    </div>
  )
}
