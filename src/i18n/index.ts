import { getLocales, type Locale } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import es from './locales/es.json';
import fr from './locales/fr.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';
import zhHans from './locales/zh-Hans.json';
import zhHant from './locales/zh-Hant.json';

/**
 * App translations (i18next). Keys are the English strings themselves — `t('Create Account')` —
 * so English needs no resource file and any string missing from a translation falls back to English.
 * Add a language: create `locales/<code>.json`, register it in `resources` and `LANGUAGES`.
 */
export type AppLanguage = 'en' | 'ja' | 'es' | 'fr' | 'zh-Hant' | 'zh-Hans' | 'ko';

export const LANGUAGES: { code: AppLanguage; name: string; nativeName: string; locale: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English', locale: 'en-GB' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', locale: 'ja-JP' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', locale: 'es-ES' },
  { code: 'fr', name: 'French', nativeName: 'Français', locale: 'fr-FR' },
  { code: 'zh-Hant', name: 'Traditional Chinese', nativeName: '繁體中文', locale: 'zh-TW' },
  { code: 'zh-Hans', name: 'Simplified Chinese', nativeName: '简体中文', locale: 'zh-CN' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', locale: 'ko-KR' },
];

const LANGUAGE_KEY = 'elmonx_pref_language';

function isAppLanguage(value: unknown): value is AppLanguage {
  return LANGUAGES.some((language) => language.code === value);
}

/** Chinese is split by script: Traditional for zh-Hant / Taiwan / Hong Kong / Macau, else Simplified. */
function deviceLanguage(locale: Locale): AppLanguage | null {
  if (locale.languageCode === 'zh') {
    const traditional =
      locale.languageScriptCode === 'Hant' || ['TW', 'HK', 'MO'].includes(locale.regionCode ?? '');
    return traditional ? 'zh-Hant' : 'zh-Hans';
  }
  return isAppLanguage(locale.languageCode) ? locale.languageCode : null;
}

/** Saved choice first, else the phone's preferred language when we support it, else English. */
function initialLanguage(): AppLanguage {
  try {
    const saved = SecureStore.getItem(LANGUAGE_KEY);
    if (isAppLanguage(saved)) return saved;
  } catch {
    // fall through to the device language
  }
  try {
    for (const locale of getLocales()) {
      const language = deviceLanguage(locale);
      if (language) return language;
    }
  } catch {
    // fall through
  }
  return 'en';
}

// eslint-disable-next-line import/no-named-as-default-member -- i18next's documented instance API
i18n.use(initReactI18next).init({
  resources: {
    en: { translation: {} },
    ja: { translation: ja },
    es: { translation: es },
    fr: { translation: fr },
    'zh-Hant': { translation: zhHant },
    'zh-Hans': { translation: zhHans },
    ko: { translation: ko },
  },
  lng: initialLanguage(),
  fallbackLng: 'en',
  // Natural-language keys contain "." and ":" — don't treat them as separators.
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
  returnEmptyString: false,
  initAsync: false,
});

export function currentLanguage(): AppLanguage {
  return isAppLanguage(i18n.language) ? i18n.language : 'en';
}

export function setAppLanguage(language: AppLanguage) {
  // eslint-disable-next-line import/no-named-as-default-member -- i18next's documented instance API
  void i18n.changeLanguage(language);
  SecureStore.setItemAsync(LANGUAGE_KEY, language).catch(() => {});
}

/**
 * Locale for `toLocaleString` & co. Other languages get their own formats; English keeps the format
 * each screen already used (some mirror the website's en-US, others en-GB).
 */
export function appLocale(englishLocale = 'en-GB'): string {
  const language = currentLanguage();
  if (language === 'en') return englishLocale;
  return LANGUAGES.find((item) => item.code === language)?.locale ?? englishLocale;
}

export default i18n;
