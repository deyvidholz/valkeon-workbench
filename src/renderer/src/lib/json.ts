/**
 * Best-effort extraction of a JSON value from an LLM completion. Models often
 * wrap JSON in ```json fences or add a sentence before/after — this strips that
 * and parses the first balanced array/object. Returns null on failure.
 */
export function extractJson<T = unknown>(text: string): T | null {
  if (!text) return null
  let s = text.trim()
  // Strip a fenced code block if present.
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) s = fence[1].trim()
  // Otherwise slice from the first bracket to its matching last bracket.
  const first = s.search(/[[{]/)
  if (first === -1) return null
  const open = s[first]
  const close = open === '[' ? ']' : '}'
  const last = s.lastIndexOf(close)
  if (last <= first) return null
  const candidate = s.slice(first, last + 1)
  try {
    return JSON.parse(candidate) as T
  } catch {
    try {
      return JSON.parse(s) as T
    } catch {
      return null
    }
  }
}
