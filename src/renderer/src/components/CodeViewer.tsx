import Editor from '@monaco-editor/react'
import { setupMonaco, languageForPath, MONACO_THEME, defineMonacoTheme } from '../lib/monaco'

setupMonaco()

interface CodeViewerProps {
  path: string
  content: string
  /** Read-only by default (browsing). */
  readOnly?: boolean
}

/** A single-file Monaco viewer with app-tuned dark theme + syntax highlighting. */
export function CodeViewer({ path, content, readOnly = true }: CodeViewerProps) {
  return (
    <Editor
      height="100%"
      path={path}
      theme={MONACO_THEME}
      language={languageForPath(path)}
      value={content}
      beforeMount={(m) => defineMonacoTheme(m)}
      loading={<div style={{ color: '#56565e', fontSize: 12 }}>Loading editor…</div>}
      options={{
        readOnly,
        domReadOnly: readOnly,
        fontSize: 13,
        fontFamily: "'Geist Mono', ui-monospace, monospace",
        fontLigatures: false,
        minimap: { enabled: true, maxColumn: 90 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        renderWhitespace: 'none',
        lineNumbersMinChars: 3,
        padding: { top: 10 },
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
      }}
    />
  )
}
