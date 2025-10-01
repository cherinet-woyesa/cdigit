import { LANGUAGE_CONFIG } from '../constants/languageConfig';

class SpeechService {
  private synth: SpeechSynthesis | null;
  private audioContext: AudioContext | null;
  isSupported: boolean;
  private voices: SpeechSynthesisVoice[];

  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.audioContext = null;
    this.isSupported = !!this.synth;
    this.voices = [];
    
    this.loadVoices();
    this.setupAudioContext();
  }

  loadVoices() {
    if (!this.isSupported || !this.synth) return;
    
    this.voices = this.synth.getVoices();
    if (this.voices.length === 0) {
      // Some browsers need this event
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth!.getVoices();
      };
    }
  }

  setupAudioContext() {
    if (typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  hasNativeSupport(langCode: string) {
    if (!this.isSupported) return false;
    
    const langConfig = LANGUAGE_CONFIG[langCode as keyof typeof LANGUAGE_CONFIG];
    if (!langConfig) return false;

    return this.voices.some(voice => 
      voice.lang.includes(langConfig.voiceCode) || 
      voice.lang.includes(langCode)
    );
  }

  getAudioUrl(langCode: string, textKey: string) {
    const audioMap: { [key: string]: string } = {
      'welcome': 'welcome.mp3',
      'select_language': 'select_language.mp3',
      'bankName': 'bank_name.mp3',
      'choose_preferred_language': 'choose_language.mp3',
    };

    const fileName = audioMap[textKey] || 'default.mp3';
    return `/assets/audio/${langCode}/${fileName}`;
  }

  async speak(text: string, langCode: string = 'en', textKey: string | null = null): Promise<boolean> {
    if (!this.isSupported) {
      console.warn('Speech synthesis not supported in this browser');
      return false;
    }

    // Simplified strategy: always try native speech synthesis
    return this.speakNative(text, langCode);
  }

  speakNative(text: string, langCode: string): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve(false);
        return;
      }
      this.synth.cancel(); // Stop any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      const voice = this.findVoiceForLanguage(langCode);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = langCode;
      }

      utterance.rate = 0.8;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve(true);
      utterance.onerror = () => resolve(false);

      this.synth.speak(utterance);
    });
  }

  async playPreRecordedAudio(langCode: string, textKey: string): Promise<boolean> {
    return new Promise((resolve) => {
      const audioUrl = this.getAudioUrl(langCode, textKey);
      const audio = new Audio(audioUrl);
      
      audio.play().then(() => {
        audio.onended = () => resolve(true);
        audio.onerror = () => {
          console.error(`Failed to play audio for ${langCode}: ${textKey}`);
          resolve(false);
        };
      }).catch(error => {
        console.error('Audio play failed:', error);
        resolve(false);
      });
    });
  }

  findVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    const langConfig = LANGUAGE_CONFIG[langCode as keyof typeof LANGUAGE_CONFIG];
    if (!langConfig) return null;

    return this.voices.find(voice => 
      voice.lang.includes(langConfig.voiceCode) || 
      voice.lang.includes(langCode)
    ) || this.voices[0]; // Fallback to first available voice
  }

  stop() {
    if (this.isSupported && this.synth) {
      this.synth.cancel();
    }
  }

  getSpeechSupportStatus(langCode: string): string {
    if (!this.isSupported) return 'unsupported_browser';
    
    // Simplified status check
    return this.hasNativeSupport(langCode) ? 'native' : 'fallback';
  }
}

export const speechService = new SpeechService();
export default speechService;
