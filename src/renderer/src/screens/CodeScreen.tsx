import { useEffect, useRef, useState } from 'react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { FileTree } from '../components/FileTree'
import { CodeViewer } from '../components/CodeViewer'
import type { FileNode } from '@shared/files'

interface PromptCfg {
  title: string
  placeholder: string
  initial: string
  confirmLabel: string
  onSubmit: (value: string) => void
}

const parentOf = (path: string): string => (path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '')

/** VS Code-style file explorer + read-only Monaco viewer, with create/rename/delete. */
export function CodeScreen() {
  const { t } = useTranslation()
  const project = useStore((s) => s.project)
  const activeWorktreePath = useStore((s) => s.activeWorktreePath)
  const openContextMenu = useStore((s) => s.openContextMenu)
  const askConfirm = useStore((s) => s.askConfirm)
  const repoPath = activeWorktreePath ?? (project?.path && project.path.startsWith('/') ? project.path : null)

  const [tree, setTree] = useState<FileNode[] | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const [state, setState] = useState<'idle' | 'loading' | 'binary'>('idle')
  const [prompt, setPrompt] = useState<PromptCfg | null>(null)
  const [promptValue, setPromptValue] = useState('')
  const promptRef = useRef<HTMLInputElement>(null)

  const reloadTree = (): void => {
    if (!repoPath) return
    void window.api?.files.tree(repoPath).then(setTree).catch(() => setTree([]))
  }

  useEffect(() => {
    setTree(null)
    setSelected(null)
    setContent('')
    reloadTree()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repoPath])

  useEffect(() => {
    if (prompt) {
      setPromptValue(prompt.initial)
      setTimeout(() => promptRef.current?.select(), 0)
    }
  }, [prompt])

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

  const askName = (cfg: PromptCfg): void => setPrompt(cfg)
  const join = (dir: string, name: string): string => (dir ? `${dir}/${name}` : name)

  const createFileIn = (dir: string): void =>
    askName({
      title: t('code.newFile', 'New file'),
      placeholder: t('code.namePlaceholder', 'name.ext'),
      initial: '',
      confirmLabel: t('code.create', 'Create'),
      onSubmit: (name) => {
        if (!repoPath || !name) return
        const path = join(dir, name)
        void window.api?.files.createFile(repoPath, path).then(() => {
          reloadTree()
          if (dir) setExpanded((p) => new Set(p).add(dir))
          openFile(path)
        }).catch(() => {})
      }
    })

  const createFolderIn = (dir: string): void =>
    askName({
      title: t('code.newFolder', 'New folder'),
      placeholder: t('code.folderPlaceholder', 'folder-name'),
      initial: '',
      confirmLabel: t('code.create', 'Create'),
      onSubmit: (name) => {
        if (!repoPath || !name) return
        const path = join(dir, name)
        void window.api?.files.createDir(repoPath, path).then(() => {
          reloadTree()
          setExpanded((p) => new Set(p).add(path))
        }).catch(() => {})
      }
    })

  const renameNode = (node: FileNode): void =>
    askName({
      title: node.dir ? t('code.renameFolder', 'Rename folder') : t('code.renameFile', 'Rename file'),
      placeholder: t('code.newNamePlaceholder', 'new name'),
      initial: node.name,
      confirmLabel: t('code.rename', 'Rename'),
      onSubmit: (name) => {
        if (!repoPath || !name || name === node.name) return
        const next = join(parentOf(node.path), name)
        void window.api?.files.rename(repoPath, node.path, next).then(() => {
          reloadTree()
          if (selected === node.path) openFile(next)
        }).catch(() => {})
      }
    })

  const deleteNode = (node: FileNode): void =>
    askConfirm({
      title: node.dir ? t('code.deleteFolder', 'Delete folder') : t('code.deleteFile', 'Delete file'),
      message: node.dir
        ? t('code.deleteFolderMsg', 'Delete “{{name}}”? Everything inside it is removed. This cannot be undone.', { name: node.name })
        : t('code.deleteFileMsg', 'Delete “{{name}}”? This cannot be undone.', { name: node.name }),
      confirmLabel: t('code.delete', 'Delete'),
      onConfirm: () => {
        if (!repoPath) return
        void window.api?.files.remove(repoPath, node.path).then(() => {
          reloadTree()
          if (selected === node.path) {
            setSelected(null)
            setContent('')
          }
        }).catch(() => {})
      }
    })

  const onContext = (e: MouseEvent<HTMLElement>, node: FileNode): void => {
    e.preventDefault()
    const dir = node.dir ? node.path : parentOf(node.path)
    openContextMenu(e.clientX, e.clientY, [
      { label: t('code.newFile', 'New file'), icon: 'note_add', onClick: () => createFileIn(dir) },
      { label: t('code.newFolder', 'New folder'), icon: 'create_new_folder', onClick: () => createFolderIn(dir) },
      { label: t('code.rename', 'Rename'), icon: 'edit', onClick: () => renameNode(node) },
      { label: t('code.delete', 'Delete'), icon: 'delete_outline', danger: true, onClick: () => deleteNode(node) }
    ])
  }

  if (!repoPath) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--text-muted)' }}>
        <Icon name="code_off" size={26} color="#33333a" />
        <div style={{ fontSize: 13 }}>{t('code.emptyProject', 'Open a project folder to explore its code.')}</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0, position: 'relative' }}>
      <div style={{ width: 264, flexShrink: 0, borderRight: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '0 8px 0 14px', borderBottom: '1px solid var(--line)' }}>
          <Icon name="folder_open" size={16} color="var(--info)" />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 3 }}>{project?.name ?? t('code.files', 'Files')}</span>
          <div style={{ flex: 1 }} />
          {[
            { icon: 'note_add', title: t('code.newFile', 'New file'), on: () => createFileIn('') },
            { icon: 'create_new_folder', title: t('code.newFolder', 'New folder'), on: () => createFolderIn('') },
            { icon: 'refresh', title: t('code.reload', 'Reload'), on: reloadTree }
          ].map((b) => (
            <Hover key={b.title} as="span" title={b.title} onClick={b.on} style={{ display: 'flex', width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
              <Icon name={b.icon} size={15} />
            </Hover>
          ))}
        </div>
        <div style={{ flex: 1, overflow: 'auto', minHeight: 0, padding: '6px 6px 16px' }}>
          {tree === null ? (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--text-faint)' }}>{t('code.loading', 'Loading…')}</div>
          ) : tree.length === 0 ? (
            <div style={{ padding: 12, fontSize: 12, color: 'var(--text-faint)' }}>{t('code.emptyFolder', 'Empty folder.')}</div>
          ) : (
            <FileTree nodes={tree} selected={selected} expanded={expanded} onSelect={openFile} onToggle={toggle} onContext={onContext} />
          )}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0, background: 'var(--bg)' }}>
        {selected && (
          <div style={{ height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11.5, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace" }}>{selected}</span>
          </div>
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          {!selected ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>{t('code.selectFile', 'Select a file to view it')}</div>
          ) : state === 'binary' ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>{t('code.binary', 'Binary or file too large to display.')}</div>
          ) : state === 'loading' ? (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)', fontSize: 12.5 }}>{t('code.loading', 'Loading…')}</div>
          ) : (
            <CodeViewer path={selected} content={content} />
          )}
        </div>
      </div>

      {prompt && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 40, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 120, background: 'var(--scrim)' }}>
          <div onClick={() => setPrompt(null)} style={{ position: 'absolute', inset: 0 }} />
          <div style={{ position: 'relative', width: 380, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 12, padding: 16, boxShadow: '0 24px 70px var(--shadow)' }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', marginBottom: 10 }}>{prompt.title}</div>
            <input
              ref={promptRef}
              value={promptValue}
              onChange={(e) => setPromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { const v = promptValue.trim(); setPrompt(null); if (v) prompt.onSubmit(v) }
                if (e.key === 'Escape') setPrompt(null)
              }}
              placeholder={prompt.placeholder}
              autoFocus
              style={{ width: '100%', background: 'var(--bg)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '9px 11px', color: 'var(--text)', fontSize: 13, fontFamily: "'Geist Mono', monospace" }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 9, marginTop: 13 }}>
              <Hover as="span" onClick={() => setPrompt(null)} style={{ padding: '7px 13px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>{t('code.cancel', 'Cancel')}</Hover>
              <Hover as="span" onClick={() => { const v = promptValue.trim(); setPrompt(null); if (v) prompt.onSubmit(v) }} style={{ padding: '7px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>{prompt.confirmLabel}</Hover>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
