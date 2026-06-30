/** A skill read from a project's `.claude/skills/<name>/SKILL.md`. */
export interface Skill {
  id: string
  name: string
  desc: string
  tag: string
  trigger: 'auto' | 'manual'
  enabled: boolean
  invocations: number
  icon: string
  touches: string[]
  instructions: string
  /** True for Valkeon's own `vw-*` skills (installed by the app). */
  builtin: boolean
}

export interface SkillSave {
  id: string
  name: string
  description: string
  trigger: 'auto' | 'manual'
  instructions: string
}
