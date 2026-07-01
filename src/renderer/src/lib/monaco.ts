import * as monaco from 'monaco-editor'
import { loader } from '@monaco-editor/react'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'

/**
 * Wire Monaco to the *locally bundled* package (never a CDN — this is an offline
 * desktop app) and provide the right worker per language. The TS/JSON/CSS/HTML
 * language modes (registered by the `monaco-editor` barrel) request their own
 * workers on model creation; returning the plain editor worker for them would
 * error and leak an idle worker per file — so we branch on the label.
 */
let configured = false
export function setupMonaco(): void {
  if (configured) return
  configured = true
  ;(self as unknown as { MonacoEnvironment: unknown }).MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'typescript' || label === 'javascript') return new tsWorker()
      if (label === 'json') return new jsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new htmlWorker()
      return new editorWorker()
    }
  }
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
