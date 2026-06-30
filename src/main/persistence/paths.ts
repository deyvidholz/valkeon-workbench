import { resolve, sep } from 'node:path'

const SEGMENT_RE = /^[A-Za-z0-9._-]+$/

/**
 * Validate a single path segment that originated from the renderer (board id,
 * card id, …). Rejects anything that could traverse out of its directory.
 * IPC args are untrusted: a compromised renderer must not be able to write or
 * delete outside `.valkeon/`.
 */
export function safeSegment(label: string, value: unknown): string {
  if (
    typeof value !== 'string' ||
    value.length === 0 ||
    value.length > 100 ||
    value === '.' ||
    value === '..' ||
    !SEGMENT_RE.test(value)
  ) {
    throw new Error(`Invalid ${label} path segment: ${JSON.stringify(value)}`)
  }
  return value
}

/** Defense-in-depth: assert `target` resolves to a location inside `base`. */
export function assertInside(base: string, target: string): string {
  const baseResolved = resolve(base)
  const targetResolved = resolve(target)
  if (targetResolved !== baseResolved && !targetResolved.startsWith(baseResolved + sep)) {
    throw new Error(`Path escapes ${base}: ${target}`)
  }
  return target
}
