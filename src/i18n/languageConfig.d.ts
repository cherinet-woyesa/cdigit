export interface LanguageConfig {
  name: string;
  nativeName: string;
  flag: string;
  voiceCode: string;
  direction: 'ltr' | 'rtl';
  speechSupport: 'native' | 'prerecorded' | 'fallback' | 'unsupported';
}

export const LANGUAGE_CONFIG: Record<string, LanguageConfig>;
export const SPEECH_STRATEGY: {
  NATIVE: 'native';
  PRERECORDED: 'prerecorded';
  FALLBACK: 'fallback';
  UNSUPPORTED: 'unsupported';
};

export const AVAILABLE_LANGUAGES: Array<{
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  direction: 'ltr' | 'rtl';
}>;
