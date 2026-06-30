/**
 * Provider-neutral domain primitives shared by the main and renderer processes.
 * Nothing here depends on a specific AI vendor.
 */

export type SessionStatus = 'running' | 'waiting' | 'idle' | 'done'

export type LineType =
  | 'user'
  | 'text'
  | 'sys'
  | 'tool'
  | 'ok'
  | 'err'
  | 'file'
  | 'cmd'
  | 'out'

export interface TranscriptLine {
  type: LineType
  text: string
}

/** A file the agent touched, with a git-style change summary (e.g. "+48 −12"). */
export interface FileTouch {
  p: string
  c: string
}

export interface TokenUsage {
  used: number
  limit: number
}
