import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all language files - Vite handles JSON imports
import en from './locales/en.json';
import el from './locales/el.json';
import sq from './locales/sq.json';
import de from './locales/de.json';
import fr from './locales/fr.json';
import es from './locales/es.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import tr from './locales/tr.json';
import nl from './locales/nl.json';
import pl from './locales/pl.json';
import sv from './locales/sv.json';
import da from './locales/da.json';
import fi from './locales/fi.json';
import no from './locales/no.json';
import cs from './locales/cs.json';
import hu from './locales/hu.json';
import ro from './locales/ro.json';
import bg from './locales/bg.json';
import uk from './locales/uk.json';

export const languages = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '��', direction: 'ltr' as const },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷', direction: 'ltr' as const },
  { code: 'sq', name: 'Albanian', nativeName: 'Shqip', flag: '🇦🇱', direction: 'ltr' as const },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', direction: 'ltr' as const },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' as const },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', direction: 'ltr' as const },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', direction: 'ltr' as const },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', direction: 'ltr' as const },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', direction: 'ltr' as const },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', direction: 'ltr' as const },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', direction: 'ltr' as const },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', direction: 'ltr' as const },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', direction: 'rtl' as const },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', direction: 'ltr' as const },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', direction: 'ltr' as const },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', direction: 'ltr' as const },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱', direction: 'ltr' as const },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', direction: 'ltr' as const },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', direction: 'ltr' as const },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', direction: 'ltr' as const },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', direction: 'ltr' as const },
  { code: 'cs', name: 'Czech', nativeName: 'Čeština', flag: '🇨🇿', direction: 'ltr' as const },
  { code: 'hu', name: 'Hungarian', nativeName: 'Magyar', flag: '🇭🇺', direction: 'ltr' as const },
  { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', direction: 'ltr' as const },
  { code: 'bg', name: 'Bulgarian', nativeName: 'Български', flag: '🇧🇬', direction: 'ltr' as const },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦', direction: 'ltr' as const },
] as const;

export type LanguageCode = typeof languages[number]['code'];

const resources = {
  en: { translation: en },
  el: { translation: el },
  sq: { translation: sq },
  de: { translation: de },
  fr: { translation: fr },
  es: { translation: es },
  it: { translation: it },
  pt: { translation: pt },
  ru: { translation: ru },
  zh: { translation: zh },
  ja: { translation: ja },
  ko: { translation: ko },
  ar: { translation: ar },
  hi: { translation: hi },
  tr: { translation: tr },
  nl: { translation: nl },
  pl: { translation: pl },
  sv: { translation: sv },
  da: { translation: da },
  fi: { translation: fi },
  no: { translation: no },
  cs: { translation: cs },
  hu: { translation: hu },
  ro: { translation: ro },
  bg: { translation: bg },
  uk: { translation: uk },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
