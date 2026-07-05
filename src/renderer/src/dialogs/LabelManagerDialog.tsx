import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { LabelChip } from '../ui/LabelChip'
import { inputStyle } from './parts'
import { LABEL_PALETTE } from '../data/seed'

export function LabelManagerDialog() {
  const { t } = useTranslation()
  const open = useStore((s) => s.labelMgrOpen)
  const boards = useStore((s) => s.boards)
  const activeBoardId = useStore((s) => s.activeBoardId)
  const wsId = useStore((s) => s.activeWorkspaceId)
  const newLabel = useStore((s) => s.newLabel)
  const setNewLabel = useStore((s) => s.setNewLabel)
  const addBoardLabel = useStore((s) => s.addBoardLabel)
  const deleteBoardLabel = useStore((s) => s.deleteBoardLabel)
  const cycleLabelColor = useStore((s) => s.cycleLabelColor)
  const close = useStore((s) => s.closeLabelMgr)
  if (!open) return null

  const board = boards.find((b) => b.id === activeBoardId) ?? boards.find((b) => b.wsId === wsId)
  if (!board) return null
  const usage = (id: string): number => board.cards.filter((c) => c.labels.includes(id)).length

  return (
    <Modal onClose={close} width={440} zIndex={55} panelStyle={{ maxHeight: '82%' }}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="label" size={19} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t('labelManager.title', 'Labels')}</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{board.name}</span>
        </div>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          <Icon name="close" size={19} />
        </Hover>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {board.labels.map((l) => (
            <Hover key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 9px', borderRadius: 8 }} hover={{ background: 'var(--surface)' }}>
              <span onClick={() => cycleLabelColor(l.id)} title={t('labelManager.clickToChangeColor', 'Click to change color')} style={{ width: 14, height: 14, borderRadius: 4, background: l.color, cursor: 'pointer', flexShrink: 0, boxShadow: '0 0 0 1px rgba(255,255,255,0.1) inset' }} />
              <LabelChip name={l.name} color={l.color} />
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>{t('labelManager.cards', '{{count}} cards', { count: usage(l.id) })}</span>
              <Hover as="span" onClick={() => deleteBoardLabel(l.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>
                <Icon name="delete_outline" size={16} />
              </Hover>
            </Hover>
          ))}
          {board.labels.length === 0 && <div style={{ fontSize: 12, color: 'var(--text-faint)', padding: 8 }}>{t('labelManager.empty', 'No labels yet.')}</div>}
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '14px 18px' }}>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 9 }}>{t('labelManager.newLabel', 'NEW LABEL')}</div>
        <input value={newLabel.name} onChange={(e) => setNewLabel({ name: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && addBoardLabel()} placeholder={t('labelManager.labelNamePlaceholder', 'Label name')} style={{ ...inputStyle, marginBottom: 11 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {LABEL_PALETTE.map((c) => (
            <span key={c} onClick={() => setNewLabel({ color: c })} style={{ width: 20, height: 20, borderRadius: 6, background: c, cursor: 'pointer', boxShadow: c === newLabel.color ? '0 0 0 2px var(--bg), 0 0 0 3.5px #fff' : '0 0 0 1px rgba(255,255,255,0.1) inset' }} />
          ))}
        </div>
        <Hover as="span" onClick={addBoardLabel} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 9, borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="add" size={16} />{t('labelManager.addLabel', 'Add label')}
        </Hover>
      </div>
    </Modal>
  )
}
