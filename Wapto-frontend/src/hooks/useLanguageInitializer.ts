"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { usePathname } from "next/navigation";
import { useAppDispatch } from "../redux/hooks";
import { setRTL } from "../redux/reducers/layoutSlice";
import { useLazyGetAllLanguagesQuery, useLazyGetTranslationsQuery } from "../redux/api/languageApi";
import { loadTranslations } from "../utils/i18nLoader";

const LANGUAGE_STORAGE_KEY = "selected_language";

export const useLanguageInitializer = (): boolean => {
  const { i18n } = useTranslation();
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const [isLanguageReady, setIsLanguageReady] = useState(false);

  const [getAllLanguages] = useLazyGetAllLanguagesQuery();
  const [getTranslations] = useLazyGetTranslationsQuery();

  useEffect(() => {
    const isPublicPage =
      pathname?.startsWith("/auth") ||
      pathname === "/" ||
      pathname === "/landing" ||
      pathname?.startsWith("/integration_tools");

    if (isPublicPage) {
      setIsLanguageReady(true);
      return;
    }

    const initializeLanguage = async () => {
      const savedLocale = localStorage.getItem(LANGUAGE_STORAGE_KEY) || "en";

      try {
        const languagesResult = await getAllLanguages({ status: true }).unwrap();
        const activeLanguages = languagesResult?.data?.languages || [];
        const currentLanguage = activeLanguages.find((lang) => lang.locale === savedLocale);

        if (currentLanguage) {
          try {
            const translationResult = await getTranslations(currentLanguage.locale).unwrap();
            if (translationResult?.success && translationResult.data) {
              const frontTranslations =
                translationResult.data.front?.translation || translationResult.data.front || translationResult.data;
              loadTranslations(savedLocale, frontTranslations);
            }
          } catch {
            if (savedLocale !== "en") {
              await i18n.changeLanguage("en");
              dispatch(setRTL(false));
            }
          }

          if (i18n.language !== savedLocale) {
            await i18n.changeLanguage(savedLocale);
          }
        } else if (savedLocale !== "en") {
          await i18n.changeLanguage("en");
          dispatch(setRTL(false));
        }
      } catch {
        if (savedLocale !== "en") {
          await i18n.changeLanguage("en").catch(() => undefined);
          dispatch(setRTL(false));
        }
      } finally {
        setIsLanguageReady(true);
      }
    };

    initializeLanguage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return isLanguageReady;
};
