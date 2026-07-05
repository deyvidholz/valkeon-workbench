import Editor from '@monaco-editor/react'
import { setupMonaco, languageForPath, monacoThemeFor, defineMonacoTheme } from '../lib/monaco'
import { useResolvedTheme } from '../theme/useResolvedTheme'

setupMonaco()

interface CodeViewerProps {
  path: string
  content: string
  /** Read-only by default (browsing). */
  readOnly?: boolean
}

/** A single-file Monaco viewer with app-tuned dark theme + syntax highlighting. */
export function CodeViewer({ path, content, readOnly = true }: CodeViewerProps) {
  const resolved = useResolvedTheme()
  return (
    <Editor
      height="100%"
      path={path}
      theme={monacoThemeFor(resolved)}
      language={languageForPath(path)}
      value={content}
      beforeMount={(m) => defineMonacoTheme(m)}
      loading={<div style={{ color: 'var(--text-faint)', fontSize: 12 }}>Loading editor…</div>}
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
