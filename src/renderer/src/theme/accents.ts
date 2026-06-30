export interface AccentOption {
  id: string
  label: string
  value: string
}

/** Selectable accent colors from the design tokens. */
export const ACCENTS: AccentOption[] = [
  { id: 'red', label: 'Red', value: '#e0574d' },
  { id: 'blue', label: 'Blue', value: '#5b9dd9' },
  { id: 'terracotta', label: 'Terracotta', value: '#d97757' },
  { id: 'green', label: 'Green', value: '#7dd99a' },
  { id: 'violet', label: 'Violet', value: '#b89cf0' },
  { id: 'amber', label: 'Amber', value: '#e0b15e' }
]

export const DEFAULT_ACCENT = '#e0574d'
