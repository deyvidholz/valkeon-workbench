import { homedir } from 'node:os'
import { join } from 'node:path'

let cached: NodeJS.ProcessEnv | null = null

/**
 * Environment for spawning user CLIs (git, claude, …).
 *
 * macOS apps launched from Finder/Dock inherit launchd's minimal PATH
 * (`/usr/bin:/bin:/usr/sbin:/sbin`), so Homebrew / npm-global / nvm binaries are
 * invisible and `which claude` wrongly reports "not installed". We augment PATH
 * with the common install dirs. (Capturing the login shell's PATH via
 * `$SHELL -lic env` is a more robust future upgrade.)
 */
export function getSpawnEnv(): NodeJS.ProcessEnv {
  if (cached) return cached
  const home = homedir()
  const extra = [
    '/opt/homebrew/bin',
    '/opt/homebrew/sbin',
    '/usr/local/bin',
    '/usr/bin',
    '/bin',
    '/usr/sbin',
    '/sbin',
    join(home, '.npm-global/bin'),
    join(home, '.local/bin'),
    join(home, '.bun/bin'),
    join(home, '.deno/bin'),
    join(home, '.cargo/bin')
  ]
  const current = process.env.PATH ? process.env.PATH.split(':') : []
  const merged = [...new Set([...current, ...extra])].filter(Boolean).join(':')
  cached = { ...process.env, PATH: merged }
  return cached
}
