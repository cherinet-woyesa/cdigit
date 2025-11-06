import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import all translation files
import translationEN from './locales/en/translation.json';
import translationAM from './locales/am/translation.json';
import translationOM from './locales/om/translation.json';
import translationTI from './locales/ti/translation.json';
import translationAA from './locales/aa/translation.json';
import translationSGW from './locales/sgw/translation.json';

const resources = {
  en: {
    translation: translationEN
  },
  am: {
    translation: translationAM
  },
  om: {
    translation: translationOM
  },
  ti: {
    translation: translationTI
  },
  aa: {
    translation: translationAA
  },
  sgw: {
    translation: translationSGW
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    supportedLngs: ['en', 'am', 'om', 'ti', 'aa', 'sgw'],
  });

export default i18n;