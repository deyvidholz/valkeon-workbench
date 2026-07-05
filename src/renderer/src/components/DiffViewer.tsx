import { DiffEditor } from '@monaco-editor/react'
import { useTranslation } from 'react-i18next'
import type { editor } from 'monaco-editor'
import { setupMonaco, languageForPath, MONACO_THEME, defineMonacoTheme } from '../lib/monaco'

setupMonaco()

interface DiffViewerProps {
  path: string
  original: string
  modified: string
  /** Called with the 1-based line the cursor lands on in the modified pane. */
  onLine?: (line: number) => void
}

/** Side-by-side Monaco diff of one file (base vs working tree). */
export function DiffViewer({ path, original, modified, onLine }: DiffViewerProps) {
  const { t } = useTranslation()
  return (
    <DiffEditor
      height="100%"
      theme={MONACO_THEME}
      language={languageForPath(path)}
      original={original}
      modified={modified}
      keepCurrentOriginalModel={false}
      keepCurrentModifiedModel={false}
      beforeMount={(m) => defineMonacoTheme(m)}
      onMount={(ed) => {
        if (!onLine) return
        const mod = ed.getModifiedEditor()
        mod.onDidChangeCursorPosition((e: editor.ICursorPositionChangedEvent) => onLine(e.position.lineNumber))
      }}
      loading={<div style={{ color: 'var(--text-faint)', fontSize: 12 }}>{t('diffViewer.loading', 'Loading diff…')}</div>}
      options={{
        readOnly: true,
        renderSideBySide: true,
        fontSize: 12.5,
        fontFamily: "'Geist Mono', ui-monospace, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        automaticLayout: true,
        lineNumbersMinChars: 3,
        renderOverviewRuler: false,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 }
      }}
    />
  )
}
