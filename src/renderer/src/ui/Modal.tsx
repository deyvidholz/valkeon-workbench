import type { CSSProperties, ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  width: number
  zIndex?: number
  children: ReactNode
  panelStyle?: CSSProperties
}

/** Centered modal scaffold: dimmed backdrop (click to close) + a fade-in panel. */
export function Modal({ onClose, width, zIndex = 50, children, panelStyle }: ModalProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--scrim)'
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0 }} />
      <div
        style={{
          position: 'relative',
          width,
          maxHeight: '88%',
          background: 'var(--bg)',
          border: '1px solid var(--line-2)',
          borderRadius: 14,
          boxShadow: '0 30px 80px var(--shadow)',
          animation: 'fadein .2s ease',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          ...panelStyle
        }}
      >
        {children}
      </div>
    </div>
  )
}
