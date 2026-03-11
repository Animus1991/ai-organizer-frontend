// src/context/LanguageContext.tsx
// Internationalization (i18n) Context — language data split into src/context/i18n/

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import {
  en, el, sq, de, fr, es, it, pt, nl, pl, ru, zh, ja, ko,
  hu, ro, bg, uk, ar, tr, sv, da, fi, no, cs, he,
  sampleTranslations,
} from "./i18n";

export type Language = "en" | "el" | "sq" | "de" | "fr" | "es" | "it" | "pt" | "nl" | "pl" | "ru" | "zh" | "ja" | "ko" | "ar" | "tr" | "sv" | "da" | "fi" | "no" | "cs" | "hu" | "ro" | "bg" | "uk" | "he";

export interface LanguageInfo {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
  direction: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { code: "en", name: "English",    nativeName: "English",    flag: "🇺🇸", direction: "ltr" },
  { code: "el", name: "Greek",      nativeName: "Ελληνικά",   flag: "🇬🇷", direction: "ltr" },
  { code: "sq", name: "Albanian",   nativeName: "Shqip",      flag: "🇦🇱", direction: "ltr" },
  { code: "de", name: "German",     nativeName: "Deutsch",    flag: "🇩🇪", direction: "ltr" },
  { code: "fr", name: "French",     nativeName: "Français",   flag: "🇫🇷", direction: "ltr" },
  { code: "es", name: "Spanish",    nativeName: "Español",    flag: "🇪🇸", direction: "ltr" },
  { code: "it", name: "Italian",    nativeName: "Italiano",   flag: "🇮🇹", direction: "ltr" },
  { code: "pt", name: "Portuguese", nativeName: "Português",  flag: "🇵🇹", direction: "ltr" },
  { code: "nl", name: "Dutch",      nativeName: "Nederlands", flag: "🇳🇱", direction: "ltr" },
  { code: "pl", name: "Polish",     nativeName: "Polski",     flag: "🇵🇱", direction: "ltr" },
  { code: "ru", name: "Russian",    nativeName: "Русский",    flag: "🇷🇺", direction: "ltr" },
  { code: "zh", name: "Chinese",    nativeName: "中文",        flag: "🇨🇳", direction: "ltr" },
  { code: "ja", name: "Japanese",   nativeName: "日本語",      flag: "🇯🇵", direction: "ltr" },
  { code: "ko", name: "Korean",     nativeName: "한국어",      flag: "🇰🇷", direction: "ltr" },
  { code: "ar", name: "Arabic",     nativeName: "العربية",    flag: "🇸🇦", direction: "rtl" },
  { code: "tr", name: "Turkish",    nativeName: "Türkçe",     flag: "🇹🇷", direction: "ltr" },
  { code: "sv", name: "Swedish",    nativeName: "Svenska",    flag: "🇸🇪", direction: "ltr" },
  { code: "da", name: "Danish",     nativeName: "Dansk",      flag: "🇩🇰", direction: "ltr" },
  { code: "fi", name: "Finnish",    nativeName: "Suomi",      flag: "🇫🇮", direction: "ltr" },
  { code: "no", name: "Norwegian",  nativeName: "Norsk",      flag: "🇳🇴", direction: "ltr" },
  { code: "cs", name: "Czech",      nativeName: "Čeština",    flag: "🇨🇿", direction: "ltr" },
  { code: "hu", name: "Hungarian",  nativeName: "Magyar",     flag: "🇭🇺", direction: "ltr" },
  { code: "ro", name: "Romanian",   nativeName: "Română",     flag: "🇷🇴", direction: "ltr" },
  { code: "bg", name: "Bulgarian",  nativeName: "Български",  flag: "🇧🇬", direction: "ltr" },
  { code: "uk", name: "Ukrainian",  nativeName: "Українська", flag: "🇺🇦", direction: "ltr" },
  { code: "he", name: "Hebrew",     nativeName: "עברית",      flag: "🇮🇱", direction: "rtl" },
];

const translations: Record<Language, Record<string, string>> = {
  en, el, sq, de, fr, es, it, pt, nl, pl, ru, zh, ja, ko,
  ar, tr, sv, da, fi, no, cs, hu, ro, bg, uk, he,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  direction: "ltr" | "rtl";
  languageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "app_language";

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGUAGES.some(l => l.code === saved)) {
      return saved as Language;
    }
    const browserLang = navigator.language.split("-")[0];
    if (SUPPORTED_LANGUAGES.some(l => l.code === browserLang)) {
      return browserLang as Language;
    }
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    const info = SUPPORTED_LANGUAGES.find(l => l.code === lang);
    if (info) document.documentElement.dir = info.direction;
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    // Check sample translations first for demo content
    if (key.startsWith("sample.") && sampleTranslations[language]?.[key]) {
      let text = sampleTranslations[language][key];
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    }

    // Fallback to English for sample translations
    if (key.startsWith("sample.") && sampleTranslations.en?.[key]) {
      let text = sampleTranslations.en[key];
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          text = text.replace(`{${k}}`, String(v));
        });
      }
      return text;
    }

    // Regular translations with en fallback
    let text = translations[language]?.[key] || translations.en[key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  }, [language]);

  const languageInfo = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, direction: languageInfo.direction, languageInfo }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

export function useTranslation() {
  const { t, language } = useLanguage();
  return { t, language };
}
