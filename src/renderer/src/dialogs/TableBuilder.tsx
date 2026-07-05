import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'

export function TableBuilder() {
  const { t } = useTranslation()
  const open = useStore((s) => s.tableOpen)
  const table = useStore((s) => s.table)
  const setTable = useStore((s) => s.setTable)
  const insert = useStore((s) => s.insertTable)
  const close = useStore((s) => s.closeTable)
  if (!open) return null

  const setHeader = (i: number, v: string): void => setTable({ ...table, headers: table.headers.map((h, j) => (j === i ? v : h)) })
  const setCell = (r: number, c: number, v: string): void =>
    setTable({ ...table, rows: table.rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? v : cell)) : row)) })
  const addCol = (): void => setTable({ headers: [...table.headers, `Column ${table.headers.length + 1}`], rows: table.rows.map((r) => [...r, '']) })
  const delCol = (i: number): void => {
    if (table.headers.length <= 1) return
    setTable({ headers: table.headers.filter((_, j) => j !== i), rows: table.rows.map((r) => r.filter((_, j) => j !== i)) })
  }
  const addRow = (): void => setTable({ ...table, rows: [...table.rows, table.headers.map(() => '')] })
  const delRow = (i: number): void => {
    if (table.rows.length <= 1) return
    setTable({ ...table, rows: table.rows.filter((_, j) => j !== i) })
  }

  return (
    <Modal onClose={close} width={600} zIndex={64} panelStyle={{ maxHeight: '84%' }}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="table_chart" size={19} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t('tableBuilder.title', 'Table builder')}</span>
        </div>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          <Icon name="close" size={19} />
        </Hover>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto', padding: '16px 18px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 'max-content' }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
            {table.headers.map((h, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3, width: 150 }}>
                <input value={h} onChange={(e) => setHeader(i, e.target.value)} placeholder={t('tableBuilder.headerPlaceholder', 'Header')} style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 7, padding: '7px 9px', color: 'var(--text)', fontSize: 12, fontWeight: 600 }} />
                <Hover as="span" onClick={() => delCol(i)} style={{ textAlign: 'center', fontFamily: "'Material Symbols Rounded'", fontSize: 14, color: 'var(--text-faint)', cursor: 'pointer' }} hover={{ color: 'var(--danger)' }}>delete_outline</Hover>
              </div>
            ))}
            <Hover as="span" onClick={addCol} title={t('tableBuilder.addColumn', 'Add column')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line-2)', color: 'var(--text-dim)', cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontSize: 17 }} hover={{ background: 'var(--surface-3)', color: 'var(--text)' }}>add</Hover>
          </div>
          {table.rows.map((row, r) => (
            <div key={r} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {table.headers.map((_, c) => (
                <input key={c} value={row[c] ?? ''} onChange={(e) => setCell(r, c, e.target.value)} placeholder={t('tableBuilder.cellPlaceholder', 'Cell')} style={{ width: 150, background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 7, padding: '7px 9px', color: 'var(--text-2)', fontSize: 12 }} />
              ))}
              <Hover as="span" onClick={() => delRow(r)} title={t('tableBuilder.deleteRow', 'Delete row')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 7, color: 'var(--text-faint)', cursor: 'pointer', fontFamily: "'Material Symbols Rounded'", fontSize: 16 }} hover={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)' }}>delete_outline</Hover>
            </div>
          ))}
          <Hover as="span" onClick={addRow} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 11px', borderRadius: 7, background: 'var(--surface-2)', border: '1px solid var(--line-2)', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, fontWeight: 500, alignSelf: 'flex-start', marginTop: 2 }} hover={{ background: 'var(--surface-3)', color: 'var(--text)' }}>
            <Icon name="add" size={15} />{t('tableBuilder.addRow', 'Add row')}
          </Hover>
        </div>
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
        <Hover as="span" onClick={close} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>{t('tableBuilder.cancel', 'Cancel')}</Hover>
        <Hover as="span" onClick={insert} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>
          <Icon name="check" size={16} />{t('tableBuilder.insertTable', 'Insert table')}
        </Hover>
      </div>
    </Modal>
  )
}
