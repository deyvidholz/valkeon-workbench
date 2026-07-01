import type { FileNode } from '@shared/files'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

/** Material Symbols glyph for a file, by extension. */
function iconFor(name: string): string {
  const ext = name.slice(name.lastIndexOf('.') + 1).toLowerCase()
  if (/^(ts|tsx|js|jsx|mjs|cjs)$/.test(ext)) return 'javascript'
  if (ext === 'json') return 'data_object'
  if (/^(md|markdown|txt)$/.test(ext)) return 'description'
  if (/^(css|scss|less|html|htm)$/.test(ext)) return 'html'
  if (/^(png|jpg|jpeg|gif|svg|webp|ico)$/.test(ext)) return 'image'
  if (/^(yml|yaml|toml|ini|env|lock)$/.test(ext)) return 'settings'
  if (/^(sh|bash|zsh)$/.test(ext)) return 'terminal'
  return 'insert_drive_file'
}

interface FileTreeProps {
  nodes: FileNode[]
  depth?: number
  selected: string | null
  expanded: Set<string>
  onSelect: (path: string) => void
  onToggle: (path: string) => void
}

export function FileTree({ nodes, depth = 0, selected, expanded, onSelect, onToggle }: FileTreeProps) {
  return (
    <>
      {nodes.map((n) => {
        const pad = 8 + depth * 13
        if (n.dir) {
          const open = expanded.has(n.path)
          return (
            <div key={n.path}>
              <Hover
                onClick={() => onToggle(n.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: `4px 8px 4px ${pad}px`, borderRadius: 6, cursor: 'pointer', color: '#b7b7c0', fontSize: 12.5, whiteSpace: 'nowrap' }}
                hover={{ background: '#141419' }}
              >
                <Icon name={open ? 'expand_more' : 'chevron_right'} size={16} color="#6b6b74" />
                <Icon name={open ? 'folder_open' : 'folder'} size={15} color="#7c9bd0" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</span>
              </Hover>
              {open && n.children && n.children.length > 0 && (
                <FileTree nodes={n.children} depth={depth + 1} selected={selected} expanded={expanded} onSelect={onSelect} onToggle={onToggle} />
              )}
            </div>
          )
        }
        const on = selected === n.path
        return (
          <Hover
            key={n.path}
            onClick={() => onSelect(n.path)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `4px 8px 4px ${pad + 16}px`, borderRadius: 6, cursor: 'pointer', color: on ? '#ededf0' : '#9a9aa3', background: on ? '#15151c' : 'transparent', fontSize: 12.5, whiteSpace: 'nowrap' }}
            hover={on ? undefined : { background: '#111116' }}
          >
            <Icon name={iconFor(n.name)} size={15} color={on ? 'var(--accent-hi)' : '#6f6f78'} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.name}</span>
          </Hover>
        )
      })}
    </>
  )
}
