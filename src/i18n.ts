import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ja from './locales/ja.json';
import en from './locales/en.json';

// ブラウザの言語設定を取得
const getBrowserLanguage = (): string => {
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('ja')) return 'ja';
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      ja: { translation: ja },
      en: { translation: en },
    },
    lng: getBrowserLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

