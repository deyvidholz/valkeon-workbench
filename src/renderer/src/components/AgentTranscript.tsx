import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'
import type { SessionStatus, TranscriptLine, LineType } from '@shared/domain'
import { Icon } from '../ui/Icon'
import { Markdown } from './Markdown'

const mono = "'Geist Mono', monospace"

/** Renders a structured session's transcript: agent prose, tool calls, commands, errors. */
export function AgentTranscript({ lines, status, sessionName }: { lines: TranscriptLine[]; status: SessionStatus; sessionName: string }) {
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [lines.length, status])

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '18px 20px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {lines.length === 0 && status !== 'running' && (
        <div style={{ margin: 'auto', textAlign: 'center', color: '#56565e', fontSize: 12.5 }}>
          <Icon name="auto_awesome" size={26} color="#33333a" />
          <div style={{ marginTop: 8 }}>Send a message to start working with {sessionName}.</div>
        </div>
      )}
      {lines.map((line, i) => (
        <Line key={i} line={line} />
      ))}
      {status === 'running' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7a7a83', fontSize: 12 }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#5cc98a', display: 'inline-block', animation: 'pulse 1.6s infinite' }} />
          Working…
        </div>
      )}
      <div ref={endRef} />
    </div>
  )
}

function Line({ line }: { line: TranscriptLine }) {
  if (line.type === 'user') {
    return (
      <div style={{ alignSelf: 'flex-end', maxWidth: '82%', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: '12px 12px 4px 12px', padding: '9px 13px' }}>
        <div style={{ fontSize: 13, color: '#e9e9ee', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{line.text}</div>
      </div>
    )
  }
  if (line.type === 'text') {
    return (
      <div style={{ maxWidth: '92%', fontSize: 13, color: '#cdd2da', lineHeight: 1.6 }}>
        <Markdown source={line.text} />
      </div>
    )
  }
  return <CompactLine type={line.type} text={line.text} />
}

const COMPACT: Partial<Record<LineType, { icon: string; color: string; bg: string; prefix?: string }>> = {
  tool: { icon: 'build', color: '#8a8a93', bg: '#0e0e12' },
  cmd: { icon: 'terminal', color: '#88b2da', bg: '#0c0f12', prefix: '$ ' },
  file: { icon: 'description', color: '#7dd99a', bg: '#0c110d' },
  err: { icon: 'error_outline', color: '#e07a6e', bg: '#140e0e' },
  sys: { icon: 'info', color: '#6b6b74', bg: '#0e0e12' },
  ok: { icon: 'check_circle', color: '#5cc98a', bg: '#0c110d' },
  out: { icon: 'chevron_right', color: '#73737c', bg: '#0e0e12' }
}

function CompactLine({ type, text }: { type: LineType; text: string }) {
  const s = COMPACT[type] ?? COMPACT.sys!
  const wrap: CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 10px', borderRadius: 8, background: s.bg, border: '1px solid #16161c' }
  return (
    <div style={wrap}>
      <Icon name={s.icon} size={14} color={s.color} style={{ marginTop: 1, flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, color: s.color, fontFamily: mono, lineHeight: 1.5, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
        {s.prefix}
        {text}
      </span>
    </div>
  )
}
