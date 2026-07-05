/** Locale-aware "2 minutes ago" formatting via Intl.RelativeTimeFormat. */
const DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' }
]

export function relativeTime(epochMs: number, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  let duration = (epochMs - Date.now()) / 1000
  for (const div of DIVISIONS) {
    if (Math.abs(duration) < div.amount) return rtf.format(Math.round(duration), div.unit)
    duration /= div.amount
  }
  return rtf.format(Math.round(duration), 'year')
}
