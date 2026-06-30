import { useStore } from '../store/useStore'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { Toggle } from '../ui/Toggle'
import { rgba } from '../lib/color'

const TAG_COLOR: Record<string, string> = {
  bash: '#88b2da', git: '#e0b15e', db: '#b89cf0', react: '#7dd99a', docs: '#5b9dd9', lint: '#e07a6e'
}

export function SkillsScreen() {
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
        <div style={{ width: 46, height: 46, borderRadius: 12, background: '#101015', border: '1px solid #1d1d23', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="auto_awesome" size={24} color="#56565e" />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#cbcbd2' }}>No skills yet</div>
          <div style={{ fontSize: 12, color: '#6b6b74', marginTop: 4, maxWidth: 400, lineHeight: 1.5 }}>
            Valkeon installs its own <span style={{ fontFamily: "'Geist Mono', monospace" }}>vw-*</span> skills into{' '}
            <span style={{ fontFamily: "'Geist Mono', monospace" }}>.claude/skills</span> when you open a project. Open a real folder to see them.
          </div>
        </div>
        <Hover as="span" onClick={newSkill} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, background: '#121216', border: '1px solid #232329', color: '#cbcbd2', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
          <Icon name="add" size={16} />New skill
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
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid #16161a', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 600, color: '#ededf0', letterSpacing: '-0.01em' }}>Skills</div>
            <div style={{ fontSize: 12.5, color: '#73737c', marginTop: 3, fontFamily: "'Geist Mono', monospace" }}>.claude/skills · {enabled} enabled</div>
          </div>
          <Hover as="span" onClick={newSkill} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 8, background: '#121216', border: '1px solid #232329', color: '#cbcbd2', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#17171c' }}>
            <Icon name="add" size={16} />New skill
          </Hover>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', minHeight: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignContent: 'start' }}>
            {skills.map((sk) => {
              const on = sk.id === selected.id
              return (
                <Hover key={sk.id} onClick={() => selectSkill(sk.id)} style={{ background: '#0c0c0f', border: `1px solid ${on ? 'var(--accent-line)' : '#1a1a1f'}`, borderRadius: 11, padding: 14, cursor: 'pointer' }} hover={{ border: '1px solid #2c2c35' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ width: 34, height: 34, borderRadius: 9, background: '#15151b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={sk.icon} size={19} color="var(--accent)" />
                    </div>
                    <Toggle on={sk.enabled} onClick={() => toggleSkill(sk.id)} />
                  </div>
                  <div style={{ marginTop: 11 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#e4e4ea' }}>{sk.name}</div>
                    <div style={{ fontSize: 11.5, color: '#73737c', lineHeight: 1.45, marginTop: 4 }}>{sk.desc}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
                    {sk.builtin && vwBadge}
                    {tag(sk.tag)}
                    <span style={{ fontSize: 10.5, color: '#5f5f68', fontFamily: "'Geist Mono', monospace" }}>{sk.trigger}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 10.5, color: '#56565e', fontFamily: "'Geist Mono', monospace" }}>{sk.invocations} runs</span>
                  </div>
                </Hover>
              )
            })}
          </div>
        </div>
      </div>
      <div style={{ width: 344, flexShrink: 0, borderLeft: '1px solid #16161a', background: '#0a0a0c', overflowY: 'auto', minHeight: 0 }}>
        <div style={{ padding: '22px 20px 30px' }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#15151b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
            <Icon name={selected.icon} size={23} color="var(--accent)" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 17, fontWeight: 600, color: '#ededf0' }}>{selected.name}</div>
            {selected.builtin && vwBadge}
          </div>
          <div style={{ fontSize: 12.5, color: '#8a8a93', lineHeight: 1.5, marginTop: 6 }}>{selected.desc}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '11px 13px', borderRadius: 9, background: '#0e0e12', border: '1px solid #1c1c22' }}>
            <span style={{ fontSize: 12.5, color: '#cbcbd2', fontWeight: 500 }}>{selected.enabled ? 'Enabled' : 'Disabled'}</span>
            <Toggle on={selected.enabled} onClick={() => toggleSkill(selected.id)} />
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 18 }}>
            <div><div style={{ fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', marginBottom: 4 }}>TRIGGER</div><div style={{ fontSize: 12.5, color: '#cbcbd2' }}>{selected.trigger}</div></div>
            <div><div style={{ fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', marginBottom: 4 }}>RUNS</div><div style={{ fontSize: 12.5, color: '#cbcbd2', fontFamily: "'Geist Mono', monospace" }}>{selected.invocations}</div></div>
            <div><div style={{ fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', marginBottom: 4 }}>TYPE</div><div style={{ fontSize: 12.5, color: '#cbcbd2' }}>{selected.tag}</div></div>
          </div>
          <div style={{ fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', margin: '20px 0 8px' }}>TOUCHES</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selected.touches.map((t) => (
              <span key={t} style={{ fontSize: 11, color: '#9a9aa3', fontFamily: "'Geist Mono', monospace", background: '#121217', border: '1px solid #222229', padding: '3px 8px', borderRadius: 6 }}>{t}</span>
            ))}
          </div>
          <div style={{ fontSize: 10.5, color: '#62626b', letterSpacing: '0.06em', margin: '20px 0 8px' }}>INSTRUCTIONS</div>
          <div style={{ fontSize: 11.5, color: '#a4a4ad', lineHeight: 1.6, fontFamily: "'Geist Mono', monospace", background: '#0c0c0f', border: '1px solid #1a1a1f', borderRadius: 9, padding: 13 }}>{selected.instructions}</div>
          <div style={{ display: 'flex', gap: 9, marginTop: 18 }}>
            <Hover as="span" onClick={() => runSkill(selected.id)} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 8, background: 'var(--accent)', color: '#0a1018', fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }} hover={{ filter: 'brightness(1.08)' }}>Run now</Hover>
            <Hover as="span" onClick={() => openSkillEditor(selected.id)} style={{ flex: 1, textAlign: 'center', padding: 9, borderRadius: 8, background: '#121216', border: '1px solid #232329', color: '#cbcbd2', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: '#17171c' }}>Edit</Hover>
          </div>
        </div>
      </div>
    </div>
  )
}
