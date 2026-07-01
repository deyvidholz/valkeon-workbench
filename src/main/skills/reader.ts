import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import yaml from 'js-yaml'
import type { Skill, SkillSave } from '@shared/skills'
import { safeSegment } from '../persistence/paths'
import { BUILTIN_SKILLS, BUILTIN_VERSION } from './builtin'

const TAG_FOR = (name: string): string => {
  if (/test|lint/.test(name)) return 'lint'
  if (/git|pr|commit|changelog|worktree/.test(name)) return 'git'
  if (/db|migrat|prisma|sql/.test(name)) return 'db'
  if (/react|component|ui/.test(name)) return 'react'
  if (/board|card|doc|readme|convention/.test(name)) return 'docs'
  return 'bash'
}

const skillsDir = (repoPath: string): string => join(repoPath, '.claude', 'skills')
// Disabled skills are MOVED here so the agent CLI (which only loads .claude/skills)
// no longer sees them; re-enabling moves them back.
const disabledDir = (repoPath: string): string => join(repoPath, '.claude', 'skills-disabled')

/**
 * Install Valkeon's own `vw-*` skills into `.claude/skills/` (where the agent CLI
 * loads skills from).
 *
 * A missing skill is always written. When the project's recorded builtin version
 * is behind {@link BUILTIN_VERSION}, the `vw-*` files are refreshed in place so
 * improved built-ins reach already-initialized projects. User-authored skills
 * (any directory not in BUILTIN_SKILLS) are never touched.
 */
export async function ensureBuiltinSkills(repoPath: string): Promise<void> {
  const versionFile = join(skillsDir(repoPath), '.vw-builtin-version')
  let installed = 0
  try {
    installed = parseInt((await fs.readFile(versionFile, 'utf8')).trim(), 10) || 0
  } catch {
    installed = 0
  }
  const refresh = installed < BUILTIN_VERSION

  for (const s of BUILTIN_SKILLS) {
    const dir = join(skillsDir(repoPath), s.id)
    const file = join(dir, 'SKILL.md')
    // Present (in either state) → don't recreate (recreating a disabled skill
    // would silently re-enable it).
    let existsEnabled = true
    try {
      await fs.access(file)
    } catch {
      existsEnabled = false
    }
    let existsDisabled = false
    try {
      await fs.access(join(disabledDir(repoPath), s.id, 'SKILL.md'))
      existsDisabled = true
    } catch {
      existsDisabled = false
    }
    // Refresh only touches the enabled copy in place; never resurrect a disabled one.
    if ((!existsEnabled && !existsDisabled) || (refresh && existsEnabled)) {
      await fs.mkdir(dir, { recursive: true })
      await fs.writeFile(file, s.content, 'utf8')
    }
  }

  if (refresh) {
    await fs.mkdir(skillsDir(repoPath), { recursive: true })
    await fs.writeFile(versionFile, `${BUILTIN_VERSION}\n`, 'utf8').catch(() => {})
  }
}

async function readSkillsFrom(dir: string, enabled: boolean): Promise<Skill[]> {
  let names: string[] = []
  try {
    names = (await fs.readdir(dir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
  const skills: Skill[] = []
  for (const name of names.sort()) {
    let fm: Record<string, unknown> = {}
    let instructions = ''
    try {
      const raw = (await fs.readFile(join(dir, name, 'SKILL.md'), 'utf8')).replace(/\r\n/g, '\n')
      const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw)
      if (m) {
        fm = (yaml.load(m[1]) as Record<string, unknown>) ?? {}
        instructions = m[2].trim()
      } else {
        instructions = raw.trim()
      }
    } catch {
      // directory without a readable SKILL.md — still list it
    }
    // Coerce untrusted frontmatter so a malformed file can't crash the renderer.
    skills.push({
      id: name,
      name: typeof fm.name === 'string' ? fm.name : name,
      desc: typeof fm.description === 'string' ? fm.description : 'No description provided.',
      tag: typeof fm.tag === 'string' ? fm.tag : TAG_FOR(name),
      trigger: fm.trigger === 'auto' ? 'auto' : 'manual',
      enabled,
      invocations: 0,
      icon: 'auto_awesome',
      touches: Array.isArray(fm.touches) ? fm.touches.map(String) : [],
      instructions: instructions.slice(0, 8000),
      builtin: name.startsWith('vw-')
    })
  }
  return skills
}

export async function listSkills(repoPath: string): Promise<Skill[]> {
  await ensureBuiltinSkills(repoPath).catch(() => {})
  const [enabled, disabled] = await Promise.all([
    readSkillsFrom(skillsDir(repoPath), true),
    readSkillsFrom(disabledDir(repoPath), false)
  ])
  return [...enabled, ...disabled].sort((a, b) => a.name.localeCompare(b.name))
}

/** Move a skill between `.claude/skills` (enabled) and `.claude/skills-disabled`. */
export async function setSkillEnabled(repoPath: string, id: string, enabled: boolean): Promise<Skill[]> {
  const safe = safeSegment('skillId', id)
  const from = join(enabled ? disabledDir(repoPath) : skillsDir(repoPath), safe)
  const to = join(enabled ? skillsDir(repoPath) : disabledDir(repoPath), safe)
  try {
    await fs.mkdir(join(to, '..'), { recursive: true })
    await fs.rename(from, to)
  } catch {
    // already in the target state / missing — ignore and just re-list
  }
  return listSkills(repoPath)
}

export async function saveSkill(repoPath: string, save: SkillSave): Promise<Skill[]> {
  const id = safeSegment('skillId', save.id)
  const dir = join(skillsDir(repoPath), id)
  await fs.mkdir(dir, { recursive: true })
  const front = yaml
    .dump({ name: save.name, description: save.description, trigger: save.trigger }, { lineWidth: 100 })
    .trimEnd()
  await fs.writeFile(join(dir, 'SKILL.md'), `---\n${front}\n---\n\n${save.instructions.trim()}\n`, 'utf8')
  return listSkills(repoPath)
}
