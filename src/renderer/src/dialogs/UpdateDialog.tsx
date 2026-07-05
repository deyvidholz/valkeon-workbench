import { useEffect, useState } from 'react'
import type { UpdaterEvent, UpdateCapability } from '@shared/ipc'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

type Phase = 'hidden' | 'available' | 'downloading' | 'downloaded' | 'error'

interface State {
  phase: Phase
  version: string
  notes?: string
  capability: UpdateCapability
  percent: number
  message?: string
}

const INITIAL: State = { phase: 'hidden', version: '', capability: 'manual', percent: 0 }

/**
 * A non-blocking update prompt anchored bottom-right. Driven entirely by
 * `updater` events from main, so it stays out of the global store. Offers
 * Skip / Later / (Download+install | Get update) per the install's capability.
 */
export function UpdateDialog() {
  const [s, setS] = useState<State>(INITIAL)

  useEffect(() => {
    return window.api?.updater?.onEvent((e: UpdaterEvent) => {
      setS((prev) => {
        switch (e.kind) {
          case 'available':
            return { phase: 'available', version: e.version, notes: e.notes, capability: e.capability, percent: 0 }
          case 'progress':
            // Ignore stray progress if we're not actively downloading.
            return prev.phase === 'downloading' || prev.phase === 'available'
              ? { ...prev, phase: 'downloading', percent: e.percent }
              : prev
          case 'downloaded':
            return { ...prev, phase: 'downloaded', version: e.version }
          case 'error':
            // Only surface errors once the user has engaged (not the silent check).
            return prev.phase === 'downloading' ? { ...prev, phase: 'error', message: e.message } : prev
          case 'none':
          default:
            return prev
        }
      })
    })
  }, [])

  if (s.phase === 'hidden') return null

  const hide = (): void => setS(INITIAL)
  const skip = (): void => {
    void window.api?.updater?.skip(s.version)
    hide()
  }
  const primary = (): void => {
    if (s.capability === 'auto') {
      setS((p) => ({ ...p, phase: 'downloading', percent: 0 }))
      void window.api?.updater?.download()
    } else {
      void window.api?.updater?.openReleases()
      hide()
    }
  }

  const title =
    s.phase === 'downloaded'
      ? 'Update ready'
      : s.phase === 'error'
        ? "Update didn't finish"
        : s.phase === 'downloading'
          ? 'Downloading update…'
          : 'Update available'

  const primaryLabel = s.capability === 'auto' ? 'Download & install' : 'Get the update'

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        zIndex: 65,
        width: 344,
        background: 'var(--bg)',
        border: '1px solid var(--line-2)',
        borderRadius: 13,
        padding: 16,
        boxShadow: '0 24px 60px var(--shadow)',
        animation: 'fadein .16s ease'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            borderRadius: 8,
            background: 'var(--accent-soft, rgba(120,160,255,0.14))',
            color: 'var(--accent, #7aa2ff)'
          }}
        >
          <Icon name={s.phase === 'downloaded' ? 'restart_alt' : s.phase === 'error' ? 'error' : 'download'} size={18} />
        </span>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{title}</span>
          <span style={{ fontSize: 11.5, color: 'var(--text-dim)' }}>Valkeon Workbench {s.version}</span>
        </div>
      </div>

      {s.phase === 'error' && s.message && (
        <div style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.5, marginBottom: 12 }}>{s.message}</div>
      )}

      {s.notes && s.phase === 'available' && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            lineHeight: 1.5,
            marginBottom: 12,
            maxHeight: 96,
            overflowY: 'auto',
            whiteSpace: 'pre-wrap'
          }}
        >
          {s.notes}
        </div>
      )}

      {s.phase === 'downloading' && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ height: 6, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${s.percent}%`,
                background: 'var(--accent, #7aa2ff)',
                transition: 'width .2s ease'
              }}
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 6 }}>{s.percent}%</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
        {s.phase === 'available' && (
          <>
            <Hover
              as="span"
              onClick={skip}
              style={{ padding: '7px 11px', borderRadius: 7, color: 'var(--text-dim)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
              hover={{ color: 'var(--text-2)' }}
            >
              Skip this version
            </Hover>
            <Hover
              as="span"
              onClick={hide}
              style={{ padding: '7px 12px', borderRadius: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line-2)' }}
              hover={{ background: 'var(--surface-3)' }}
            >
              Later
            </Hover>
            <Hover
              as="span"
              onClick={primary}
              style={{ padding: '7px 13px', borderRadius: 7, background: 'var(--accent, #4d7ce0)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              hover={{ filter: 'brightness(1.08)' }}
            >
              {primaryLabel}
            </Hover>
          </>
        )}

        {s.phase === 'downloading' && (
          <Hover
            as="span"
            onClick={hide}
            style={{ padding: '7px 12px', borderRadius: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line-2)' }}
            hover={{ background: 'var(--surface-3)' }}
          >
            Hide
          </Hover>
        )}

        {s.phase === 'downloaded' && (
          <>
            <Hover
              as="span"
              onClick={hide}
              style={{ padding: '7px 12px', borderRadius: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line-2)' }}
              hover={{ background: 'var(--surface-3)' }}
            >
              Later
            </Hover>
            <Hover
              as="span"
              onClick={() => void window.api?.updater?.install()}
              style={{ padding: '7px 13px', borderRadius: 7, background: 'var(--accent, #4d7ce0)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              hover={{ filter: 'brightness(1.08)' }}
            >
              Restart & install
            </Hover>
          </>
        )}

        {s.phase === 'error' && (
          <>
            <Hover
              as="span"
              onClick={() => void window.api?.updater?.openReleases()}
              style={{ padding: '7px 12px', borderRadius: 7, color: 'var(--text-2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--line-2)' }}
              hover={{ background: 'var(--surface-3)' }}
            >
              Open Releases
            </Hover>
            <Hover
              as="span"
              onClick={hide}
              style={{ padding: '7px 13px', borderRadius: 7, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              hover={{ background: 'var(--surface-3)' }}
            >
              Dismiss
            </Hover>
          </>
        )}
      </div>
    </div>
  )
}
