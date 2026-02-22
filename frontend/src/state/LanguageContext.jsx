import { createContext, useContext, useState, useCallback } from 'react'
import en from '../locales/en.js'
import sq from '../locales/sq.js'

const translations = { en, sq }

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('ehealth_lang') || 'sq')

  const switchLang = useCallback((l) => {
    setLang(l)
    localStorage.setItem('ehealth_lang', l)
  }, [])

  // t('dashboard.title') — resolves nested keys
  const t = useCallback((key) => {
    const keys = key.split('.')
    let val = translations[lang]
    for (const k of keys) {
      if (val == null) return key
      val = val[k]
    }
    return val ?? key
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, switchLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
