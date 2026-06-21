import { useMemo } from 'react'
import { useLanguage } from '@/contexts/LanguageContext'
import { ko } from '@/lib/i18n/ko'
import { en } from '@/lib/i18n/en'
import { zh } from '@/lib/i18n/zh'

const translations = { ko, en, zh }

export function useTranslation() {
  const { lang, setLang } = useLanguage()
  const t = useMemo(() => translations[lang], [lang])
  return { t, lang, setLang }
}
