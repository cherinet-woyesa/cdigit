import 'i18next';
import enTranslations from './locales/en/translation.json';
import amTranslations from './locales/am/translation.json';
import omTranslations from './locales/om/translation.json';
import tiTranslations from './locales/ti/translation.json';
import sidTranslations from './locales/sid/translation.json';
import walTranslations from './locales/wal/translation.json';
import aaTranslations from './locales/aa/translation.json';
import sgwTranslations from './locales/sgw/translation.json';
import hdyTranslations from './locales/hdy/translation.json';
import soTranslations from './locales/so/translation.json';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof enTranslations &
        typeof amTranslations &
        typeof omTranslations &
        typeof tiTranslations &
        typeof sidTranslations &
        typeof walTranslations &
        typeof aaTranslations &
        typeof sgwTranslations &
        typeof hdyTranslations &
        typeof soTranslations;
    };
  }
}