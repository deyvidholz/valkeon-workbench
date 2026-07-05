import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Toggle } from '../ui/Toggle'
import { rgba } from '../lib/color'

const TAG_COLOR: Record<string, string> = {
  bash: '#88b2da', git: '#e0b15e', db: '#b89cf0', react: '#7dd99a', docs: '#5b9dd9', lint: '#e07a6e'
}

export function SkillsScreen() {
  const { t } = useTranslation()
  const skills = useStore((s) => s.skills)
  const selectedSkillId = useStore((s) => s.selectedSkillId)
  const selectSkill = useStore((s) => s.selectSkill)
  const toggleSkill = useStore((s) => s.toggleSkill)
  const runSkill = useStore((s) => s.runSkill)
  const openSkillEditor = useStore((s) => s.openSkillEditor)
  const newSkill = useStore((s) => s.newSkill)
  const enabled = skills.filter((s) => s.enabled).length
  const selected = skills.find((s) => s.id === selectedSkillId) ?? skills[0]

  if (!selected) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center', padding: 40 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--surface)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="auto_awesome" size={24} color="var(--text-faint)" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>{t('skills.noSkills', 'No skills yet')}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, maxWidth: 400, lineHeight: 1.5 }}>
            {t('skills.emptyLead', 'Valkeon installs its own')} <span style={{ fontFamily: "'Geist Mono', monospace" }}>vw-*</span> {t('skills.emptyMid', 'skills into')}{' '}
            <span style={{ fontFamily: "'Geist Mono', monospace" }}>.claude/skills</span> {t('skills.emptyTail', 'when you open a project. Open a real folder to see them.')}
          </div>
        </div>
        <Hover as="span" onClick={newSkill} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
          <Icon name="add" size={16} />{t('skills.newSkill', 'New skill')}
        </Hover>
      </div>
    )
  }

  const vwBadge = (
    <span style={{ fontSize: 8.5, fontWeight: 700, color: 'var(--accent-hi)', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', padding: '2px 6px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
      Valkeon
    </span>
  )

  const tag = (t: string): React.ReactNode => {
    const c = TAG_COLOR[t] ?? '#9a9aa3'
    return (
      <span style={{ fontFamily: "'Geist Mono', monospace", fontSize: 9.5, fontWeight: 600, color: c, background: rgba(c, 0.13), padding: '2px 7px', borderRadius: 5, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{t}</span>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--line)', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.01em' }}>{t('skills.title', 'Skills')}</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, fontFamily: "'Geist Mono', monospace" }}>.claude/skills · {t('skills.enabledCount', '{{count}} enabled', { count: enabled })}</div>
          </div>
          <Hover as="span" onClick={newSkill} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>
            <Icon name="add" size={16} />{t('skills.newSkill', 'New skill')}
          </Hover>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', minHeight: 0 }}>
          {(() => {
            const vw = skills.filter((sk) => sk.builtin)
            const others = skills.filter((sk) => !sk.builtin)
            const cardFor = (sk: (typeof skills)[number]): React.ReactNode => {
              const on = sk.id === selected.id
              return (
                <Hover key={sk.id} onClick={() => selectSkill(sk.id)} style={{ background: 'var(--bg)', border: `1px solid ${on ? 'var(--accent-line)' : 'var(--line)'}`, borderRadius: 11, padding: 14, cursor: 'pointer' }} hover={{ border: '1px solid var(--line-2)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={sk.icon} size={19} color="var(--accent)" />
                    </div>
                    {sk.builtin ? (
                      <Toggle on={sk.enabled} onClick={() => toggleSkill(sk.id)} />
                    ) : (
                      <Icon name="lock" size={15} color="var(--text-faint)" title={t('skills.readOnly', 'Managed outside Valkeon')} />
                    )}
                  </div>
                  <div style={{ marginTop: 11 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{sk.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 4 }}>{sk.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    {sk.builtin && vwBadge}
                    {tag(sk.tag)}
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontFamily: "'Geist Mono', monospace" }}>{sk.trigger}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10.5, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>{t('skills.runsCount', '{{count}} runs', { count: sk.invocations })}</span>
                  </div>
                </Hover>
              )
            }
            const sectionLabel = { fontSize: 11, fontWeight: 600 as const, letterSpacing: '0.08em', color: 'var(--text-muted)', margin: '2px 2px 10px' }
            return (
              <>
                <div style={sectionLabel}>{t('skills.valkeonSection', 'VALKEON SKILLS')}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>{vw.map(cardFor)}</div>
                {others.length > 0 && (
                  <>
                    <div style={{ ...sectionLabel, marginTop: 22 }}>{t('skills.projectSection', 'PROJECT SKILLS · READ-ONLY')}</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>{others.map(cardFor)}</div>
                  </>
                )}
              </>
            )
          })()}
        </div>
      </div>
      <div style={{ width: 344, flexShrink: 0, borderLeft: '1px solid var(--line)', background: 'var(--bg)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '22px 20px 24px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name={selected.icon} size={23} color="var(--accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)' }}>{selected.name}</div>
            {selected.builtin && vwBadge}
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-dim)', lineHeight: 1.5, marginTop: 6 }}>{selected.desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '11px 13px', borderRadius: 9, background: 'var(--surface)', border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 12.5, color: 'var(--text-2)', fontWeight: 500 }}>{selected.enabled ? t('skills.enabled', 'Enabled') : t('skills.disabled', 'Disabled')}</span>
            {selected.builtin ? (
              <Toggle on={selected.enabled} onClick={() => toggleSkill(selected.id)} />
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-faint)' }}><Icon name="lock" size={13} />{t('skills.readOnly', 'Managed outside Valkeon')}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
            <div><div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>{t('skills.trigger', 'TRIGGER')}</div><div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{selected.trigger}</div></div>
            <div><div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>{t('skills.runs', 'RUNS')}</div><div style={{ fontSize: 12.5, color: 'var(--text-2)', fontFamily: "'Geist Mono', monospace" }}>{selected.invocations}</div></div>
            <div><div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>{t('skills.type', 'TYPE')}</div><div style={{ fontSize: 12.5, color: 'var(--text-2)' }}>{selected.tag}</div></div>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '20px 0 8px' }}>{t('skills.touches', 'TOUCHES')}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.touches.map((t) => (
              <span key={t} style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: "'Geist Mono', monospace", background: 'var(--surface)', border: '1px solid var(--line-2)', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', letterSpacing: '0.06em', margin: '20px 0 8px' }}>{t('skills.instructions', 'INSTRUCTIONS')}</div>
          <div style={{ fontSize: 11.5, color: 'var(--text-dim)', lineHeight: 1.6, fontFamily: "'Geist Mono', monospace", background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 9, padding: 13 }}>{selected.instructions}</div>
        </div>
        <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '12px 20px', display: 'flex', gap: 9 }}>
          <Hover as="span" onClick={() => selected.enabled && runSkill(selected.id)} title={selected.enabled ? undefined : t('skills.enableToRun', 'Enable the skill to run it')} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: selected.enabled ? 'pointer' : 'not-allowed', opacity: selected.enabled ? 1 : 0.45 }} hover={selected.enabled ? { filter: 'brightness(1.08)' } : {}}>{t('skills.runNow', 'Run now')}</Hover>
          {selected.builtin && (
            <Hover as="span" onClick={() => openSkillEditor(selected.id)} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--line-2)', color: 'var(--text-2)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>{t('skills.edit', 'Edit')}</Hover>
          )}
        </div>
      </div>
    </div>
  )
}
