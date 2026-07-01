import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { FileTree } from '../components/FileTree'
import { CodeViewer } from '../components/CodeViewer'
import type { FileNode } from '@shared/files'

/** VS Code-style file explorer + read-only Monaco viewer for the project. */
export function CodeScreen() {
  const project = useStore((s) => s.project)
  const activeWorktreePath = useStore((s) => s.activeWorktreePath)
  const repoPath = activeWorktreePath ?? (project?.path && project.path.startsWith('/') ? project.path : null)

  const [tree, setTree] = useState<FileNode[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'binary'>('idle')

  useEffect(() => {
    setTree(null)
    setSelected(null)
    setContent('')
    if (!repoPath) return
    let active = true
    void window.api?.files
      .tree(repoPath)
      .then((t) => active && setTree(t))
      .catch(() => active && setTree([]))
    return () => {
      active = false
    }
  }, [repoPath])

  const openFile = (path: string): void => {
    if (!repoPath) return
    setSelected(path)
    setState('loading')
    void window.api?.files
      .read(repoPath, path)
      .then((f) => {
        if (f.truncated) {
          setState('binary')
          setContent('')
        } else {
          setContent(f.content)
          setState('idle')
        }
      })
      .catch(() => setState('binary'))
  }
  const toggle = (path: string): void =>
    setExpanded((prev) => {
      const n = new Set(prev)
      if (n.has(path)) n.delete(path)
      else n.add(path)
      return n
    })

  if (!repoPath) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#6b6b74' }}>
        <Icon name="code_off" size={26} color="#33333a" />
        <div style={{ fontSize: 13 }}>Open a project folder to explore its code.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ width: 264, flexShrink: 0, borderRight: '1px solid #16161a', background: '#0a0a0c', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid #16161a' }}>
          <Icon name="folder_open" size={16} color="#7c9bd0" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#cbcbd2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{project?.name ?? 'Files'}</span>
          <div style={{ flex: 1 }} />
          <Hover as="span" title="Reload tree" onClick={() => repoPath && window.api?.files.tree(repoPath).then(setTree).catch(() => {})} style={{ display: 'flex', width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: '#6f6f78', cursor: 'pointer' }} hover={{ background: '#16161d', color: '#cfcfd6' }}>
            <Icon name="refresh" size={15} />
          </Hover>
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '6px 6px 16px' }}>
          {tree === null ? (
            <div style={{ padding: 12, fontSize: 12, color: '#56565e' }}>Loading…</div>
          ) : tree.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: '#56565e' }}>Empty folder.</div>
          ) : (
            <FileTree nodes={tree} selected={selected} expanded={expanded} onSelect={openFile} onToggle={toggle} />
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#0a0a0c' }}>
        {selected && (
          <div style={{ height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid #16161a' }}>
            <span style={{ fontSize: 11.5, color: '#8a8a93', fontFamily: "'Geist Mono', monospace" }}>{selected}</span>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          {!selected ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4d4d55', fontSize: 12.5 }}>Select a file to view it</div>
          ) : state === 'binary' ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#56565e', fontSize: 12.5 }}>Binary or file too large to display.</div>
          ) : state === 'loading' ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#56565e', fontSize: 12.5 }}>Loading…</div>
          ) : (
            <CodeViewer path={selected} content={content} />
          )}
        </div>
      </div>
    </div>
  )
}
