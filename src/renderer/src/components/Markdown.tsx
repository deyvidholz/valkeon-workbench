import { useEffect, useRef, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import mermaid from 'mermaid'

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'strict', fontFamily: 'Geist Mono, monospace' })

let mermaidSeq = 0

function MermaidBlock({ code }: { code: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let cancelled = false
    const id = `mmd-${mermaidSeq++}`
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
  }, [code])
  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        justifyContent: 'center',
        background: '#0a0a0d',
        border: '1px solid #1c1c22',
        borderRadius: 8,
        padding: 12,
        margin: '10px 0',
        overflowX: 'auto'
      }}
    />
  )
}

const preStyle = {
  background: '#0a0a0d',
  border: '1px solid #1c1c22',
  borderRadius: 8,
  padding: 10,
  fontFamily: "'Geist Mono', monospace",
  fontSize: 11.5,
  color: '#a9b2bd',
  overflowX: 'auto' as const,
  margin: '8px 0'
}

/** Renders card markdown with GFM tables/checkboxes and live mermaid diagrams. */
export function Markdown({ source }: { source: string }) {
  return (
    <div className="md" style={{ fontSize: 13, color: '#cdd3da', lineHeight: 1.65 }}>
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
                  background: '#16161d',
                  border: '1px solid #232330',
                  borderRadius: 4,
                  padding: '1px 5px',
                  fontFamily: "'Geist Mono', monospace",
                  fontSize: 12,
                  color: '#d6dce3'
                }}
              >
                {children}
              </code>
            )
          },
          h1: ({ children }) => <h1 style={{ fontSize: 19, fontWeight: 600, color: '#f1f1f4', margin: '14px 0 8px' }}>{children}</h1>,
          h2: ({ children }) => <h2 style={{ fontSize: 16, fontWeight: 600, color: '#ededf0', margin: '14px 0 7px' }}>{children}</h2>,
          h3: ({ children }) => <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e4e4ea', margin: '12px 0 6px' }}>{children}</h3>,
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
            <blockquote style={{ borderLeft: '3px solid #2a2a32', paddingLeft: 12, margin: '8px 0', color: '#9a9aa3' }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '10px 0' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th style={{ border: '1px solid #1f1f26', padding: '6px 9px', background: '#101015', textAlign: 'left', color: '#cbcbd2' }}>
              {children}
            </th>
          ),
          td: ({ children }: { children?: ReactNode }) => (
            <td style={{ border: '1px solid #1f1f26', padding: '6px 9px', color: '#a4a4ad' }}>{children}</td>
          ),
          hr: () => <hr style={{ border: 'none', borderTop: '1px solid #1c1c22', margin: '12px 0' }} />
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
