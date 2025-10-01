// constants/languageConfig.ts
export type LanguageCode = keyof typeof LANGUAGE_CONFIG;

export interface LanguageConfig {
  name: string;
  nativeName: string;
  flag: string;
  voiceCode: string;
  direction: 'ltr' | 'rtl';
}

export interface Language extends LanguageConfig {
  code: LanguageCode;
}

export const LANGUAGE_CONFIG = {
  en: { 
    name: 'English', 
    nativeName: 'English',
    flag: '🇬🇧',
    voiceCode: 'en-US',
    direction: 'ltr'
  },
  am: { 
    name: 'Amharic', 
    nativeName: 'አማርኛ',
    flag: '🇪🇹',
    voiceCode: 'am-ET',
    direction: 'ltr'
  },
  om: { 
    name: 'Oromo', 
    nativeName: 'Afaan Oromoo',
    flag: '🇪🇹',
    voiceCode: 'om-ET',
    direction: 'ltr'
  },
  ti: { 
    name: 'Tigrinya', 
    nativeName: 'ትግርኛ',
    flag: '🇪🇹',
    voiceCode: 'ti-ET',
    direction: 'ltr'
  },
  so: { 
    name: 'Somali', 
    nativeName: 'Soomaali',
    flag: '🇸🇴',
    voiceCode: 'so-SO',
    direction: 'ltr'
  },
  aa: { 
    name: 'Afar', 
    nativeName: 'Qafar',
    flag: '🇪🇷',
    voiceCode: 'aa-ER',
    direction: 'ltr'
  },
  sid: { 
    name: 'Sidamo', 
    nativeName: 'Sidaamu Afo',
    flag: '🇪🇹',
    voiceCode: 'sid-ET',
    direction: 'ltr'
  },
  wal: { 
    name: 'Wolaytta', 
    nativeName: 'Wolayttatto',
    flag: '🇪🇹',
    voiceCode: 'wal-ET',
    direction: 'ltr'
  },
  sgw: { 
    name: 'Gurage', 
    nativeName: 'ጉራጌ',
    flag: '🇪🇹',
    voiceCode: 'sgw-ET',
    direction: 'ltr'
  },
  hdy: { 
    name: 'Hadiyya', 
    nativeName: 'Hadiyyisa',
    flag: '🇪🇹',
    voiceCode: 'hdy-ET',
    direction: 'ltr'
  },
} as const;

export const LANGUAGES: Language[] = (Object.entries(LANGUAGE_CONFIG) as [LanguageCode, LanguageConfig][]).map(([code, config]) => ({
  code,
  ...config
}));

// Export individual language codes as values (not types)
export const LANGUAGE_CODES = {
  EN: 'en',
  AM: 'am', 
  OM: 'om',
  TI: 'ti',
  SO: 'so',
  AA: 'aa',
  SID: 'sid',
  WAL: 'wal',
  SGW: 'sgw',
  HDY: 'hdy'
} as const;