/**
 * Device Fingerprinting Service
 * 
 * Generates unique device fingerprints for security and audit purposes.
 * Captures device characteristics to create a consistent identifier.
 */

import type { DeviceInfo } from '@types';

/**
 * Canvas fingerprint data
 */
interface CanvasFingerprint {
  hash: string;
  supported: boolean;
}

/**
 * WebGL fingerprint data
 */
interface WebGLFingerprint {
  vendor: string;
  renderer: string;
  supported: boolean;
}

/**
 * Audio fingerprint data
 */
interface AudioFingerprint {
  hash: string;
  supported: boolean;
}

/**
 * Complete fingerprint data
 */
export interface FingerprintData {
  deviceId: string;
  fingerprint: string;
  components: {
    userAgent: string;
    platform: string;
    language: string;
    languages: readonly string[];
    screenResolution: string;
    colorDepth: number;
    timezone: number;
    timezoneString: string;
    hardwareConcurrency: number;
    maxTouchPoints: number;
    canvas?: CanvasFingerprint;
    webgl?: WebGLFingerprint;
    audio?: AudioFingerprint;
    plugins: string[];
    fonts: string[];
  };
  timestamp: string;
}

/**
 * Device Fingerprinting Service
 * Generates comprehensive device fingerprints
 */
class DeviceFingerprintService {
  private cachedFingerprint: string | null = null;
  private cachedFingerprintData: FingerprintData | null = null;

  /**
   * Generates a comprehensive device fingerprint
   * @returns Device fingerprint string
   */
  async generateFingerprint(): Promise<string> {
    if (this.cachedFingerprint) {
      return this.cachedFingerprint;
    }

    const data = await this.collectFingerprintData();
    const fingerprint = this.hashFingerprintData(data);
    
    this.cachedFingerprint = fingerprint;
    this.cachedFingerprintData = data;
    
    return fingerprint;
  }

  /**
   * Collects all fingerprint data components
   * @returns Complete fingerprint data
   */
  async collectFingerprintData(): Promise<FingerprintData> {
    const deviceId = this.getOrCreateDeviceId();

    const components = {
      userAgent: navigator.userAgent,
      platform: navigator.platform || 'unknown',
      language: navigator.language,
      languages: navigator.languages || [navigator.language],
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      colorDepth: window.screen.colorDepth,
      timezone: new Date().getTimezoneOffset(),
      timezoneString: Intl.DateTimeFormat().resolvedOptions().timeZone,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      canvas: await this.getCanvasFingerprint(),
      webgl: this.getWebGLFingerprint(),
      audio: await this.getAudioFingerprint(),
      plugins: this.getPluginsList(),
      fonts: await this.detectFonts(),
    };

    const data: FingerprintData = {
      deviceId,
      fingerprint: '', // Will be set after hashing
      components,
      timestamp: new Date().toISOString(),
    };

    data.fingerprint = this.hashFingerprintData(data);

    return data;
  }

  /**
   * Generates canvas fingerprint
   * @returns Canvas fingerprint data
   */
  private async getCanvasFingerprint(): Promise<CanvasFingerprint> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return { hash: '', supported: false };
      }

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with various styles
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Canvas Fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas Fingerprint', 4, 17);

      const dataURL = canvas.toDataURL();
      const hash = this.simpleHash(dataURL);

      return { hash, supported: true };
    } catch (error) {
      console.error('Canvas fingerprinting failed:', error);
      return { hash: '', supported: false };
    }
  }

  /**
   * Generates WebGL fingerprint
   * @returns WebGL fingerprint data
   */
  private getWebGLFingerprint(): WebGLFingerprint {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

      if (!gl) {
        return { vendor: '', renderer: '', supported: false };
      }

      const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info');
      
      if (debugInfo) {
        const vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
        const renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        return { vendor, renderer, supported: true };
      }

      return { vendor: '', renderer: '', supported: false };
    } catch (error) {
      console.error('WebGL fingerprinting failed:', error);
      return { vendor: '', renderer: '', supported: false };
    }
  }

  /**
   * Generates audio fingerprint
   * @returns Audio fingerprint data
   */
  private async getAudioFingerprint(): Promise<AudioFingerprint> {
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      
      if (!AudioContext) {
        return { hash: '', supported: false };
      }

      const context = new AudioContext();
      const oscillator = context.createOscillator();
      const analyser = context.createAnalyser();
      const gainNode = context.createGain();
      const scriptProcessor = context.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0; // Mute
      oscillator.type = 'triangle';
      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(context.destination);

      oscillator.start(0);

      const audioData: number[] = [];
      
      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event: any) => {
          const output = event.inputBuffer.getChannelData(0);
          for (let i = 0; i < output.length; i++) {
            audioData.push(output[i]);
          }

          if (audioData.length >= 4096) {
            oscillator.stop();
            scriptProcessor.disconnect();
            context.close();

            const hash = this.simpleHash(audioData.slice(0, 100).join(','));
            resolve({ hash, supported: true });
          }
        };

        // Timeout after 1 second
        setTimeout(() => {
          oscillator.stop();
          scriptProcessor.disconnect();
          context.close();
          resolve({ hash: '', supported: false });
        }, 1000);
      });
    } catch (error) {
      console.error('Audio fingerprinting failed:', error);
      return { hash: '', supported: false };
    }
  }

  /**
   * Gets list of browser plugins
   * @returns Array of plugin names
   */
  private getPluginsList(): string[] {
    try {
      const plugins: string[] = [];
      
      if (navigator.plugins && navigator.plugins.length > 0) {
        for (let i = 0; i < navigator.plugins.length; i++) {
          const plugin = navigator.plugins[i];
          if (plugin && plugin.name) {
            plugins.push(plugin.name);
          }
        }
      }

      return plugins.sort();
    } catch (error) {
      console.error('Plugin detection failed:', error);
      return [];
    }
  }

  /**
   * Detects available fonts
   * @returns Array of detected font names
   */
  private async detectFonts(): Promise<string[]> {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testFonts = [
      'Arial', 'Verdana', 'Times New Roman', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Bookman',
      'Comic Sans MS', 'Trebuchet MS', 'Impact'
    ];

    const detectedFonts: string[] = [];

    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return detectedFonts;
      }

      const testString = 'mmmmmmmmmmlli';
      const testSize = '72px';

      // Get baseline measurements
      const baselines: { [key: string]: { width: number; height: number } } = {};
      
      for (const baseFont of baseFonts) {
        ctx.font = `${testSize} ${baseFont}`;
        const metrics = ctx.measureText(testString);
        baselines[baseFont] = {
          width: metrics.width,
          height: metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        };
      }

      // Test each font
      for (const testFont of testFonts) {
        let detected = false;

        for (const baseFont of baseFonts) {
          ctx.font = `${testSize} '${testFont}', ${baseFont}`;
          const metrics = ctx.measureText(testString);
          const width = metrics.width;
          const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

          if (width !== baselines[baseFont].width || height !== baselines[baseFont].height) {
            detected = true;
            break;
          }
        }

        if (detected) {
          detectedFonts.push(testFont);
        }
      }

      return detectedFonts.sort();
    } catch (error) {
      console.error('Font detection failed:', error);
      return detectedFonts;
    }
  }

  /**
   * Hashes fingerprint data to create final fingerprint
   * @param data Fingerprint data
   * @returns Fingerprint hash
   */
  private hashFingerprintData(data: FingerprintData): string {
    const components = [
      data.components.userAgent,
      data.components.platform,
      data.components.language,
      data.components.languages.join(','),
      data.components.screenResolution,
      data.components.colorDepth,
      data.components.timezone,
      data.components.timezoneString,
      data.components.hardwareConcurrency,
      data.components.maxTouchPoints,
      data.components.canvas?.hash || '',
      data.components.webgl?.vendor || '',
      data.components.webgl?.renderer || '',
      data.components.audio?.hash || '',
      data.components.plugins.join(','),
      data.components.fonts.join(','),
    ];

    const fingerprintString = components.join('|');
    return this.simpleHash(fingerprintString);
  }

  /**
   * Simple hash function
   * @param str String to hash
   * @returns Hash string
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Gets or creates a unique device ID
   * @returns Device ID string
   */
  private getOrCreateDeviceId(): string {
    const storedDeviceId = localStorage.getItem('device_id');
    
    if (storedDeviceId) {
      return storedDeviceId;
    }

    let deviceId: string;
    
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = crypto.randomUUID();
    } else {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }

    localStorage.setItem('device_id', deviceId);
    return deviceId;
  }

  /**
   * Stores fingerprint data in session context
   * @param deviceInfo Device information to store
   */
  storeInSession(deviceInfo: DeviceInfo): void {
    try {
      sessionStorage.setItem('device_fingerprint', deviceInfo.fingerprint || '');
      sessionStorage.setItem('device_id', deviceInfo.deviceId);
    } catch (error) {
      console.error('Error storing fingerprint in session:', error);
    }
  }

  /**
   * Gets fingerprint from session
   * @returns Fingerprint string or null
   */
  getFromSession(): string | null {
    try {
      return sessionStorage.getItem('device_fingerprint');
    } catch (error) {
      console.error('Error reading fingerprint from session:', error);
      return null;
    }
  }

  /**
   * Gets cached fingerprint data
   * @returns Cached fingerprint data or null
   */
  getCachedFingerprintData(): FingerprintData | null {
    return this.cachedFingerprintData;
  }

  /**
   * Clears cached fingerprint
   */
  clearCache(): void {
    this.cachedFingerprint = null;
    this.cachedFingerprintData = null;
  }

  /**
   * Validates if two fingerprints match
   * @param fingerprint1 First fingerprint
   * @param fingerprint2 Second fingerprint
   * @returns True if fingerprints match
   */
  validateFingerprint(fingerprint1: string, fingerprint2: string): boolean {
    return fingerprint1 === fingerprint2;
  }

  /**
   * Generates a quick fingerprint (without async operations)
   * @returns Quick fingerprint string
   */
  generateQuickFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.platform,
      navigator.language,
      window.screen.width,
      window.screen.height,
      window.screen.colorDepth,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency || 0,
      navigator.maxTouchPoints || 0,
    ];

    return this.simpleHash(components.join('|'));
  }
}

// Export singleton instance
export const deviceFingerprint = new DeviceFingerprintService();
