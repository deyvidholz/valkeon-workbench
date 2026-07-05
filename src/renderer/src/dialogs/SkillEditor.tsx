import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useStore } from '../store/useStore'
import { Modal } from '../ui/Modal'
import { Icon } from '../ui/Icon'
import { Hover } from '../ui/Hover'
import { MarkdownEditor } from '../components/MarkdownEditor'
import { eyebrow, inputStyle } from './parts'

const NEW_TEMPLATE = `Describe when the agent should reach for this skill and what to do.

- Keep instructions concrete and scoped.
- Reference related skills by name so the agent can chain them.
`

/** Turn a skill name into a safe \`.claude/skills/<id>\` directory segment. */
const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)

export function SkillEditor() {
  const { t } = useTranslation()
  const id = useStore((s) => s.skillEditorId)
  const skills = useStore((s) => s.skills)
  const close = useStore((s) => s.closeSkillEditor)
  const save = useStore((s) => s.saveSkill)
  const isNew = id === '__new__'
  const skill = skills.find((s) => s.id === id)

  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [trigger, setTrigger] = useState<'auto' | 'manual'>('manual')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    if (isNew) {
      setName('')
      setDesc('')
      setTrigger('manual')
      setInstructions(NEW_TEMPLATE)
    } else if (skill) {
      setName(skill.name)
      setDesc(skill.desc)
      setTrigger(skill.trigger)
      setInstructions(skill.instructions)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!id || (!skill && !isNew)) return null

  // New skills derive their id from the name; existing skills keep their id so
  // renaming never orphans the on-disk directory.
  const targetId = isNew ? slugify(name) : skill!.id
  const canSave = name.trim().length > 0 && (!isNew || targetId.length > 0)

  const segStyle = (on: boolean): React.CSSProperties => ({ padding: '6px 13px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', color: on ? 'var(--on-accent)' : 'var(--text-dim)', background: on ? 'var(--accent)' : 'var(--surface)', border: `1px solid ${on ? 'transparent' : 'var(--line)'}` })

  const onSave = (): void => {
    if (!canSave) return
    save({ id: targetId, name: name.trim(), description: desc.trim(), trigger, instructions })
  }

  return (
    <Modal onClose={close} width={680} zIndex={60} panelStyle={{ maxHeight: '88%' }}>
      <div style={{ padding: '15px 18px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="auto_awesome" size={19} color="var(--accent)" />
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{isNew ? t('skillEditor.newTitle', 'New skill') : t('skillEditor.editTitle', 'Edit skill')}</span>
          <span style={{ fontSize: 11, color: 'var(--text-faint)', fontFamily: "'Geist Mono', monospace" }}>{targetId || t('skillEditor.idPlaceholder', 'skill-id')}</span>
        </div>
        <Hover as="span" onClick={close} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 6, color: 'var(--text-muted)', cursor: 'pointer' }} hover={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>
          <Icon name="close" size={19} />
        </Hover>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 18 }}>
        <div style={eyebrow}>{t('skillEditor.nameLabel', 'NAME')}</div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('skillEditor.namePlaceholder', 'What the skill is called')} style={{ ...inputStyle, marginBottom: 16 }} />
        <div style={eyebrow}>{t('skillEditor.whenToUseLabel', 'WHEN TO USE (description)')}</div>
        <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t('skillEditor.descPlaceholder', "A precise trigger keeps the skill out of context until it's relevant.")} style={{ ...inputStyle, marginBottom: 16 }} />
        <div style={eyebrow}>{t('skillEditor.triggerLabel', 'TRIGGER')}</div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          <span onClick={() => setTrigger('auto')} style={segStyle(trigger === 'auto')}>{t('skillEditor.triggerAuto', 'Auto')}</span>
          <span onClick={() => setTrigger('manual')} style={segStyle(trigger === 'manual')}>{t('skillEditor.triggerManual', 'Manual')}</span>
        </div>
        <div style={{ ...eyebrow, marginBottom: 8 }}>{t('skillEditor.instructionsLabel', 'INSTRUCTIONS')}</div>
        <MarkdownEditor key={id} value={instructions} onChange={setInstructions} minHeight={240} placeholder={t('skillEditor.instructionsPlaceholder', 'Write the skill instructions in markdown…')} />
      </div>

      <div style={{ flexShrink: 0, borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '13px 18px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 9 }}>
        <Hover as="span" onClick={close} style={{ padding: '8px 14px', borderRadius: 8, color: 'var(--text-dim)', fontSize: 12.5, fontWeight: 500, cursor: 'pointer' }} hover={{ background: 'var(--surface-2)' }}>{t('skillEditor.cancel', 'Cancel')}</Hover>
        <Hover as="span" onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 15px', borderRadius: 8, background: 'var(--accent)', color: 'var(--on-accent)', fontSize: 12.5, fontWeight: 600, cursor: canSave ? 'pointer' : 'not-allowed', opacity: canSave ? 1 : 0.5 }} hover={canSave ? { filter: 'brightness(1.08)' } : {}}>
          <Icon name="check" size={16} />{t('skillEditor.save', 'Save skill')}
        </Hover>
      </div>
    </Modal>
  )
}
