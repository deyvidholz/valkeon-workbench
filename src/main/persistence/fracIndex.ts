import { generateKeyBetween, generateNKeysBetween } from 'fractional-indexing'

/**
 * Conflict-free ordering keys. Reordering a card touches only that card's file
 * (a new key strictly between its neighbors), so column reorders don't churn a
 * shared list and rarely conflict on merge.
 */
export function orderBetween(before: string | null, after: string | null): string {
  return generateKeyBetween(before, after)
}

/** Generate `n` evenly-spaced keys (for seeding a column). */
export function orderSequence(n: number): string[] {
  return generateNKeysBetween(null, null, n)
}
