import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'

/**
 * Wire Monaco to the *locally bundled* package (never a CDN — this is an offline
 * desktop app) and provide the base editor worker. Language-service workers
 * (ts/json/…) are intentionally skipped: we use Monaco as a read-only code +
 * diff viewer, where syntax highlighting runs on the main thread and the heavy
 * language workers aren't needed.
 */
let configured = false
export function setupMonaco(): void {
  if (configured) return
  configured = true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(self as any).MonacoEnvironment = { getWorker: () => new editorWorker() }
  loader.config({ monaco })
}

/** Map a file path to a Monaco language id for highlighting. */
export function languageForPath(path: string): string {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    json: 'json', md: 'markdown', markdown: 'markdown', css: 'css', scss: 'scss', less: 'less',
    html: 'html', htm: 'html', xml: 'xml', yml: 'yaml', yaml: 'yaml', toml: 'ini', ini: 'ini',
    sh: 'shell', bash: 'shell', zsh: 'shell', py: 'python', rb: 'ruby', go: 'go', rs: 'rust',
    java: 'java', c: 'c', h: 'c', cpp: 'cpp', hpp: 'cpp', cs: 'csharp', php: 'php', sql: 'sql',
    swift: 'swift', kt: 'kotlin', vue: 'html', svelte: 'html', dockerfile: 'dockerfile'
  }
  return map[ext] ?? 'plaintext'
}

export const MONACO_THEME = 'valkeon-dark'

/** Define a dark theme tuned to the app palette (idempotent). */
export function defineMonacoTheme(m: typeof monaco): void {
  m.editor.defineTheme(MONACO_THEME, {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#0a0a0c',
      'editorGutter.background': '#0a0a0c',
      'editor.lineHighlightBackground': '#12121788',
      'editorLineNumber.foreground': '#3a3a42',
      'editorLineNumber.activeForeground': '#8a8a93',
      'editor.selectionBackground': '#26314a',
      'diffEditor.insertedTextBackground': '#1f3a2a55',
      'diffEditor.removedTextBackground': '#3a1f2255',
      'editorWidget.background': '#101014',
      'editorWidget.border': '#25252d'
    }
  })
}
