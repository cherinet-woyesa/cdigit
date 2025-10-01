import 'i18next';
import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof enTranslations & typeof amTranslations;
    };
  }
}
