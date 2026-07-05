import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { DialogHeader } from './parts'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function GenerateCardsDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.genOpen)
  const genText = useStore((s) => s.genText)
  const setGenText = useStore((s) => s.setGenText)
  const genColumn = useStore((s) => s.genColumn)
  const setGenColumn = useStore((s) => s.setGenColumn)
  const genCount = useStore((s) => s.genCount)
  const setGenCount = useStore((s) => s.setGenCount)
  const genLoading = useStore((s) => s.genLoading)
  const genError = useStore((s) => s.genError)
  const generate = useStore((s) => s.generateCards)
  const close = useStore((s) => s.closeGen)
  const boards = useStore((s) => s.boards)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const wsId = useStore((s) => s.activeWorkspaceId)
  if (!open) return null

  const board = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => b.wsId === wsId)
  const columns = board?.columns ?? []
  const canGenerate = genText.trim().length > 0 && !genLoading

  return (
    <Modal onClose={genLoading ? () => {} : close} width={540} zIndex={50} panelStyle={{ padding: 20 }}>
      <DialogHeader
        icon="auto_awesome"
        title={t('generateCards.title', 'Generate cards with AI')}
        subtitle={<>{t('generateCards.subtitleBefore', 'Describe a feature or paste a spec. Tasks are drafted into ')}<span style={{ color: 'var(--text-dim)' }}>{board?.name}</span>.</>}
      />
      <textarea
        value={genText}
        onChange={(e) => setGenText(e.target.value)}
        placeholder={t('generateCards.placeholder', 'e.g. Add SSO with Google and Okta, including session handling and an admin toggle…')}
        autoFocus
        disabled={genLoading}
        style={{ width: '100%', minHeight: 108, resize: 'vertical', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 10, padding: 13, color: 'var(--text)', fontSize: 13, lineHeight: 1.55, fontFamily: "'Geist', sans-serif", marginBottom: 14, opacity: genLoading ? 0.6 : 1 }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('generateCards.column', 'Column')}</span>
          <select
            value={genColumn}
            onChange={(e) => setGenColumn(e.target.value as typeof genColumn)}
            disabled={genLoading}
            style={{ background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '6px 10px', color: 'var(--text-2)', fontSize: 12.5, cursor: 'pointer' }}
          >
            {columns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('generateCards.count', 'Max cards')}</span>
          <input
            type="number"
            min={1}
            max={12}
            value={genCount}
            onChange={(e) => setGenCount(Number(e.target.value))}
            disabled={genLoading}
            style={{ width: 58, background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 8, padding: '6px 8px', color: 'var(--text-2)', fontSize: 12.5 }}
          />
        </div>
      </div>

      {genError && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', borderRadius: 9, background: 'color-mix(in srgb, var(--danger) 12%, transparent)', border: '1px solid color-mix(in srgb, var(--danger) 40%, transparent)', marginBottom: 14 }}>
          <Icon name="error" size={16} color="var(--danger)" style={{ marginTop: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--danger)', lineHeight: 1.45 }}>{genError}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <Hover as="span" onClick={genLoading ? undefined : close} style={{ padding: '9px 15px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: genLoading ? 'not-allowed' : 'pointer', opacity: genLoading ? 0.5 : 1 }} hover={genLoading ? {} : { background: 'var(--surface-2)' }}>
          {t('generateCards.cancel', 'Cancel')}
        </Hover>
        <Hover
          as="span"
          onClick={() => canGenerate && generate()}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.5 }}
          hover={canGenerate ? { filter: 'brightness(1.08)' } : {}}
        >
          {genLoading ? (
            <><span className="ms" style={{ fontSize: 16, animation: 'spin 1s linear infinite' }}>progress_activity</span>{t('generateCards.generating', 'Generating…')}</>
          ) : (
            <><Icon name="auto_awesome" size={16} />{genError ? t('generateCards.retry', 'Retry') : t('generateCards.confirm', 'Generate cards')}</>
          )}
        </Hover>
      </div>
    </Modal>
  )
}
