'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePathname } from 'next/navigation'
import { useAppDispatch } from '../redux/hooks'
import { setRTL } from '../redux/reducers/layoutSlice'
import { languageApi } from '../redux/api/languageApi'
import { loadTranslations } from '../utils/i18n-loader'

const LANGUAGE_STORAGE_KEY = 'selected_language'

export const useLanguageInitializer = () => {
  const { i18n } = useTranslation()
  const dispatch = useAppDispatch()
  const pathname = usePathname()
  const [isLanguageReady, setIsLanguageReady] = useState(false)

  const [getAllLanguages] = languageApi.useLazyGetAllLanguagesQuery()
  const [getTranslations] = languageApi.useLazyGetTranslationsQuery()

  useEffect(() => {
    if (pathname?.startsWith('/auth')) {
      setIsLanguageReady(true)
      return
    }

    const initializeLanguage = async () => {
      const savedLanguageLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en'

      try {
        const languagesResult = await getAllLanguages({ status: true }).unwrap()
        const activeLanguages = languagesResult?.data?.languages || []
        const currentLanguage = activeLanguages.find((lang) => lang.locale === savedLanguageLocale)

        if (currentLanguage) {
          try {
            const translationResult = await getTranslations(currentLanguage.locale).unwrap()
            if (translationResult?.success && translationResult.data) {
              const adminTranslations = translationResult.data.admin || {}
              loadTranslations(savedLanguageLocale, adminTranslations)
            }
          } catch {
            if (savedLanguageLocale !== 'en') {
              await i18n.changeLanguage('en')
              dispatch(setRTL(false))
            }
          }

          if (i18n.language !== savedLanguageLocale) {
            await i18n.changeLanguage(savedLanguageLocale)
          }
        } else if (savedLanguageLocale !== 'en') {
          await i18n.changeLanguage('en')
          dispatch(setRTL(false))
        }
      } catch {
        if (savedLanguageLocale !== 'en') {
          await i18n.changeLanguage('en').catch(() => undefined)
          dispatch(setRTL(false))
        }
      } finally {
        setIsLanguageReady(true)
      }
    }

    initializeLanguage()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return isLanguageReady
}
