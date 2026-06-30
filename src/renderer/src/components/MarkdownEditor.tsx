import { useRef, useState, type CSSProperties } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Markdown } from './Markdown'

interface Applier {
  wrap: (before: string, after: string) => void
  prefix: (p: string) => void
}
interface Tool {
  title: string
  icon?: string
  text?: string
  run: (a: Applier) => void
}

const TOOLS: Tool[] = [
  { title: 'Heading 1', text: 'H1', run: (a) => a.prefix('# ') },
  { title: 'Heading 2', text: 'H2', run: (a) => a.prefix('## ') },
  { title: 'Heading 3', text: 'H3', run: (a) => a.prefix('### ') },
  { title: 'Bold', icon: 'format_bold', run: (a) => a.wrap('**', '**') },
  { title: 'Italic', icon: 'format_italic', run: (a) => a.wrap('*', '*') },
  { title: 'Strikethrough', icon: 'strikethrough_s', run: (a) => a.wrap('~~', '~~') },
  { title: 'Link', icon: 'link', run: (a) => a.wrap('[', '](https://)') },
  { title: 'Inline code', icon: 'code', run: (a) => a.wrap('`', '`') },
  { title: 'Bulleted list', icon: 'format_list_bulleted', run: (a) => a.prefix('- ') },
  { title: 'Numbered list', icon: 'format_list_numbered', run: (a) => a.prefix('1. ') },
  { title: 'Checklist', icon: 'checklist', run: (a) => a.prefix('- [ ] ') },
  { title: 'Quote', icon: 'format_quote', run: (a) => a.wrap('> ', '') },
  { title: 'Code block', icon: 'data_object', run: (a) => a.wrap('```\n', '\n```') }
]

interface MarkdownEditorProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  minHeight?: number
}

/** The shared rich markdown editor: formatting toolbar + Table/Diagram builders + Write/Preview. */
export function MarkdownEditor({ value, onChange, placeholder, minHeight = 200 }: MarkdownEditorProps) {
  const openTable = useStore((s) => s.openTable)
  const openDiag = useStore((s) => s.openDiag)
  const setMdAppend = useStore((s) => s.setMdAppend)
  const ref = useRef<HTMLTextAreaElement>(null)
  const [tab, setTab] = useState<'write' | 'preview'>('write')

  const applier: Applier = {
    wrap: (before, after) => {
      const ta = ref.current
      if (!ta) return
      const { selectionStart: a, selectionEnd: b, value: v } = ta
      onChange(v.slice(0, a) + before + v.slice(a, b) + after + v.slice(b))
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(a + before.length, b + before.length)
      })
    },
    prefix: (p) => {
      const ta = ref.current
      if (!ta) return
      const { selectionStart: a, value: v } = ta
      const lineStart = v.lastIndexOf('\n', a - 1) + 1
      onChange(v.slice(0, lineStart) + p + v.slice(lineStart))
      requestAnimationFrame(() => {
        ta.focus()
        ta.setSelectionRange(a + p.length, a + p.length)
      })
    }
  }

  // Register an "append to this editor" target so the Table/Diagram builders
  // insert into whichever editor opened them.
  const registerAppend = (): void =>
    setMdAppend((md) => {
      const v = ref.current?.value ?? value
      onChange(v ? `${v}\n\n${md}` : md)
    })

  const tabStyle = (on: boolean): CSSProperties => ({ padding: '4px 11px', borderRadius: 6, fontSize: 11.5, fontWeight: 500, cursor: 'pointer', color: on ? '#0a1018' : '#9a9aa3', background: on ? 'var(--accent)' : 'transparent' })
  const toolBtn: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 27, height: 27, borderRadius: 6, color: '#9a9aa3', cursor: 'pointer' }

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, padding: '5px 6px', background: '#0c0c0f', border: '1px solid #1c1c22', borderBottom: 'none', borderRadius: '9px 9px 0 0' }}>
        {TOOLS.map((t) => (
          <Hover key={t.title} as="span" title={t.title} onClick={() => t.run(applier)} style={toolBtn} hover={{ background: '#1a1a20', color: '#e4e4ea' }}>
            {t.icon ? <Icon name={t.icon} size={17} /> : <span style={{ fontSize: 11, fontWeight: 700, fontFamily: "'Geist Mono', monospace" }}>{t.text}</span>}
          </Hover>
        ))}
        <Hover as="span" title="Table builder" onClick={() => { registerAppend(); openTable() }} style={toolBtn} hover={{ background: '#1a1a20', color: '#e4e4ea' }}>
          <Icon name="table_chart" size={17} />
        </Hover>
        <Hover as="span" title="Diagram builder" onClick={() => { registerAppend(); openDiag() }} style={toolBtn} hover={{ background: '#1a1a20', color: '#e4e4ea' }}>
          <Icon name="schema" size={17} />
        </Hover>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', background: '#0e0e12', border: '1px solid #1c1c22', borderRadius: 7, padding: 2, gap: 2 }}>
          <span onClick={() => setTab('write')} style={tabStyle(tab === 'write')}>Write</span>
          <span onClick={() => setTab('preview')} style={tabStyle(tab === 'preview')}>Preview</span>
        </div>
      </div>
      {tab === 'write' ? (
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', minHeight, resize: 'vertical', background: '#0c0c0f', border: '1px solid #1c1c22', borderRadius: '0 0 9px 9px', padding: 12, color: '#cdd3da', fontSize: 12.5, lineHeight: 1.6, fontFamily: "'Geist Mono', monospace" }}
        />
      ) : (
        <div style={{ minHeight, background: '#0c0c0f', border: '1px solid #1c1c22', borderTop: 'none', borderRadius: '0 0 9px 9px', padding: 14 }}>
          {value.trim() ? <Markdown source={value} /> : <div style={{ fontSize: 12.5, color: '#56565e' }}>Nothing to preview yet.</div>}
        </div>
      )}
    </div>
  )
}
