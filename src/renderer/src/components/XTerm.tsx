import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'
import type { PtyCreateSpec } from '@shared/pty'

interface XTermProps {
  /** Stable PTY id. Changing it (e.g. on restart) remounts and respawns. */
  ptyId: string
  spec: Omit<PtyCreateSpec, 'id' | 'cols' | 'rows'>
  fontSize?: number
  onExit?: (code: number) => void
  /** Fired once the one-shot `initialInput` has actually been written to the PTY. */
  onInitialInputSent?: () => void
}

/**
 * A real terminal: an xterm.js view bound to a node-pty process in the main
 * process. Output streams in byte-for-byte as it arrives; keystrokes go straight
 * to the PTY. This is a genuine pseudo-TTY — like a system terminal.
 */
export function XTerm({ ptyId, spec, fontSize = 12.5, onExit, onInitialInputSent }: XTermProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  // Keep the latest callback without re-running the (ptyId-keyed) effect.
  const onSentRef = useRef(onInitialInputSent)
  onSentRef.current = onInitialInputSent

  useEffect(() => {
    const host = hostRef.current
    if (!host || !window.api) return

    const accent =
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#e0574d'

    const term = new Terminal({
      fontFamily: "'Geist Mono', ui-monospace, monospace",
      fontSize,
      lineHeight: 1.2,
      theme: {
        background: '#0a0a0c',
        foreground: '#c8c8d0',
        cursor: accent,
        cursorAccent: '#0a0a0c',
        selectionBackground: 'rgba(255,255,255,0.16)'
      },
      cursorBlink: true,
      allowProposedApi: true,
      scrollback: 8000
    })
    const fit = new FitAddon()
    term.loadAddon(fit)
    term.loadAddon(new WebLinksAddon())
    term.open(host)

    const safeFit = (): void => {
      try {
        fit.fit()
      } catch {
        /* host has 0 size during layout */
      }
    }
    safeFit()

    void window.api.pty
      .create({ ...spec, id: ptyId, cols: term.cols || 80, rows: term.rows || 24 })
      .then((res) => {
        if (res && !res.ok) {
          term.writeln(`\x1b[31m${res.error ?? 'Failed to start.'}\x1b[0m`)
          return
        }
        // Only on a fresh spawn (not a reattach), deliver the initial prompt once
        // the agent CLI has had a moment to start up.
        if (res?.spawned && spec.initialInput) {
          const input = spec.initialInput
          // The PTY lives in main and survives this view unmounting, so the
          // write still lands even on a quick screen switch — no need to clear.
          setTimeout(() => {
            window.api?.pty.write(ptyId, `${input}\r`)
            // Mark it delivered so a future restart doesn't replay the prompt.
            onSentRef.current?.()
          }, 2500)
        }
      })
      .catch(() => {})

    const offData = window.api.pty.onData((e) => {
      if (e.id === ptyId) term.write(e.data)
    })
    const offExit = window.api.pty.onExit((e) => {
      if (e.id !== ptyId) return
      term.writeln(`\r\n\x1b[90m[process exited (${e.exitCode})]\x1b[0m`)
      onExit?.(e.exitCode)
    })
    const inputDisp = term.onData((data) => window.api?.pty.write(ptyId, data))

    const sendResize = (): void => {
      safeFit()
      window.api?.pty.resize(ptyId, term.cols, term.rows)
    }
    const ro = new ResizeObserver(() => sendResize())
    ro.observe(host)
    sendResize()
    term.focus()

    return () => {
      // Detach the view only — leave the PTY alive in main so switching screens
      // doesn't kill running agents. It's killed on explicit stop/close/quit.
      ro.disconnect()
      inputDisp.dispose()
      offData?.()
      offExit?.()
      term.dispose()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptyId])

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} onClick={() => hostRef.current?.querySelector('textarea')?.focus()} />
}
