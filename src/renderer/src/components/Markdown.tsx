import { useEffect, useRef, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'
import { useResolvedTheme } from '../theme/useResolvedTheme'

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict', fontFamily: 'Geist Mono, monospace' })

let mermaidSeq = 0

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const resolved = useResolvedTheme()
  useEffect(() => {
    let cancelled = false
    const id = `mmd-${mermaidSeq++}`
    // mermaid's theme is global; re-init to match the app theme before rendering.
    mermaid.initialize({ startOnLoad: false, theme: resolved === 'light' ? 'default' : 'dark', securityLevel: 'strict', fontFamily: 'Geist Mono, monospace' })
    mermaid
      .render(id, code)
      .then(({ svg }) => {
        if (!cancelled && ref.current) ref.current.innerHTML = svg
      })
      .catch(() => {
        if (!cancelled && ref.current) ref.current.textContent = code
      })
    return () => {
      cancelled = true
    }
  }, [code, resolved])
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: 'var(--bg)',
        border: '1px solid var(--line)',
        borderRadius: 8,
        padding: 12,
        margin: '10px 0',
        overflowX: 'auto'
      }}
    />
  )
}

const preStyle = {
  background: 'var(--bg)',
  border: '1px solid var(--line)',
  borderRadius: 8,
  padding: 10,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11.5,
  color: 'var(--text-2)',
  overflowX: 'auto' as const,
  margin: '8px 0'
}

/** Renders card markdown with GFM tables/checkboxes and live mermaid diagrams. */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="md" style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.65 }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre: ({ children }) => <>{children}</>,
          code({ className, children }) {
            const text = String(children ?? '')
            if (/language-mermaid/.test(className ?? '')) {
              return <MermaidBlock code={text.replace(/\n$/, '')} />
            }
            // A fenced block has a language class OR contains newlines; inline code never does.
            if (/language-/.test(className ?? '') || text.includes('\n')) {
              return (
                <pre style={preStyle}>
                  <code>{children}</code>
                </pre>
              )
            }
            return (
              <code
                style={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--line-2)',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  color: 'var(--text-2)'
                }}
              >
                {children}
              </code>
            )
          },
          h1: ({ children }) => <h1 style={{ fontSize: 19, fontWeight: 600, color: 'var(--text)', margin: '14px 0 8px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', margin: '14px 0 7px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', margin: '12px 0 6px' }}>{children}</h3>,
          p: ({ children }) => <p style={{ margin: '6px 0' }}>{children}</p>,
          a: ({ children, href }) => (
            <a href={href} style={{ color: 'var(--accent-hi)', textDecoration: 'none' }}>
              {children}
            </a>
          ),
          ul: ({ children }) => <ul style={{ paddingLeft: 20, margin: '6px 0' }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ paddingLeft: 20, margin: '6px 0' }}>{children}</ol>,
          li: ({ children }) => <li style={{ margin: '3px 0' }}>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote style={{ borderLeft: '3px solid var(--surface-4)', paddingLeft: 12, margin: '8px 0', color: 'var(--text-dim)' }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ border: '1px solid var(--surface-3)', padding: '6px 9px', background: 'var(--surface)', textAlign: 'left', color: 'var(--text-2)' }}>
              {children}
            </th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td style={{ border: '1px solid var(--surface-3)', padding: '6px 9px', color: 'var(--text-dim)' }}>{children}</td>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '12px 0' }} />
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
