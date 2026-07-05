import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import type { LocalePref, ResolvedLocale } from '@shared/persistence/global'
import ptBR from './pt-BR.json'
import esAR from './es-AR.json'

export const SUPPORTED_LOCALES: ResolvedLocale[] = ['en', 'pt-BR', 'es-AR']

/** Map an arbitrary OS locale (e.g. "pt-BR", "es-AR", "es-419", "en-US") to a supported one. */
export function mapOsLocale(osLocale: string): ResolvedLocale {
  const l = (osLocale || '').toLowerCase()
  if (l.startsWith('pt')) return 'pt-BR'
  if (l.startsWith('es')) return 'es-AR'
  return 'en'
}

/** Resolve a preference against the detected OS locale. */
export function resolveLocale(pref: LocalePref, systemLocale: ResolvedLocale): ResolvedLocale {
  return pref === 'system' ? systemLocale : pref
}

// English needs no resource bundle: every t() call carries its English string as
// the inline default value, so `en` (the fallback) always renders correctly even
// before catalogs exist. pt-BR / es-AR are the only translated bundles.
void i18next.use(initReactI18next).init({
  resources: {
    'pt-BR': { translation: ptBR },
    'es-AR': { translation: esAR }
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  returnNull: false,
  // Keys are flat dotted strings (e.g. "board.title"), not nested paths, and we
  // don't use ':' namespaces — so catalogs are plain flat { "a.b": "…" } maps.
  keySeparator: false,
  nsSeparator: false,
  // Missing keys in the active language fall back through to the inline default.
  parseMissingKeyHandler: (_key, defaultValue) => defaultValue ?? _key
})

export function setI18nLanguage(locale: ResolvedLocale): void {
  void i18next.changeLanguage(locale)
}

export default i18next
