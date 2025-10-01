type SpeechSupportStatus = 'native' | 'prerecorded' | 'fallback' | 'unsupported_browser' | 'unsupported';

declare class SpeechService {
  constructor();
  synth: SpeechSynthesis | null;
  audioContext: AudioContext | null;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  
  loadVoices(): void;
  setupAudioContext(): void;
  hasNativeSupport(langCode: string): boolean;
  getAudioUrl(langCode: string, textKey: string): string | null;
  speak(text: string, langCode: string, textKey?: string | null): Promise<void>;
  stop(): void;
  getSpeechSupport(langCode: string): SpeechSupportStatus;
  getSpeechSupportStatus(langCode: string): SpeechSupportStatus;
  speakWithNativeTTS(text: string, langCode: string): Promise<void>;
  speakWithPreRecorded(langCode: string, textKey: string): Promise<void>;
  speakWithFallback(text: string): Promise<void>;
  checkCompatibility(): void;
}

export const speechService: SpeechService;
export default speechService;
